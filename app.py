from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import imaplib
import email
from email.header import decode_header
from datetime import datetime
import base64

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration de Mammouth IA
MAMMOUTH_API_URL = "https://api.mammouth.ai/v1/chat/completions"
MAMMOUTH_API_KEY = os.getenv("API_KEY_MAMMOUTH")

# Historique des conversations (en mémoire pour la simplicité)
conversation_history = {}

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/chatbot')
def chatbot():
    return render_template('index.html')

@app.route('/email-agent')
def email_agent():
    return render_template('email_agent.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        session_id = data.get('session_id', 'default')
        
        if not user_message:
            return jsonify({'error': 'Message requis'}), 400
        
        # Initialiser l'historique de conversation si nécessaire
        if session_id not in conversation_history:
            conversation_history[session_id] = []
        
        # Ajouter le message de l'utilisateur à l'historique
        conversation_history[session_id].append({
            "role": "user",
            "content": user_message
        })
        
        # Limiter l'historique aux 10 derniers messages pour éviter de dépasser les limites
        if len(conversation_history[session_id]) > 10:
            conversation_history[session_id] = conversation_history[session_id][-10:]
        
        # Appeler l'API Mammouth IA
        headers = {
            "Authorization": MAMMOUTH_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4.1",
            "messages": conversation_history[session_id]
        }
        
        response = requests.post(MAMMOUTH_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        response_data = response.json()
        assistant_message = response_data['choices'][0]['message']['content']
        
        # Ajouter la réponse de l'assistant à l'historique
        conversation_history[session_id].append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return jsonify({
            'response': assistant_message,
            'session_id': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear', methods=['POST'])
def clear_conversation():
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        
        if session_id in conversation_history:
            conversation_history[session_id] = []
        
        return jsonify({'message': 'Conversation effacée'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Email Agent Endpoints
@app.route('/api/email/connect', methods=['POST'])
def email_connect():
    try:
        data = request.json
        email_address = data.get('email')
        password = data.get('password')
        
        if not email_address or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        # Test de connexion IMAP
        imap = imaplib.IMAP4_SSL('imap.gmail.com')
        imap.login(email_address, password)
        imap.logout()
        
        return jsonify({'message': 'Connexion réussie', 'email': email_address})
    
    except imaplib.IMAP4.error as e:
        return jsonify({'error': 'Échec de connexion Gmail. Vérifiez vos identifiants ou utilisez un mot de passe d\'application.'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/list', methods=['POST'])
def email_list():
    try:
        data = request.json
        email_address = data.get('email')
        password = data.get('password')
        max_results = data.get('max_results', 20)
        
        if not email_address or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        # Connexion IMAP
        imap = imaplib.IMAP4_SSL('imap.gmail.com')
        imap.login(email_address, password)
        imap.select('INBOX')
        
        # Récupérer les emails récents
        _, message_numbers = imap.search(None, 'ALL')
        message_ids = message_numbers[0].split()
        
        # Limiter au nombre demandé (les plus récents)
        message_ids = message_ids[-max_results:]
        message_ids.reverse()
        
        emails = []
        
        for msg_id in message_ids:
            try:
                _, msg_data = imap.fetch(msg_id, '(RFC822)')
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                # Décoder le sujet
                subject = decode_header(email_message['Subject'])[0][0]
                if isinstance(subject, bytes):
                    subject = subject.decode()
                
                # Récupérer l'expéditeur
                from_header = email_message.get('From', '')
                
                # Récupérer la date
                date_str = email_message.get('Date', '')
                try:
                    date_obj = email.utils.parsedate_to_datetime(date_str)
                    formatted_date = date_obj.strftime('%d/%m/%Y %H:%M')
                except:
                    formatted_date = date_str
                
                # Récupérer un aperçu du contenu
                snippet = ''
                if email_message.is_multipart():
                    for part in email_message.walk():
                        if part.get_content_type() == 'text/plain':
                            try:
                                snippet = part.get_payload(decode=True).decode()[:200]
                                break
                            except:
                                pass
                else:
                    try:
                        snippet = email_message.get_payload(decode=True).decode()[:200]
                    except:
                        snippet = 'Impossible de lire le contenu'
                
                emails.append({
                    'id': msg_id.decode(),
                    'from': from_header,
                    'subject': subject,
                    'date': formatted_date,
                    'snippet': snippet.replace('\n', ' ').strip(),
                    'unread': True  # Simplification, on pourrait vérifier les flags
                })
                
            except Exception as e:
                print(f"Erreur lors du traitement de l'email {msg_id}: {e}")
                continue
        
        imap.logout()
        
        return jsonify({'emails': emails, 'total': len(emails)})
    
    except imaplib.IMAP4.error as e:
        return jsonify({'error': 'Erreur d\'accès Gmail'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/email/analyze', methods=['POST'])
def email_analyze():
    try:
        data = request.json
        question = data.get('question')
        emails_data = data.get('emails', [])
        
        if not question:
            return jsonify({'error': 'Question requise'}), 400
        
        # Préparer le contexte avec les emails
        emails_context = "Voici les emails récents de l'utilisateur:\n\n"
        for idx, email_item in enumerate(emails_data[:10], 1):  # Limiter à 10 emails pour le contexte
            emails_context += f"Email {idx}:\n"
            emails_context += f"De: {email_item.get('from', 'Inconnu')}\n"
            emails_context += f"Sujet: {email_item.get('subject', 'Sans sujet')}\n"
            emails_context += f"Date: {email_item.get('date', 'Date inconnue')}\n"
            emails_context += f"Aperçu: {email_item.get('snippet', '')}\n\n"
        
        # Créer le prompt pour l'IA
        messages = [
            {
                "role": "system",
                "content": "Tu es un assistant IA spécialisé dans l'analyse d'emails. Aide l'utilisateur à comprendre et gérer ses emails."
            },
            {
                "role": "user",
                "content": f"{emails_context}\n\nQuestion de l'utilisateur: {question}"
            }
        ]
        
        # Appeler l'API Mammouth IA
        headers = {
            "Authorization": MAMMOUTH_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4.1",
            "messages": messages
        }
        
        response = requests.post(MAMMOUTH_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        response_data = response.json()
        assistant_message = response_data['choices'][0]['message']['content']
        
        return jsonify({'response': assistant_message})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

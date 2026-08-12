// Générer un ID de session unique
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Éléments du DOM
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// Envoyer le message avec Enter (Shift+Enter pour nouvelle ligne)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Bouton d'envoi
sendBtn.addEventListener('click', sendMessage);

// Bouton pour effacer la conversation
clearBtn.addEventListener('click', clearConversation);

// Fonction pour ajouter un message au chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    // Scroll vers le bas
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

// Fonction pour ajouter un indicateur de chargement
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loading-indicator';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = '<span class="loading">En train d\'écrire</span>';
    
    loadingDiv.appendChild(messageContent);
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return loadingDiv;
}

// Fonction pour supprimer l'indicateur de chargement
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Fonction pour envoyer un message
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Désactiver l'input et le bouton pendant l'envoi
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    // Ajouter le message de l'utilisateur
    addMessage(message, true);
    
    // Réinitialiser l'input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Ajouter l'indicateur de chargement
    addLoadingIndicator();
    
    try {
        // Envoyer la requête à l'API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            })
        });
        
        const data = await response.json();
        
        // Supprimer l'indicateur de chargement
        removeLoadingIndicator();
        
        if (response.ok) {
            // Ajouter la réponse du bot
            addMessage(data.response, false);
        } else {
            // Afficher l'erreur
            addMessage('Erreur: ' + (data.error || 'Une erreur est survenue'), false);
        }
    } catch (error) {
        removeLoadingIndicator();
        addMessage('Erreur de connexion au serveur', false);
        console.error('Erreur:', error);
    } finally {
        // Réactiver l'input et le bouton
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Fonction pour effacer la conversation
async function clearConversation() {
    try {
        const response = await fetch('/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });
        
        if (response.ok) {
            // Générer un nouvel ID de session
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Effacer le chat visuellement
            chatContainer.innerHTML = '';
            
            // Ajouter le message de bienvenue
            addMessage('Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd\'hui ?', false);
        }
    } catch (error) {
        console.error('Erreur lors de l\'effacement:', error);
        alert('Erreur lors de l\'effacement de la conversation');
    }
}

// Focus sur l'input au chargement
userInput.focus();

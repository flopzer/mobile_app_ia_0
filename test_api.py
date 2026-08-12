import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Test de l'API Mammouth
url = "https://api.mammouth.ai/v1/chat/completions"
headers = {
    "Authorization": os.getenv("API_KEY_MAMMOUTH"),
    "Content-Type": "application/json"
}

payload = {
    "model": "gpt-4.1",
    "messages": [
        {
            "role": "user",
            "content": "Dis bonjour en une phrase"
        }
    ]
}

print("Test de l'API Mammouth IA...")
print(f"URL: {url}")
print(f"Headers: {headers}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nRéponse de l'IA: {data['choices'][0]['message']['content']}")
    else:
        print(f"\nErreur: {response.text}")
except Exception as e:
    print(f"\nException: {e}")

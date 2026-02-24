import requests
from dotenv import load_dotenv
import os
import openai

load_dotenv()


# Configurer le client pour utiliser Mammouth.ai
openai.api_base = os.getenv("URL_BASE_MAMMOUTH")
openai.api_key = os.getenv("API_KEY_MAMMOUTH")

response = openai.ChatCompletion.create(
    model="gpt-4.1",
    messages=[
        {
            "role": "user", 
            "content": "parett a til des grosse baloche ?"
            }
    ]
)

print(response.choices[0].message.content)
# Assistant IA Mammouth

Application web avec chatbot IA et agent d'analyse d'emails.

## Installation

1. Installer les dépendances :
```bash
pip install -r requirements.txt
```

2. Configurer les variables d'environnement dans le fichier `.env` :
```
API_KEY_MAMMOUTH="Bearer votre_clé_api"
URL_BASE_MAMMOUTH="https://api.mammouth.ai/v1/chat/completions"
```

3. Pour l'Email Agent, suivre les instructions dans `GMAIL_SETUP.md` pour configurer l'accès Gmail

4. Lancer l'application :
```bash
python app.py
```

5. Ouvrir votre navigateur à l'adresse :
```
http://localhost:5000
```

## Architecture

```
.
├── app.py                      # Backend Flask avec API REST
├── templates/
│   ├── home.html              # Page d'accueil avec sélection de mode
│   ├── index.html             # Interface chatbot classique
│   └── email_agent.html       # Interface agent email
├── static/
│   ├── css/
│   │   ├── home.css           # Styles page d'accueil
│   │   ├── style.css          # Styles chatbot
│   │   └── email_agent.css    # Styles agent email
│   └── js/
│       ├── app.js             # Logique chatbot
│       └── email_agent.js     # Logique agent email
├── requirements.txt           # Dépendances Python
├── .env                       # Configuration API (non versionné)
└── GMAIL_SETUP.md            # Instructions configuration Gmail
```

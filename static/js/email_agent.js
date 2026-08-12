// Sections
const loginSection = document.getElementById('login-section');
const emailSection = document.getElementById('email-section');

// Login form
const loginForm = document.getElementById('gmail-login-form');
const connectBtn = document.getElementById('connect-btn');

// Email interface
const connectedEmailEl = document.getElementById('connected-email');
const disconnectBtn = document.getElementById('disconnect-btn');
const refreshEmailsBtn = document.getElementById('refresh-emails');
const emailsList = document.getElementById('emails-list');
const loadingEl = document.getElementById('loading');
const totalEmailsEl = document.getElementById('total-emails');
const unreadEmailsEl = document.getElementById('unread-emails');

// AI Assistant
const aiMessages = document.getElementById('ai-messages');
const aiInput = document.getElementById('ai-input');
const aiSendBtn = document.getElementById('ai-send-btn');

// Session storage
let currentEmail = null;
let currentPassword = null;
let emails = [];

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span>Connexion en cours...</span>';
    
    try {
        const response = await fetch('/api/email/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentEmail = email;
            currentPassword = password;
            connectedEmailEl.textContent = email;
            
            // Switch to email interface
            loginSection.classList.add('hidden');
            emailSection.classList.remove('hidden');
            
            // Load emails
            loadEmails();
        } else {
            alert('Erreur de connexion: ' + (data.error || 'Vérifiez vos identifiants'));
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
        console.error('Erreur:', error);
    } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<span>Se connecter</span>';
    }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
    currentEmail = null;
    currentPassword = null;
    emails = [];
    
    loginSection.classList.remove('hidden');
    emailSection.classList.add('hidden');
    
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
});

// Refresh emails
refreshEmailsBtn.addEventListener('click', loadEmails);

// Load emails function
async function loadEmails() {
    if (!currentEmail || !currentPassword) return;
    
    emailsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Chargement des emails...</p></div>';
    
    try {
        const response = await fetch('/api/email/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentEmail,
                password: currentPassword,
                max_results: 20
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            emails = data.emails || [];
            displayEmails(emails);
            
            // Update stats
            totalEmailsEl.textContent = emails.length;
            unreadEmailsEl.textContent = emails.filter(e => e.unread).length;
        } else {
            emailsList.innerHTML = '<div class="loading"><p>Erreur: ' + (data.error || 'Impossible de charger les emails') + '</p></div>';
        }
    } catch (error) {
        emailsList.innerHTML = '<div class="loading"><p>Erreur de connexion au serveur</p></div>';
        console.error('Erreur:', error);
    }
}

// Display emails
function displayEmails(emailList) {
    if (emailList.length === 0) {
        emailsList.innerHTML = '<div class="loading"><p>Aucun email trouvé</p></div>';
        return;
    }
    
    emailsList.innerHTML = emailList.map(email => `
        <div class="email-item ${email.unread ? 'unread' : ''}">
            <div class="email-header">
                <span class="email-from">${email.from}</span>
                <span class="email-date">${email.date}</span>
            </div>
            <div class="email-subject">${email.subject}</div>
            <div class="email-preview">${email.snippet}</div>
        </div>
    `).join('');
}

// AI Assistant
aiSendBtn.addEventListener('click', sendAIMessage);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendAIMessage();
    }
});

async function sendAIMessage() {
    const message = aiInput.value.trim();
    if (!message) return;
    
    // Add user message
    addAIMessage(message, true);
    aiInput.value = '';
    
    // Add loading indicator
    const loadingId = addAIMessage('En train de réfléchir...', false, true);
    
    try {
        const response = await fetch('/api/email/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentEmail,
                password: currentPassword,
                question: message,
                emails: emails
            })
        });
        
        const data = await response.json();
        
        // Remove loading
        removeAIMessage(loadingId);
        
        if (response.ok) {
            addAIMessage(data.response, false);
        } else {
            addAIMessage('Erreur: ' + (data.error || 'Impossible de traiter votre demande'), false);
        }
    } catch (error) {
        removeAIMessage(loadingId);
        addAIMessage('Erreur de connexion au serveur', false);
        console.error('Erreur:', error);
    }
}

let messageIdCounter = 0;

function addAIMessage(content, isUser = false, isLoading = false) {
    const messageId = `msg-${messageIdCounter++}`;
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    messageDiv.id = messageId;
    messageDiv.innerHTML = `<p>${content}</p>`;
    
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    
    return messageId;
}

function removeAIMessage(messageId) {
    const messageEl = document.getElementById(messageId);
    if (messageEl) {
        messageEl.remove();
    }
}

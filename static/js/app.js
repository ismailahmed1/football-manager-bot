let managers = [];
let currentManager = null;
let currentResponseType = null;
let isProcessing = false;
let chatHistory = [];

// Fetch available managers when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchManagers();
    setupEventListeners();
    loadChatHistory();
});

function fetchManagers() {
    fetch('/api/managers')
        .then(response => response.json())
        .then(data => {
            managers = data.available_managers;
            const managerSelect = document.getElementById('manager-select');
            // Clear existing options except the first one
            while (managerSelect.options.length > 1) {
                managerSelect.remove(1);
            }
            managers.forEach(manager => {
                const option = document.createElement('option');
                option.value = manager;
                option.textContent = manager;
                managerSelect.appendChild(option);
            });
            // Set initial manager
            if (managers.length > 0) {
                currentManager = managers[0];
                updateManagerUI(currentManager);
            }
        })
        .catch(error => {
            console.error('Error fetching managers:', error);
            showError('Failed to load managers. Please try refreshing the page.');
        });
}

function setupEventListeners() {
    const managerSelect = document.getElementById('manager-select');
    const responseTypeSelect = document.getElementById('response-type-select');
    const messageInput = document.getElementById('user-message');
    const sendButton = document.getElementById('send-message');
    const resetButton = document.getElementById('reset-chat');

    managerSelect.addEventListener('change', function() {
        currentManager = this.value;
        updateManagerUI(currentManager);
        updateResponseTypes();
        updateSendButtonState();
    });

    responseTypeSelect.addEventListener('change', function() {
        currentResponseType = this.value;
        updateSendButtonState();
    });

    messageInput.addEventListener('input', updateSendButtonState);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !isProcessing) {
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);
    
    resetButton.addEventListener('click', resetChat);
}

function updateManagerUI(managerName) {
    // Update side panels background
    document.documentElement.style.setProperty('--manager-color', getManagerColor(managerName));
    document.documentElement.style.setProperty('--manager-gradient', getManagerGradient(managerName));

    // Update manager images on both sides
    const leftImages = document.querySelectorAll('.left-panel .manager-image');
    const rightImages = document.querySelectorAll('.right-panel .manager-image');
    
    leftImages.forEach(img => {
        if (img.dataset.manager === managerName) {
            img.classList.add('active');
        } else {
            img.classList.remove('active');
        }
    });

    rightImages.forEach(img => {
        if (img.dataset.manager === managerName) {
            img.classList.add('active');
        } else {
            img.classList.remove('active');
        }
    });

    // Add connection message
    addConnectionMessage(managerName);
}

function getManagerColor(managerName) {
    switch(managerName) {
        case 'José Mourinho':
            return '#1a237e';
        case 'Pep Guardiola':
            return '#2196f3';
        case 'Jurgen Klopp':
            return '#f44336';
        default:
            return '#1a237e';
    }
}

function getManagerGradient(managerName) {
    switch(managerName) {
        case 'José Mourinho':
            return 'linear-gradient(45deg, rgba(26, 35, 126, 0.9), rgba(26, 35, 126, 0.7))';
        case 'Pep Guardiola':
            return 'linear-gradient(45deg, rgba(33, 150, 243, 0.9), rgba(33, 150, 243, 0.7))';
        case 'Jurgen Klopp':
            return 'linear-gradient(45deg, rgba(244, 67, 54, 0.9), rgba(244, 67, 54, 0.7))';
        default:
            return 'linear-gradient(45deg, rgba(26, 35, 126, 0.9), rgba(26, 35, 126, 0.7))';
    }
}

function updateResponseTypes() {
    const responseTypeSelect = document.getElementById('response-type-select');
    responseTypeSelect.innerHTML = '<option value="">Select Response Type</option>';
    
    if (!currentManager) return;
    
    const manager = managers.find(m => m === currentManager);
    if (manager) {
        fetch('/api/managers')
            .then(response => response.json())
            .then(data => {
                const managerData = data.manager_styles[manager];
                if (managerData) {
                    managerData.response_types.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type;
                        option.textContent = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        responseTypeSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching response types:', error);
                showError('Failed to load response types. Please try again.');
            });
    }
}

function updateSendButtonState() {
    const messageInput = document.getElementById('user-message');
    const sendButton = document.getElementById('send-message');
    const isMessageValid = messageInput.value.trim().length > 0;
    const isFormValid = currentManager && currentResponseType && isMessageValid;
    
    sendButton.disabled = !isFormValid || isProcessing;
}

function sendMessage() {
    if (isProcessing) return;
    
    const messageInput = document.getElementById('user-message');
    const message = messageInput.value.trim();
    
    if (!message || !currentManager || !currentResponseType) {
        showError('Please select a manager, response type, and enter a message');
        return;
    }

    isProcessing = true;
    updateSendButtonState();
    
    // Add user message to chat
    addMessageToChat('You', message, 'user-message');
    messageInput.value = '';

    // Send request to backend
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            manager: currentManager,
            response_type: currentResponseType
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Add bot response to chat
        addMessageToChat(currentManager, data.response, 'bot-message');
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Failed to send message. Please try again.');
    })
    .finally(() => {
        isProcessing = false;
        updateSendButtonState();
    });
}

function addMessageToChat(sender, content, className) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.setAttribute('role', 'article');
    
    if (className === 'bot-message') {
        messageDiv.setAttribute('data-manager', sender);
    }
    
    // Create message header with avatar
    const header = document.createElement('div');
    header.className = 'message-header';
    
    if (className === 'bot-message') {
        const avatar = document.createElement('img');
        avatar.className = 'manager-avatar';
        avatar.src = getManagerAvatar(sender);
        avatar.alt = `${sender}'s avatar`;
        
        const name = document.createElement('span');
        name.className = 'manager-name';
        name.textContent = sender;
        
        header.appendChild(avatar);
        header.appendChild(name);
    } else {
        const name = document.createElement('span');
        name.className = 'manager-name';
        name.textContent = 'You';
        header.appendChild(name);
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Convert markdown to HTML
    let formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/\n/g, '<br>'); // Line breaks
    
    messageContent.innerHTML = formattedContent;
    
    // Clear existing content and append in correct order
    messageDiv.innerHTML = '';
    messageDiv.appendChild(header);
    messageDiv.appendChild(messageContent);
    chatBox.appendChild(messageDiv);
    
    // Save to history
    chatHistory.push({
        type: 'message',
        sender: sender,
        content: content,
        className: className,
        timestamp: new Date().toISOString()
    });
    saveChatHistory();
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getManagerAvatar(managerName) {
    const avatarMap = {
        'José Mourinho': '/static/images/mourinho3.jpg',
        'Pep Guardiola': '/static/images/guardiola3.jpg',
        'Jurgen Klopp': '/static/images/klopp3.jpg'
    };
    return avatarMap[managerName] || '';
}

function showError(message) {
    const chatBox = document.getElementById('chat-box');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.textContent = message;
    chatBox.appendChild(errorDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        renderChatHistory();
    }
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function renderChatHistory() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    
    chatHistory.forEach(entry => {
        if (entry.type === 'connection') {
            addConnectionMessage(entry.manager);
        } else {
            addMessageToChat(entry.sender, entry.content, entry.className);
        }
    });
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addConnectionMessage(managerName) {
    const chatBox = document.getElementById('chat-box');
    const connectionMessage = document.createElement('div');
    connectionMessage.className = 'message connection-message';
    connectionMessage.textContent = `Connected to ${managerName} through Sewy's exclusive connection!`;
    chatBox.appendChild(connectionMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Save to history
    chatHistory.push({
        type: 'connection',
        manager: managerName,
        timestamp: new Date().toISOString()
    });
    saveChatHistory();
}

function resetChat() {
    if (confirm('Are you sure you want to reset the chat? This will clear all messages.')) {
        chatHistory = [];
        saveChatHistory();
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        
        // Add a fresh connection message if there's a current manager
        if (currentManager) {
            addConnectionMessage(currentManager);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-message');
    const userMessageInput = document.getElementById('user-message');

    function convertMarkdownToHTML(text) {
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return text;
    }

    sendButton.addEventListener('click', async () => {
        const message = userMessageInput.value;
        const manager = document.getElementById('manager-select').value;
        const responseType = document.getElementById('response-type-select').value;

        if (!message.trim()) return;

        appendMessage('You', message, 'user');
        userMessageInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    manager,
                    response_type: responseType,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                appendMessage(manager, data.response, 'bot', responseType);
            } else {
                appendMessage('Error', data.error, 'error');
            }
        } catch (error) {
            appendMessage('Error', error.message, 'error');
        }
    });

    function appendMessage(sender, message, type, responseType = '') {
        const chatBox = document.getElementById('chat-box');
        const messageElement = document.createElement('div');
        
        const senderText = responseType 
            ? `${sender} (${responseType})` 
            : sender;
        
        messageElement.innerHTML = `
            <strong>${senderText}:</strong> 
            ${convertMarkdownToHTML(message)}
        `;
        
        messageElement.classList.add(type);
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
});
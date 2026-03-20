// Chatbot - Handles AI interactions
class Chatbot {
    constructor() {
        this.socket = null;
        this.messages = [];
        this.isProcessing = false;
        
        this.initElements();
        this.initEventListeners();
        this.initSocket();
    }

    initElements() {
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            voiceBtn: document.getElementById('voiceBtn'),
            quickActions: document.querySelectorAll('.quick-action'),
            suggestionChips: document.querySelectorAll('.chip')
        };
    }

    initEventListeners() {
        // Send message
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Input handling
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('input', () => {
                this.handleInput();
            });

            this.elements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Quick actions
        this.elements.quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const query = action.dataset.query;
                this.elements.chatInput.value = query;
                this.sendMessage();
            });
        });

        // Suggestion chips
        this.elements.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.elements.chatInput.value = chip.textContent;
                this.sendMessage();
            });
        });

        // Voice input
        if (this.elements.voiceBtn) {
            this.elements.voiceBtn.addEventListener('click', () => this.startVoiceInput());
        }

        // Image upload event
        document.addEventListener('imagesUploaded', (e) => {
            this.handleImageUpload(e.detail);
        });
    }

    initSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.addSystemMessage('Connected to AI server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.addSystemMessage('Disconnected from server', 'error');
        });

        this.socket.on('processing_start', () => {
            this.isProcessing = true;
            this.showTypingIndicator();
        });

        this.socket.on('processing_complete', (data) => {
            this.isProcessing = false;
            this.hideTypingIndicator();
            this.handleAIResponse(data);
        });
    }

    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        this.elements.chatInput.value = '';
        this.elements.sendBtn.disabled = true;
        
        // Get current image
        const currentImage = window.imageProcessor?.currentImage;
        
        if (!currentImage) {
            this.addMessage('ai', 'Please upload an image first.');
            return;
        }
        
        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;
        
        try {
            // Convert base64 to blob
            const response = await fetch(currentImage.url);
            const blob = await response.blob();
            
            // Create form data
            const formData = new FormData();
            formData.append('image', blob, 'image.jpg');
            formData.append('query', message);
            
            // Send to server
            const apiResponse = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });
            
            const data = await apiResponse.json();
            
            this.hideTypingIndicator();
            
            if (data.error) {
                this.addMessage('ai', `Error: ${data.error}`);
                window.uiManager?.showError(data.error);
            } else {
                this.handleAIResponse(data);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            window.uiManager?.showError('Connection error');
            console.error('Chat error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    handleAIResponse(data) {
        // Add AI message
        this.addMessage('ai', data.message);
        
        // Show detections if available
        if (data.type === 'detection' && data.details?.objects) {
            window.imageProcessor?.showDetections(data.details.objects);
            window.imageProcessor?.showResults('detections', data.details.objects);
        }
        
        // Show analysis
        if (data.type === 'caption') {
            window.imageProcessor?.showResults('analysis', data.details.caption);
        }
        
        // Show success toast
        window.uiManager?.showSuccess('Analysis complete');
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">
                        ${type === 'user' ? 'You' : 'NeuralVision AI'}
                    </span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-body">
                    ${this.formatMessage(content)}
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to history
        this.messages.push({ type, content, time });
    }

    addSystemMessage(content, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message system`;
        
        messageDiv.innerHTML = `
            <div class="message-content system">
                <div class="message-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    ${content}
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Convert markdown-style formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing';
        indicator.id = 'typingIndicator';
        
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    handleInput() {
        const hasText = this.elements.chatInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText || this.isProcessing;
        
        // Auto-resize
        this.elements.chatInput.style.height = 'auto';
        this.elements.chatInput.style.height = 
            Math.min(this.elements.chatInput.scrollHeight, 100) + 'px';
    }

    scrollToBottom() {
        this.elements.chatMessages.scrollTo({
            top: this.elements.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    handleImageUpload(files) {
        if (files.length > 0) {
            const file = files[0];
            this.addSystemMessage(`📸 Image uploaded: ${file.name}`);
            
            // Enable chat
            this.elements.chatInput.disabled = false;
            this.elements.chatInput.placeholder = 'Ask about the image...';
        }
    }

    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            window.uiManager?.showError('Voice input not supported in this browser');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.start();
        
        this.elements.voiceBtn.classList.add('active');
        
        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            this.elements.chatInput.value = speechResult;
            this.handleInput();
            this.sendMessage();
        };
        
        recognition.onerror = (event) => {
            window.uiManager?.showError(`Voice error: ${event.error}`);
            this.elements.voiceBtn.classList.remove('active');
        };
        
        recognition.onend = () => {
            this.elements.voiceBtn.classList.remove('active');
        };
    }

    clearChat() {
        this.elements.chatMessages.innerHTML = '';
        this.messages = [];
        this.addWelcomeMessage();
    }

    addWelcomeMessage() {
        this.addMessage('ai', 
            '👋 Hello! I\'m your NeuralVision AI assistant. Upload an image and I can help you analyze it!\n\n' +
            '**Try asking:**\n' +
            '• "Describe this image"\n' +
            '• "What objects do you see?"\n' +
            '• "How many people are there?"\n' +
            '• "What colors are present?"'
        );
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();
});
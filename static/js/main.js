// Main Application Controller
class NeuralVisionApp {
    constructor() {
        this.initialized = false;
        this.startTime = Date.now();
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing NeuralVision AI...');
        
        // Show loading screen
        this.updateLoadingProgress(0, 'Initializing systems...');
        
        // Initialize managers
        await this.initializeManagers();
        
        // Load initial data
        await this.loadInitialData();
        
        // Hide loading screen
        this.completeLoading();
    }

    async initializeManagers() {
        const managers = [
            { name: 'UI Manager', progress: 25, fn: () => window.uiManager },
            { name: '3D Background', progress: 50, fn: () => window.threeBackground },
            { name: 'Image Processor', progress: 75, fn: () => window.imageProcessor },
            { name: 'Chatbot', progress: 90, fn: () => window.chatbot }
        ];

        for (const manager of managers) {
            this.updateLoadingProgress(
                manager.progress, 
                `Loading ${manager.name}...`
            );
            await this.sleep(500);
        }
    }

    async loadInitialData() {
        this.updateLoadingProgress(95, 'Loading initial data...');
        
        try {
            // Check server health
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                console.log('✅ Server connection established');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not connect to server');
        }
        
        await this.sleep(500);
    }

    completeLoading() {
        this.updateLoadingProgress(100, 'Ready!');
        
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            const app = document.getElementById('app');
            
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    if (app) app.style.opacity = '1';
                    
                    // Show welcome message
                    if (window.chatbot) {
                        window.chatbot.addWelcomeMessage();
                    }
                    
                    this.initialized = true;
                    console.log('✨ NeuralVision AI ready!');
                    
                    // Track performance
                    const loadTime = (Date.now() - this.startTime) / 1000;
                    console.log(`⏱️ Load time: ${loadTime.toFixed(2)}s`);
                    
                }, 500);
            }
        }, 500);
    }

    updateLoadingProgress(percent, status) {
        const progressBar = document.getElementById('loadingProgress');
        const statusEl = document.getElementById('loadingStatus');
        const percentEl = document.getElementById('loadingPercentage');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (statusEl) {
            statusEl.textContent = status || 'Loading...';
        }
        
        if (percentEl) {
            percentEl.textContent = `${percent}%`;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuralVisionApp();
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('❌ Error:', e.error);
    if (window.uiManager) {
        window.uiManager.showError('An error occurred. Please refresh the page.');
    }
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`📊 Page load time: ${pageLoadTime}ms`);
    }
});

// Service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
    });
}
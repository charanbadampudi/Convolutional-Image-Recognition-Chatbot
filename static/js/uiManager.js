// UI Manager - Handles all UI interactions
class UIManager {
    constructor() {
        this.elements = {};
        this.toasts = [];
        this.modals = [];
        this.currentTheme = 'light';
        
        this.initElements();
        this.initEventListeners();
        this.initTheme();
    }

    initElements() {
        // Cache DOM elements
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            app: document.getElementById('app'),
            userMenuBtn: document.getElementById('userMenuBtn'),
            userDropdown: document.getElementById('userDropdown'),
            themeToggle: document.getElementById('themeToggle'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            uploadBtn: document.getElementById('uploadBtn'),
            welcomeSection: document.getElementById('welcomeSection'),
            workspace: document.getElementById('workspace'),
            toastContainer: document.getElementById('toastContainer'),
            shareModal: document.getElementById('shareModal'),
            modalClose: document.querySelectorAll('.modal-close'),
            navItems: document.querySelectorAll('.nav-item')
        };
    }

    initEventListeners() {
        // User menu
        if (this.elements.userMenuBtn) {
            this.elements.userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (this.elements.userDropdown) {
                this.elements.userDropdown.classList.remove('show');
            }
        });

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Upload area
        if (this.elements.uploadArea) {
            this.elements.uploadArea.addEventListener('click', () => {
                this.elements.fileInput.click();
            });

            this.elements.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.uploadArea.classList.add('drag-over');
            });

            this.elements.uploadArea.addEventListener('dragleave', () => {
                this.elements.uploadArea.classList.remove('drag-over');
            });

            this.elements.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.elements.uploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                this.handleFileDrop(files);
            });
        }

        // Upload button in empty state
        if (this.elements.uploadBtn) {
            this.elements.uploadBtn.addEventListener('click', () => {
                this.elements.fileInput.click();
            });
        }

        // File input
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        }

        // Modal close buttons
        this.elements.modalClose.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });

        // Click outside modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleUserMenu() {
        if (this.elements.userDropdown) {
            this.elements.userDropdown.classList.toggle('show');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('theme', theme);
        
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    handleFileDrop(files) {
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(files) {
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        // Hide welcome section
        if (this.elements.welcomeSection) {
            this.elements.welcomeSection.style.display = 'none';
        }

        // Show workspace
        if (this.elements.workspace) {
            this.elements.workspace.style.display = 'flex';
        }

        // Dispatch custom event for image processor
        const event = new CustomEvent('imagesUploaded', { detail: files });
        document.dispatchEvent(event);
    }

    switchView(view) {
        // Update active nav item
        this.elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Dispatch view change event
        const event = new CustomEvent('viewChanged', { detail: view });
        document.dispatchEvent(event);
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        this.elements.toastContainer.appendChild(toast);
        this.toasts.push(toast);

        // Limit to 3 toasts at a time
        if (this.toasts.length > 3) {
            this.removeToast(this.toasts[0]);
        }
    }

    removeToast(toast) {
        toast.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
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

    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
                this.elements.app.style.opacity = '1';
            }, 500);
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
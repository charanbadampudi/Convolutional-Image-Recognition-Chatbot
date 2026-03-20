// Image Processor - Handles image manipulation and display
class ImageProcessor {
    constructor() {
        this.currentImage = null;
        this.zoomLevel = 1;
        this.rotation = 0;
        this.annotations = [];
        this.detections = [];
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements = {
            activeImage: document.getElementById('activeImage'),
            zoomContainer: document.getElementById('zoomContainer'),
            annotationCanvas: document.getElementById('annotationCanvas'),
            detectionOverlay: document.getElementById('detectionOverlay'),
            imageNavigator: document.getElementById('imageNavigator'),
            navigatorPreview: document.getElementById('navigatorPreview'),
            imageDimensions: document.getElementById('imageDimensions'),
            imageSize: document.getElementById('imageSize'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            resetZoomBtn: document.getElementById('resetZoomBtn'),
            rotateLeftBtn: document.getElementById('rotateLeftBtn'),
            rotateRightBtn: document.getElementById('rotateRightBtn'),
            cropBtn: document.getElementById('cropBtn'),
            annotateBtn: document.getElementById('annotateBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            shareBtn: document.getElementById('shareBtn'),
            uploadList: document.getElementById('uploadList'),
            detectionCount: document.getElementById('detectionCount'),
            resultsContent: document.getElementById('resultsContent'),
            resultTabs: document.querySelectorAll('.result-tab')
        };
    }

    initEventListeners() {
        // Zoom controls
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (this.elements.zoomOutBtn) {
            this.elements.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (this.elements.resetZoomBtn) {
            this.elements.resetZoomBtn.addEventListener('click', () => this.resetZoom());
        }

        // Rotate controls
        if (this.elements.rotateLeftBtn) {
            this.elements.rotateLeftBtn.addEventListener('click', () => this.rotate(-90));
        }
        if (this.elements.rotateRightBtn) {
            this.elements.rotateRightBtn.addEventListener('click', () => this.rotate(90));
        }

        // Tool buttons
        if (this.elements.cropBtn) {
            this.elements.cropBtn.addEventListener('click', () => this.toggleCrop());
        }
        if (this.elements.annotateBtn) {
            this.elements.annotateBtn.addEventListener('click', () => this.toggleAnnotate());
        }
        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => this.downloadImage());
        }
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => this.shareImage());
        }

        // Result tabs
        this.elements.resultTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchResultTab(tab.dataset.tab);
            });
        });

        // Image upload event
        document.addEventListener('imagesUploaded', (e) => {
            this.handleImages(e.detail);
        });

        // Mouse events for zoom container
        if (this.elements.zoomContainer) {
            this.elements.zoomContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.handleZoomWheel(e);
            });

            this.elements.zoomContainer.addEventListener('mousemove', (e) => {
                this.updateNavigator(e);
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.updateImageDisplay();
        });
    }

    handleImages(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                this.processImage(file);
            }
        });
    }

    processImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            
            // Add to recent uploads
            this.addToRecentUploads(file.name, imageUrl);
            
            // Set as active if first image
            if (!this.currentImage) {
                this.setActiveImage(imageUrl, file);
            }
        };
        
        reader.readAsDataURL(file);
    }

    setActiveImage(imageUrl, file) {
        this.currentImage = {
            url: imageUrl,
            file: file,
            width: 0,
            height: 0
        };

        const img = new Image();
        img.onload = () => {
            this.currentImage.width = img.width;
            this.currentImage.height = img.height;
            
            this.elements.activeImage.src = imageUrl;
            this.updateImageDisplay();
            this.updateNavigatorPreview();
            
            // Update metadata
            this.elements.imageDimensions.textContent = `${img.width}x${img.height}`;
            this.elements.imageSize.textContent = this.formatFileSize(file.size);
        };
        img.src = imageUrl;
    }

    addToRecentUploads(name, url) {
        const item = document.createElement('div');
        item.className = 'upload-item';
        item.innerHTML = `
            <img src="${url}" alt="${name}">
            <div class="upload-item-info">
                <span class="upload-item-name">${this.truncate(name, 15)}</span>
                <span class="upload-item-time">Just now</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.setActiveImage(url, { name });
        });
        
        this.elements.uploadList.prepend(item);
        
        // Limit to 10 items
        if (this.elements.uploadList.children.length > 10) {
            this.elements.uploadList.lastElementChild.remove();
        }
    }

    updateImageDisplay() {
        if (!this.elements.activeImage) return;
        
        const transform = `translate(-50%, -50%) scale(${this.zoomLevel}) rotate(${this.rotation}deg)`;
        this.elements.activeImage.style.transform = transform;
        
        this.drawAnnotations();
        this.drawDetections();
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
        this.updateImageDisplay();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
        this.updateImageDisplay();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.rotation = 0;
        this.updateImageDisplay();
    }

    rotate(degrees) {
        this.rotation = (this.rotation + degrees) % 360;
        this.updateImageDisplay();
    }

    handleZoomWheel(e) {
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    updateNavigator(e) {
        if (!this.elements.imageNavigator || !this.currentImage) return;
        
        const rect = this.elements.zoomContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Update navigator view
        this.elements.imageNavigator.style.backgroundPosition = `${x}% ${y}%`;
    }

    updateNavigatorPreview() {
        if (!this.elements.navigatorPreview || !this.currentImage) return;
        
        this.elements.navigatorPreview.style.backgroundImage = `url(${this.currentImage.url})`;
    }

    drawAnnotations() {
        if (!this.elements.annotationCanvas) return;
        
        const ctx = this.elements.annotationCanvas.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw annotations
        this.annotations.forEach(annotation => {
            ctx.strokeStyle = annotation.color || '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        });
    }

    drawDetections() {
        if (!this.elements.detectionOverlay) return;
        
        this.elements.detectionOverlay.innerHTML = '';
        
        this.detections.forEach((detection, index) => {
            const box = document.createElement('div');
            box.className = 'detection-box';
            box.style.left = `${detection.bbox[0]}px`;
            box.style.top = `${detection.bbox[1]}px`;
            box.style.width = `${detection.bbox[2] - detection.bbox[0]}px`;
            box.style.height = `${detection.bbox[3] - detection.bbox[1]}px`;
            
            const label = document.createElement('div');
            label.className = 'detection-label';
            label.textContent = `${detection.class} (${(detection.confidence * 100).toFixed(1)}%)`;
            
            box.appendChild(label);
            this.elements.detectionOverlay.appendChild(box);
        });
    }

    showDetections(detections) {
        this.detections = detections;
        this.drawDetections();
        
        if (this.elements.detectionCount) {
            this.elements.detectionCount.textContent = detections.length;
        }
    }

    showResults(type, data) {
        if (!this.elements.resultsContent) return;
        
        let html = '';
        
        switch (type) {
            case 'detections':
                html = this.formatDetectionResults(data);
                break;
            case 'analysis':
                html = this.formatAnalysisResults(data);
                break;
            case 'metadata':
                html = this.formatMetadata(data);
                break;
            case 'insights':
                html = this.formatInsights(data);
                break;
        }
        
        this.elements.resultsContent.innerHTML = html;
    }

    formatDetectionResults(detections) {
        let html = '<div class="detection-list">';
        detections.forEach(det => {
            html += `
                <div class="detection-item">
                    <span class="detection-class">${det.class}</span>
                    <span class="detection-confidence">${(det.confidence * 100).toFixed(1)}%</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    formatAnalysisResults(analysis) {
        return `
            <div class="analysis-content">
                <p>${analysis}</p>
            </div>
        `;
    }

    formatMetadata(metadata) {
        return `
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="metadata-label">Dimensions:</span>
                    <span class="metadata-value">${metadata.dimensions}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Format:</span>
                    <span class="metadata-value">${metadata.format}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Size:</span>
                    <span class="metadata-value">${metadata.size_mb} MB</span>
                </div>
            </div>
        `;
    }

    formatInsights(insights) {
        let html = '<ul class="insights-list">';
        insights.forEach(insight => {
            html += `<li><i class="fas fa-lightbulb"></i> ${insight}</li>`;
        });
        html += '</ul>';
        return html;
    }

    switchResultTab(tabId) {
        // Update tab UI
        this.elements.resultTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Show corresponding content
        // This would be handled by the main app
    }

    toggleCrop() {
        // Implement crop functionality
        this.elements.cropBtn.classList.toggle('active');
    }

    toggleAnnotate() {
        // Implement annotation functionality
        this.elements.annotateBtn.classList.toggle('active');
    }

    downloadImage() {
        if (!this.currentImage) return;
        
        const link = document.createElement('a');
        link.download = `neuralvision-${Date.now()}.jpg`;
        link.href = this.currentImage.url;
        link.click();
    }

    shareImage() {
        if (window.uiManager) {
            window.uiManager.showModal('shareModal');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageProcessor = new ImageProcessor();
});
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # File Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'static/uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB default
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,gif,bmp,webp').split(','))
    
    # Model Settings
    MODEL_DEVICE = os.getenv('MODEL_DEVICE', 'cpu')
    DETECTION_CONFIDENCE = float(os.getenv('DETECTION_CONFIDENCE', 0.5))
    MAX_CAPTION_LENGTH = int(os.getenv('MAX_CAPTION_LENGTH', 50))
    
    # Hugging Face
    HF_TOKEN = os.getenv('HF_TOKEN', '')
    
    # Redis (for production)
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    def __init__(self):
        # Create upload folder if it doesn't exist
        os.makedirs(self.UPLOAD_FOLDER, exist_ok=True)
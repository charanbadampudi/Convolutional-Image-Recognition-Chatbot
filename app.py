import os
import uuid
from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import config
from models import VisualAIChatbot
from utils.image_utils import (
    allowed_file, encode_image_to_base64, resize_image_if_needed,
    get_image_metadata, generate_thumbnail, draw_detection_boxes,
    generate_unique_filename, cleanup_old_files
)
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
app.config.from_object(config.Config)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Set secret key
app.secret_key = config.Config.SECRET_KEY

# Initialize chatbot
print("🎨 Initializing NeuralVision AI...")
try:
    chatbot = VisualAIChatbot()
    print("✨ NeuralVision AI is ready!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("⚠️  Please run check_dependencies.py to verify your setup")
    chatbot = None

@app.route('/')
def index():
    """Render main interface."""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process image and query."""
    # Check if chatbot is initialized
    if chatbot is None:
        return jsonify({'error': 'AI models not loaded. Please check server logs.'}), 500
    
    try:
        # Check image
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        query = request.form.get('query', '').strip()
        
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        if not allowed_file(file.filename, app.config['ALLOWED_EXTENSIONS']):
            return jsonify({'error': 'File type not allowed. Allowed: ' + ', '.join(app.config['ALLOWED_EXTENSIONS'])}), 400
        
        # Save file
        filename = generate_unique_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        resize_image_if_needed(filepath)
        
        # Get metadata
        metadata = get_image_metadata(filepath)
        thumbnail = generate_thumbnail(filepath)
        
        # Analyze
        result = chatbot.analyze_image(filepath, query)
        
        # Get annotated image if detection
        annotated_path = None
        if result['type'] == 'detection' and result.get('objects'):
            annotated_path = draw_detection_boxes(filepath, result['objects'])
        
        # Prepare response
        response = {
            'success': True,
            'image': encode_image_to_base64(filepath),
            'thumbnail': thumbnail,
            'metadata': metadata,
            'type': result['type'],
            'message': result['message'],
            'details': result,
            'timestamp': datetime.now().isoformat()
        }
        
        if annotated_path:
            response['annotated_image'] = encode_image_to_base64(annotated_path)
            # Clean up annotated image
            if os.path.exists(annotated_path):
                os.remove(annotated_path)
        
        # Cleanup old files (optional - keep for 1 hour)
        cleanup_old_files(app.config['UPLOAD_FOLDER'], hours=1)
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check."""
    return jsonify({
        'status': 'healthy' if chatbot else 'degraded',
        'models_loaded': chatbot is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection."""
    emit('connected', {'data': 'Connected to NeuralVision AI'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection."""
    print('Client disconnected')

if __name__ == '__main__':
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Run app
    socketio.run(app, 
                debug=True, 
                host='0.0.0.0', 
                port=5000,
                allow_unsafe_werkzeug=True)
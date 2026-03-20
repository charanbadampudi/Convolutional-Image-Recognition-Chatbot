import os
import base64
from io import BytesIO
from PIL import Image
import cv2
import numpy as np
import hashlib
import uuid
from datetime import datetime

def allowed_file(filename, allowed_extensions):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def encode_image_to_base64(image_path):
    """Convert image to base64 string for display."""
    with open(image_path, 'rb') as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def resize_image_if_needed(image_path, max_size=(1200, 1200)):
    """Resize image if too large while maintaining aspect ratio."""
    img = Image.open(image_path)
    if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        img.save(image_path, quality=95, optimize=True)
    return image_path

def get_image_metadata(image_path):
    """Extract image metadata."""
    img = Image.open(image_path)
    file_size = os.path.getsize(image_path)
    
    return {
        'dimensions': f"{img.width}x{img.height}",
        'format': img.format,
        'mode': img.mode,
        'size': file_size,
        'size_mb': round(file_size / (1024 * 1024), 2),
        'filename': os.path.basename(image_path)
    }

def generate_thumbnail(image_path, size=(200, 200)):
    """Generate thumbnail for preview."""
    img = Image.open(image_path)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Save to bytes
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def draw_detection_boxes(image_path, detections):
    """Draw bounding boxes on image."""
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    colors = [
        (255, 99, 132), (54, 162, 235), (255, 206, 86),
        (75, 192, 192), (153, 102, 255), (255, 159, 64)
    ]
    
    for i, det in enumerate(detections):
        x1, y1, x2, y2 = det['bbox']
        color = colors[i % len(colors)]
        
        # Draw rectangle
        cv2.rectangle(img_rgb, (x1, y1), (x2, y2), color, 3)
        
        # Draw label background
        label = f"{det['class']} ({det['confidence']:.2f})"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(img_rgb, (x1, y1 - 25), (x1 + w + 10, y1), color, -1)
        
        # Draw label text
        cv2.putText(img_rgb, label, (x1 + 5, y1 - 7), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Save annotated image
    output_path = image_path.replace('.', '_annotated.')
    cv2.imwrite(output_path, cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
    return output_path

def generate_unique_filename(original_filename):
    """Generate unique filename."""
    ext = original_filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"

def cleanup_old_files(directory, hours=24):
    """Clean up files older than specified hours."""
    now = datetime.now()
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            file_time = datetime.fromtimestamp(os.path.getctime(filepath))
            if (now - file_time).total_seconds() > hours * 3600:
                os.remove(filepath)
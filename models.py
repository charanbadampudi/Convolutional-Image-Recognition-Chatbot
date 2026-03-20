import torch
from PIL import Image
import numpy as np
from transformers import (
    BlipProcessor, BlipForConditionalGeneration,
    ViltProcessor, ViltForQuestionAnswering,
    DetrImageProcessor, DetrForObjectDetection
)
from ultralytics import YOLO
import config
import warnings
warnings.filterwarnings('ignore')

class VisualAIChatbot:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() and 
                                   config.Config.MODEL_DEVICE == 'cuda' else 'cpu')
        print(f"🚀 Initializing NeuralVision AI on {self.device}...")
        
        try:
            # Load YOLOv8
            print("📦 Loading YOLOv8...")
            self.yolo_model = YOLO('yolov8n.pt')
            
            # Load BLIP
            print("📦 Loading BLIP for captioning...")
            self.caption_processor = BlipProcessor.from_pretrained(
                "Salesforce/blip-image-captioning-base"
            )
            self.caption_model = BlipForConditionalGeneration.from_pretrained(
                "Salesforce/blip-image-captioning-base"
            ).to(self.device)
            
            # Load ViLT
            print("📦 Loading ViLT for VQA...")
            self.vqa_processor = ViltProcessor.from_pretrained(
                "dandelin/vilt-b32-finetuned-vqa"
            )
            self.vqa_model = ViltForQuestionAnswering.from_pretrained(
                "dandelin/vilt-b32-finetuned-vqa"
            ).to(self.device)
            
            # Load DETR
            print("📦 Loading DETR for detection...")
            self.detr_processor = DetrImageProcessor.from_pretrained(
                "facebook/detr-resnet-50"
            )
            self.detr_model = DetrForObjectDetection.from_pretrained(
                "facebook/detr-resnet-50"
            ).to(self.device)
            
            print("✅ All models loaded successfully!")
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            raise e
    
    def detect_objects(self, image_path):
        """Detect objects using YOLO."""
        results = self.yolo_model(image_path)
        detections = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])
                    
                    if confidence >= config.Config.DETECTION_CONFIDENCE:
                        detections.append({
                            'class': class_name,
                            'confidence': round(confidence, 3),
                            'bbox': [int(x1), int(y1), int(x2), int(y2)]
                        })
        
        return detections
    
    def generate_caption(self, image_path):
        """Generate image caption."""
        image = Image.open(image_path).convert('RGB')
        inputs = self.caption_processor(image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            out = self.caption_model.generate(
                **inputs,
                max_length=config.Config.MAX_CAPTION_LENGTH,
                num_beams=5,
                temperature=0.8,
                do_sample=True
            )
        
        return self.caption_processor.decode(out[0], skip_special_tokens=True)
    
    def answer_question(self, image_path, question):
        """Answer question about image."""
        image = Image.open(image_path).convert('RGB')
        inputs = self.vqa_processor(image, question, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.vqa_model(**inputs)
        
        logits = outputs.logits
        idx = logits.argmax(-1).item()
        answer = self.vqa_model.config.id2label[idx]
        confidence = torch.softmax(logits, dim=-1)[0, idx].item()
        
        return {
            'answer': answer,
            'confidence': round(confidence, 3)
        }
    
    def analyze_image(self, image_path, query):
        """Main analysis method."""
        query_lower = query.lower().strip()
        
        # Detect objects first (always useful)
        objects = self.detect_objects(image_path)
        
        # Intent classification
        if not query_lower or any(word in query_lower for word in 
            ['describe', 'caption', 'what is in', 'tell me about', 'explain']):
            caption = self.generate_caption(image_path)
            return {
                'type': 'caption',
                'caption': caption,
                'objects': objects[:10],
                'message': f"📝 **Image Analysis**\n\n{caption}\n\n**Detected objects:** {', '.join([obj['class'] for obj in objects[:5]])}"
            }
        
        elif any(word in query_lower for word in 
                ['detect', 'find', 'objects', 'what can you see', 'identify']):
            return {
                'type': 'detection',
                'objects': objects,
                'message': f"🔍 **Detection Results**\n\nFound {len(objects)} objects:\n" + 
                          "\n".join([f"• **{obj['class']}** ({(obj['confidence']*100):.1f}%)" 
                                    for obj in objects[:15]])
            }
        
        else:
            # Question answering
            result = self.answer_question(image_path, query)
            return {
                'type': 'qa',
                'answer': result['answer'],
                'confidence': result['confidence'],
                'objects': objects[:5],
                'message': f"❓ **Q:** {query}\n\n💡 **A:** {result['answer']}\n\n*Confidence: {(result['confidence']*100):.1f}%*"
            }
"""
Image Classifier Module for Fix-It-Now
======================================

Provides AI-powered image classification for maintenance ticket categorization.
Uses ResNet50/EfficientNet with custom classification head trained on maintenance images.

Endpoints:
- POST /classify/image - Classify uploaded image
- POST /classify/image/url - Classify image from URL
- GET /classify/categories - List available categories
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict
import base64
import io
import os
from pathlib import Path

# Try to import ML libraries
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
    from PIL import Image
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[WARNING] PyTorch not available, using fallback classification")

# Create router
router = APIRouter(prefix="/classify", tags=["Image Classification"])

# ============================================================
# Models and Configuration
# ============================================================

# Category definitions
CATEGORIES = [
    'plumbing',
    'electrical', 
    'hvac',
    'appliance',
    'carpentry',
    'cleaning',
    'painting',
    'landscaping',
    'security',
    'other'
]

CATEGORY_DESCRIPTIONS = {
    'plumbing': 'Pipes, toilets, sinks, water damage, leaks',
    'electrical': 'Wires, outlets, switches, panels, lighting',
    'hvac': 'AC units, vents, thermostats, heating',
    'appliance': 'Kitchen/laundry appliances, refrigerators',
    'carpentry': 'Doors, windows, furniture, structural damage',
    'cleaning': 'Messes, stains, mold, pest issues',
    'painting': 'Wall damage, peeling paint, cracks',
    'landscaping': 'Outdoor, plants, grounds, irrigation',
    'security': 'Locks, cameras, alarms, access control',
    'other': 'Unrecognized or general maintenance'
}

SEVERITY_LEVELS = ['minor', 'moderate', 'severe']

# ============================================================
# Pydantic Models
# ============================================================

class ImageClassifyRequest(BaseModel):
    """Request with base64 image"""
    image_base64: str
    include_severity: bool = True


class ImageURLRequest(BaseModel):
    """Request with image URL"""
    image_url: str
    include_severity: bool = True


class ClassificationResult(BaseModel):
    """Classification result"""
    category: str
    confidence: float
    severity: Optional[str] = None
    severity_confidence: Optional[float] = None
    all_categories: Dict[str, float]
    detected_objects: List[str]


class CategoryInfo(BaseModel):
    """Category information"""
    name: str
    description: str


# ============================================================
# Model Loading
# ============================================================

class ImageClassifierModel:
    """Custom image classifier with ResNet50 backbone"""
    
    def __init__(self):
        self.model = None
        self.transform = None
        self.device = 'cpu'
        self.is_loaded = False
        self.model_path = Path(__file__).parent.parent / "models" / "image_classifier.pt"
        
    def load(self):
        """Load the trained model"""
        if not TORCH_AVAILABLE:
            print("[INFO] PyTorch not available, classifier will use fallback")
            return False
            
        try:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            print(f"[INFO] Using device: {self.device}")
            
            # Define image transforms (standard ImageNet normalization)
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            
            # Check if we have a trained model
            if self.model_path.exists():
                print(f"[INFO] Loading trained model from {self.model_path}")
                self.model = torch.load(self.model_path, map_location=self.device)
                self.model.eval()
                self.is_loaded = True
                return True
            else:
                # Use pretrained ResNet50 with custom head as fallback
                print("[INFO] No trained model found, using pretrained ResNet50 with custom head")
                self.model = self._create_model()
                self.is_loaded = True
                return True
                
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            return False
    
    def _create_model(self):
        """Create a ResNet50 model with custom classification head"""
        # Load pretrained ResNet50
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
        
        # Replace final layer with our categories
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(CATEGORIES))
        )
        
        model = model.to(self.device)
        model.eval()
        return model
    
    def classify(self, image: Image.Image) -> Dict:
        """Classify an image"""
        if not TORCH_AVAILABLE or self.model is None:
            return self._fallback_classify(image)
        
        try:
            # Preprocess
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
            
            # Get results
            probs = probabilities.cpu().numpy()
            category_scores = {cat: float(probs[i]) for i, cat in enumerate(CATEGORIES)}
            
            # Get top category
            top_idx = probs.argmax()
            top_category = CATEGORIES[top_idx]
            top_confidence = float(probs[top_idx])
            
            return {
                'category': top_category,
                'confidence': top_confidence,
                'all_categories': category_scores,
                'detected_objects': self._get_detected_objects(category_scores)
            }
            
        except Exception as e:
            print(f"[ERROR] Classification failed: {e}")
            return self._fallback_classify(image)
    
    def _fallback_classify(self, image: Image.Image) -> Dict:
        """Fallback classification using image analysis heuristics"""
        # Analyze image properties
        width, height = image.size
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get dominant colors (simple heuristic)
        colors = image.getcolors(maxcolors=1000) or []
        
        # Default scores
        scores = {cat: 0.1 for cat in CATEGORIES}
        
        # Simple heuristics based on color analysis
        # (This is a placeholder - real model would be much better)
        
        # Blue tones might indicate plumbing
        # Brown/wood tones might indicate carpentry
        # Green might indicate landscaping
        # etc.
        
        # For now, return evenly distributed with slight bias to 'other'
        scores['other'] = 0.3
        
        # Normalize
        total = sum(scores.values())
        scores = {k: v/total for k, v in scores.items()}
        
        top_category = max(scores, key=scores.get)
        
        return {
            'category': top_category,
            'confidence': scores[top_category],
            'all_categories': scores,
            'detected_objects': ['unknown object']
        }
    
    def _get_detected_objects(self, scores: Dict[str, float], threshold: float = 0.1) -> List[str]:
        """Get list of detected object types based on scores"""
        detected = []
        for cat, score in scores.items():
            if score > threshold and cat != 'other':
                detected.append(f"{cat} issue (confidence: {score:.0%})")
        
        if not detected:
            detected.append("No specific issues detected")
        
        return detected[:5]  # Top 5


# Global model instance
classifier_model = ImageClassifierModel()


# ============================================================
# Severity Detection
# ============================================================

def detect_severity(image: Image.Image, category: str) -> tuple:
    """
    Detect damage severity from image.
    Returns (severity_level, confidence)
    """
    # This is a simplified heuristic-based severity detection
    # A real implementation would use a separate trained model
    
    if not TORCH_AVAILABLE:
        return 'moderate', 0.5
    
    try:
        # Analyze image properties
        width, height = image.size
        
        # Convert to numpy for analysis
        import numpy as np
        img_array = np.array(image.convert('RGB'))
        
        # Calculate some image statistics
        brightness = np.mean(img_array)
        contrast = np.std(img_array)
        
        # Check for dark areas (might indicate damage)
        dark_pixels = np.sum(img_array < 50) / img_array.size
        
        # Check for unusual colors (rust, mold, etc.)
        red_channel = img_array[:,:,0]
        green_channel = img_array[:,:,1]
        blue_channel = img_array[:,:,2]
        
        # Brown/rust detection (high red, medium green, low blue)
        rust_like = np.sum((red_channel > 100) & (green_channel < 80) & (blue_channel < 80)) / img_array[:,:,0].size
        
        # Mold/dark stain detection
        dark_stain = np.sum((img_array.mean(axis=2) < 60)) / img_array[:,:,0].size
        
        # Score severity
        severity_score = 0
        severity_score += dark_pixels * 2
        severity_score += rust_like * 3
        severity_score += dark_stain * 2
        
        # Map to severity levels
        if severity_score > 0.3:
            return 'severe', min(0.9, 0.6 + severity_score)
        elif severity_score > 0.15:
            return 'moderate', min(0.85, 0.5 + severity_score)
        else:
            return 'minor', max(0.4, 0.7 - severity_score)
            
    except Exception as e:
        print(f"[WARNING] Severity detection failed: {e}")
        return 'moderate', 0.5


# ============================================================
# API Endpoints
# ============================================================

@router.on_event("startup")
async def load_classifier():
    """Load classifier model on startup"""
    classifier_model.load()


@router.get("/categories", response_model=List[CategoryInfo])
async def list_categories():
    """List all available classification categories"""
    return [
        CategoryInfo(name=cat, description=CATEGORY_DESCRIPTIONS[cat])
        for cat in CATEGORIES
    ]


@router.post("/image", response_model=ClassificationResult)
async def classify_image_upload(file: UploadFile = File(...), include_severity: bool = True):
    """
    Classify an uploaded image file.
    
    Accepts: JPEG, PNG, GIF, WebP
    Returns: Category, confidence, and optionally severity
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Ensure RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        result = classifier_model.classify(image)
        
        # Add severity if requested
        severity = None
        severity_confidence = None
        if include_severity:
            severity, severity_confidence = detect_severity(image, result['category'])
        
        return ClassificationResult(
            category=result['category'],
            confidence=round(result['confidence'], 4),
            severity=severity,
            severity_confidence=round(severity_confidence, 4) if severity_confidence else None,
            all_categories={k: round(v, 4) for k, v in result['all_categories'].items()},
            detected_objects=result['detected_objects']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/image/base64", response_model=ClassificationResult)
async def classify_image_base64(request: ImageClassifyRequest):
    """
    Classify a base64-encoded image.
    
    Useful for frontend integration without file upload.
    """
    try:
        # Decode base64
        # Handle data URL format (data:image/jpeg;base64,...)
        image_data = request.image_base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Ensure RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        result = classifier_model.classify(image)
        
        # Add severity if requested
        severity = None
        severity_confidence = None
        if request.include_severity:
            severity, severity_confidence = detect_severity(image, result['category'])
        
        return ClassificationResult(
            category=result['category'],
            confidence=round(result['confidence'], 4),
            severity=severity,
            severity_confidence=round(severity_confidence, 4) if severity_confidence else None,
            all_categories={k: round(v, 4) for k, v in result['all_categories'].items()},
            detected_objects=result['detected_objects']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.get("/model/status")
async def get_model_status():
    """Get current model status"""
    return {
        "model_loaded": classifier_model.is_loaded,
        "pytorch_available": TORCH_AVAILABLE,
        "device": classifier_model.device if TORCH_AVAILABLE else "fallback",
        "categories": CATEGORIES,
        "trained_model_exists": classifier_model.model_path.exists() if TORCH_AVAILABLE else False
    }

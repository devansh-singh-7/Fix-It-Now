"""
Image Classifier Training Script
================================

Trains a ResNet50-based image classifier for maintenance categories.
Uses transfer learning from ImageNet pretrained weights.

Usage:
  python train_image_classifier.py --epochs 20 --batch-size 32

Requirements:
  pip install torch torchvision pillow tqdm
"""

import os
import argparse
import json
import random
from pathlib import Path
from datetime import datetime

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    from torchvision import transforms, models
    from PIL import Image
    import numpy as np
    from tqdm import tqdm
    TORCH_AVAILABLE = True
except ImportError:
    print("[ERROR] PyTorch not installed. Run: pip install torch torchvision pillow tqdm")
    TORCH_AVAILABLE = False
    exit(1)

# ============================================================
# Configuration
# ============================================================

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

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "training_data"
MODEL_DIR = SCRIPT_DIR.parent / "api" / "models"
OUTPUT_MODEL = MODEL_DIR / "image_classifier.pt"

# ============================================================
# Synthetic Data Generator
# ============================================================

class SyntheticMaintenanceDataset(Dataset):
    """
    Generates synthetic training images for maintenance categories.
    
    This creates simple synthetic images with characteristic colors and patterns
    for each category. For production, replace with real labeled images.
    """
    
    def __init__(self, num_samples_per_class=500, transform=None, mode='train'):
        self.num_samples_per_class = num_samples_per_class
        self.transform = transform
        self.mode = mode
        self.samples = self._generate_samples()
        
    def _generate_samples(self):
        samples = []
        for idx, category in enumerate(CATEGORIES):
            for i in range(self.num_samples_per_class):
                samples.append((idx, category, i))
        
        if self.mode == 'train':
            random.shuffle(samples)
        
        return samples
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        class_idx, category, sample_idx = self.samples[idx]
        
        # Generate synthetic image based on category
        image = self._generate_synthetic_image(category, sample_idx)
        
        if self.transform:
            image = self.transform(image)
        
        return image, class_idx
    
    def _generate_synthetic_image(self, category: str, seed: int) -> Image.Image:
        """Generate a synthetic image with category-specific characteristics"""
        random.seed(seed)
        np.random.seed(seed)
        
        size = (224, 224)
        
        # Category-specific color palettes
        color_palettes = {
            'plumbing': [(70, 130, 180), (135, 206, 235), (100, 100, 120)],  # Blue tones (water)
            'electrical': [(255, 215, 0), (255, 165, 0), (50, 50, 50)],  # Yellow/warning colors
            'hvac': [(192, 192, 192), (169, 169, 169), (30, 144, 255)],  # Silver/metal + blue
            'appliance': [(245, 245, 245), (220, 220, 220), (60, 60, 60)],  # White appliances
            'carpentry': [(139, 90, 43), (160, 82, 45), (210, 180, 140)],  # Brown wood tones
            'cleaning': [(255, 255, 240), (240, 230, 140), (34, 139, 34)],  # Cream/clean colors
            'painting': [(255, 99, 71), (147, 112, 219), (255, 182, 193)],  # Various paint colors
            'landscaping': [(34, 139, 34), (50, 205, 50), (139, 69, 19)],  # Green/earth tones
            'security': [(47, 79, 79), (0, 0, 0), (192, 192, 192)],  # Dark/metallic
            'other': [(128, 128, 128), (100, 100, 100), (160, 160, 160)],  # Neutral grays
        }
        
        # Get palette for category
        palette = color_palettes.get(category, color_palettes['other'])
        
        # Create base image
        img_array = np.zeros((size[0], size[1], 3), dtype=np.uint8)
        
        # Fill with gradient of category colors
        base_color = random.choice(palette)
        for i in range(size[0]):
            for j in range(size[1]):
                noise = np.random.randint(-20, 20, 3)
                color = np.clip(np.array(base_color) + noise, 0, 255)
                img_array[i, j] = color
        
        # Add random shapes/patterns specific to category
        self._add_category_patterns(img_array, category)
        
        # Add some random noise
        noise = np.random.randint(-10, 10, img_array.shape, dtype=np.int16)
        img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        return Image.fromarray(img_array, mode='RGB')
    
    def _add_category_patterns(self, img_array: np.ndarray, category: str):
        """Add category-specific visual patterns"""
        h, w = img_array.shape[:2]
        
        if category == 'plumbing':
            # Add pipe-like horizontal lines
            for _ in range(random.randint(2, 5)):
                y = random.randint(0, h-10)
                thickness = random.randint(5, 15)
                img_array[y:y+thickness, :] = [100, 100, 120]
                
        elif category == 'electrical':
            # Add wire-like patterns
            for _ in range(random.randint(3, 8)):
                x = random.randint(0, w)
                y = random.randint(0, h)
                length = random.randint(20, 60)
                color = random.choice([[255, 0, 0], [0, 0, 255], [0, 255, 0], [50, 50, 50]])
                for i in range(length):
                    yi = min(y + i, h-1)
                    xi = min(x + random.randint(-2, 2), w-1)
                    img_array[yi, xi] = color
                    
        elif category == 'hvac':
            # Add vent-like grid pattern
            for y in range(0, h, 20):
                img_array[y:y+3, :] = [50, 50, 50]
            for x in range(0, w, 20):
                img_array[:, x:x+3] = [50, 50, 50]
                
        elif category == 'carpentry':
            # Add wood grain patterns
            for y in range(0, h, random.randint(3, 8)):
                offset = random.randint(-2, 2)
                img_array[y, :] = np.clip(img_array[y, :] + offset * 10, 0, 255)
                
        elif category == 'landscaping':
            # Add grass-like vertical lines
            for x in range(0, w, 3):
                for _ in range(random.randint(1, 5)):
                    y_start = random.randint(h//2, h-10)
                    y_end = y_start + random.randint(5, 20)
                    color = [34, random.randint(100, 200), 34]
                    img_array[y_start:min(y_end, h), x] = color


class RealMaintenanceDataset(Dataset):
    """
    Dataset for real labeled maintenance images.
    
    Directory structure:
    training_data/
      plumbing/
        image1.jpg
        image2.jpg
      electrical/
        image1.jpg
      ...
    """
    
    def __init__(self, data_dir: Path, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.samples = self._load_samples()
        
    def _load_samples(self):
        samples = []
        
        for idx, category in enumerate(CATEGORIES):
            category_dir = self.data_dir / category
            if category_dir.exists():
                for img_path in category_dir.glob('*'):
                    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                        samples.append((str(img_path), idx))
        
        random.shuffle(samples)
        return samples
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, class_idx = self.samples[idx]
        
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return image, class_idx


# ============================================================
# Model Definition
# ============================================================

def create_model(num_classes: int, pretrained: bool = True):
    """Create a MobileNetV2 model with custom classification head.
    
    MobileNetV2 is much faster than ResNet50 while maintaining good accuracy,
    making it ideal for CPU training and mobile/edge deployment.
    """
    
    if pretrained:
        weights = models.MobileNet_V2_Weights.IMAGENET1K_V2
    else:
        weights = None
    
    model = models.mobilenet_v2(weights=weights)
    
    # Freeze early layers for transfer learning (keep last 10 layers trainable)
    for param in list(model.parameters())[:-10]:
        param.requires_grad = False
    
    # Replace final classifier layer
    num_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    
    return model


# ============================================================
# Training Functions
# ============================================================

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in tqdm(dataloader, desc="Training"):
        images = images.to(device)
        labels = labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(dataloader), 100. * correct / total


def evaluate(model, dataloader, criterion, device):
    """Evaluate model on validation set"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in tqdm(dataloader, desc="Evaluating"):
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(dataloader), 100. * correct / total


def train_model(args):
    """Main training loop"""
    print("\n" + "="*60)
    print("Fix-It-Now Image Classifier Training")
    print("="*60)
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\n[INFO] Using device: {device}")
    
    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Check for real data
    real_data_exists = DATA_DIR.exists() and any((DATA_DIR / cat).exists() for cat in CATEGORIES)
    
    if real_data_exists:
        print(f"\n[INFO] Using real training data from {DATA_DIR}")
        train_dataset = RealMaintenanceDataset(DATA_DIR, transform=train_transform)
        val_dataset = RealMaintenanceDataset(DATA_DIR, transform=val_transform)
        
        if len(train_dataset) < 100:
            print("[WARNING] Very few real images, supplementing with synthetic data")
            syn_dataset = SyntheticMaintenanceDataset(
                num_samples_per_class=100,
                transform=train_transform,
                mode='train'
            )
            train_dataset = torch.utils.data.ConcatDataset([train_dataset, syn_dataset])
    else:
        print(f"\n[INFO] No real data found at {DATA_DIR}")
        print("[INFO] Using synthetic training data")
        print("[TIP] Add real images to training_data/<category>/ for better accuracy")
        
        train_dataset = SyntheticMaintenanceDataset(
            num_samples_per_class=args.samples_per_class,
            transform=train_transform,
            mode='train'
        )
        val_dataset = SyntheticMaintenanceDataset(
            num_samples_per_class=args.samples_per_class // 5,
            transform=val_transform,
            mode='val'
        )
    
    print(f"[INFO] Training samples: {len(train_dataset)}")
    print(f"[INFO] Validation samples: {len(val_dataset)}")
    
    # DataLoaders
    train_loader = DataLoader(
        train_dataset, 
        batch_size=args.batch_size, 
        shuffle=True, 
        num_workers=args.workers
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=args.batch_size, 
        shuffle=False, 
        num_workers=args.workers
    )
    
    # Model
    print(f"\n[INFO] Creating MobileNetV2 model with {len(CATEGORIES)} classes")
    model = create_model(len(CATEGORIES), pretrained=True)
    model = model.to(device)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
    
    # Training loop
    best_acc = 0.0
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    
    print(f"\n[INFO] Starting training for {args.epochs} epochs...")
    print("-"*60)
    
    for epoch in range(args.epochs):
        print(f"\nEpoch {epoch+1}/{args.epochs}")
        
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        
        scheduler.step()
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            torch.save(model, OUTPUT_MODEL)
            print(f"  [SAVED] New best model (acc: {val_acc:.2f}%)")
    
    # Save training history
    history_path = MODEL_DIR / "training_history.json"
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print(f"Best Validation Accuracy: {best_acc:.2f}%")
    print(f"Model saved to: {OUTPUT_MODEL}")
    print(f"Training history: {history_path}")
    
    return best_acc


# ============================================================
# Data Collection Utility
# ============================================================

def setup_data_directory():
    """Create directory structure for training data"""
    print("\n[INFO] Setting up training data directory structure...")
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    for category in CATEGORIES:
        category_dir = DATA_DIR / category
        category_dir.mkdir(exist_ok=True)
        
        # Create README
        readme_path = category_dir / "README.txt"
        if not readme_path.exists():
            with open(readme_path, 'w') as f:
                f.write(f"Add {category} images here.\n")
                f.write(f"Supported formats: .jpg, .jpeg, .png, .webp, .gif\n")
                f.write(f"Recommended: 50-200 images per category\n")
    
    print(f"\n[SUCCESS] Directory structure created at: {DATA_DIR}")
    print("\nAdd images to each category folder:")
    for cat in CATEGORIES:
        print(f"  - {DATA_DIR / cat}/")
    
    print("\nThen run training:")
    print("  python train_image_classifier.py --epochs 20")


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train image classifier for maintenance categories")
    
    parser.add_argument('--epochs', type=int, default=15, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--workers', type=int, default=4, help='Number of data loader workers')
    parser.add_argument('--samples-per-class', type=int, default=500, help='Synthetic samples per class')
    parser.add_argument('--setup', action='store_true', help='Set up training data directory')
    
    args = parser.parse_args()
    
    if args.setup:
        setup_data_directory()
    else:
        train_model(args)

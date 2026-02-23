"""
Train image classifier with HYBRID data (Real + Improved Synthetic)
This combines your real images with enhanced synthetic data for better accuracy
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms, models
from PIL import Image
import numpy as np
from pathlib import Path
import json
from tqdm import tqdm
import argparse
from collections import Counter

# Categories
CATEGORIES = ['plumbing', 'electrical', 'hvac', 'appliance', 'carpentry', 
              'cleaning', 'painting', 'landscaping', 'security', 'other']

class HybridMaintenanceDataset(Dataset):
    """Dataset that combines real and synthetic images"""
    
    def __init__(self, root_dir, transform=None, split='train', train_ratio=0.8):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.split = split
        self.samples = []
        self.class_weights = []
        
        # Load images from all categories
        for idx, category in enumerate(CATEGORIES):
            category_path = self.root_dir / category
            if not category_path.exists():
                print(f"Warning: {category} directory not found. Skipping.")
                continue
            
            # Get all images (both real and synthetic)
            images = list(category_path.glob("*.jpg")) + \
                    list(category_path.glob("*.png")) + \
                    list(category_path.glob("*.jpeg"))
            
            if not images:
                print(f"Warning: No images found in {category}")
                continue
            
            # Shuffle and split
            np.random.shuffle(images)
            split_idx = int(len(images) * train_ratio)
            
            if split == 'train':
                split_images = images[:split_idx]
            else:  # validation
                split_images = images[split_idx:]
            
            # Mark whether image is real or synthetic for weighting
            for img_path in split_images:
                is_synthetic = 'synthetic' in img_path.name
                self.samples.append({
                    'path': img_path,
                    'label': idx,
                    'category': category,
                    'is_synthetic': is_synthetic
                })
        
        if not self.samples:
            raise ValueError(f"No images found in {root_dir}")
        
        # Calculate class weights for balancing
        self._calculate_class_weights()
        
        print(f"\n{split.upper()} Dataset:")
        print(f"  Total images: {len(self.samples)}")
        real_count = sum(1 for s in self.samples if not s['is_synthetic'])
        synthetic_count = sum(1 for s in self.samples if s['is_synthetic'])
        print(f"  Real images: {real_count}")
        print(f"  Synthetic images: {synthetic_count}")
        
        # Print per-category breakdown
        category_counts = Counter(s['category'] for s in self.samples)
        print(f"\n  Per-category breakdown:")
        for cat in CATEGORIES:
            if cat in category_counts:
                cat_samples = [s for s in self.samples if s['category'] == cat]
                real = sum(1 for s in cat_samples if not s['is_synthetic'])
                synth = sum(1 for s in cat_samples if s['is_synthetic'])
                print(f"    {cat}: {category_counts[cat]} ({real} real + {synth} synthetic)")
    
    def _calculate_class_weights(self):
        """Calculate weights for balanced sampling"""
        label_counts = Counter(s['label'] for s in self.samples)
        total = len(self.samples)
        
        # Give higher weight to classes with fewer samples
        weights = {label: total / (len(label_counts) * count) 
                  for label, count in label_counts.items()}
        
        self.class_weights = [weights[s['label']] for s in self.samples]
    
    def get_sampler(self):
        """Get weighted sampler for balanced training"""
        return WeightedRandomSampler(
            weights=self.class_weights,
            num_samples=len(self.class_weights),
            replacement=True
        )
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Load image
        image = Image.open(sample['path']).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return image, sample['label']

class ImprovedClassifier(nn.Module):
    """Enhanced MobileNetV2 with better architecture"""
    
    def __init__(self, num_classes=10, dropout_rate=0.5):
        super(ImprovedClassifier, self).__init__()
        
        # Use MobileNetV2 as backbone
        self.backbone = models.mobilenet_v2(pretrained=True)
        
        # Freeze early layers (fine-tune only later layers)
        for param in list(self.backbone.parameters())[:-20]:
            param.requires_grad = False
        
        # Replace classifier with enhanced head
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(p=dropout_rate * 0.5),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(256),
            nn.Dropout(p=dropout_rate * 0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)

def get_transforms(augment=True):
    """Get data transforms with augmentation"""
    if augment:
        return transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    else:
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

def train_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    pbar = tqdm(dataloader, desc='Training')
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        pbar.set_postfix({'loss': f'{running_loss/(pbar.n+1):.4f}', 
                         'acc': f'{100.*correct/total:.2f}%'})
    
    return running_loss / len(dataloader), 100. * correct / total

def validate(model, dataloader, criterion, device):
    """Validate model"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        pbar = tqdm(dataloader, desc='Validation')
        for images, labels in pbar:
            images, labels = images.to(device), labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            pbar.set_postfix({'loss': f'{running_loss/(pbar.n+1):.4f}', 
                             'acc': f'{100.*correct/total:.2f}%'})
    
    return running_loss / len(dataloader), 100. * correct / total

def train_model(data_dir, epochs=25, batch_size=32, learning_rate=0.001):
    """Train the hybrid model"""
    print("\n" + "="*70)
    print("  TRAINING IMAGE CLASSIFIER WITH HYBRID DATA")
    print("  (Real Images + Improved Synthetic Data)")
    print("="*70)
    
    # Setup device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\nUsing device: {device}")
    
    # Create datasets
    print("\nLoading datasets...")
    train_dataset = HybridMaintenanceDataset(
        data_dir, 
        transform=get_transforms(augment=True),
        split='train'
    )
    
    val_dataset = HybridMaintenanceDataset(
        data_dir,
        transform=get_transforms(augment=False),
        split='val'
    )
    
    # Create dataloaders with weighted sampling
    train_sampler = train_dataset.get_sampler()
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        sampler=train_sampler,
        num_workers=0,  # Windows compatibility
        pin_memory=True if torch.cuda.is_available() else False
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=True if torch.cuda.is_available() else False
    )
    
    # Create model
    print("\nInitializing model...")
    model = ImprovedClassifier(num_classes=len(CATEGORIES), dropout_rate=0.5)
    model = model.to(device)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.5, patience=3
    )
    
    # Training history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    best_val_acc = 0.0
    
    print(f"\nStarting training for {epochs} epochs...")
    print("-"*70)
    
    for epoch in range(epochs):
        print(f"\nEpoch {epoch+1}/{epochs}")
        
        # Train
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        
        # Validate
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        # Update learning rate
        scheduler.step(val_acc)
        
        # Save history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"\nEpoch {epoch+1} Summary:")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"  Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model_path = Path(__file__).parent.parent / 'api' / 'models' / 'image_classifier.pt'
            model_path.parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), model_path)
            print(f"  ✓ New best model saved! (Val Acc: {val_acc:.2f}%)")
    
    # Save training history
    history_path = Path(__file__).parent.parent / 'api' / 'models' / 'training_history.json'
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)
    
    print("\n" + "="*70)
    print("  TRAINING COMPLETE!")
    print("="*70)
    print(f"\nBest Validation Accuracy: {best_val_acc:.2f}%")
    print(f"Model saved to: {model_path}")
    print(f"Training history saved to: {history_path}")
    
    return model, history

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train hybrid image classifier')
    parser.add_argument('--data-dir', type=str, default='training_data',
                       help='Directory containing training data')
    parser.add_argument('--epochs', type=int, default=25,
                       help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                       help='Batch size for training')
    parser.add_argument('--learning-rate', type=float, default=0.001,
                       help='Learning rate')
    
    args = parser.parse_args()
    
    data_dir = Path(__file__).parent / args.data_dir
    
    if not data_dir.exists():
        print(f"Error: Data directory {data_dir} not found!")
        print("Please run generate_improved_synthetic.py first.")
        exit(1)
    
    train_model(data_dir, args.epochs, args.batch_size, args.learning_rate)

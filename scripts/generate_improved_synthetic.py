"""
Generate improved synthetic training images with realistic augmentations
This creates more varied and realistic-looking synthetic data
"""
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
import random
from pathlib import Path
import argparse

CATEGORIES = ['plumbing', 'electrical', 'hvac', 'appliance', 'carpentry', 
              'cleaning', 'painting', 'landscaping', 'security', 'other']

class ImprovedSyntheticGenerator:
    """Generate more realistic synthetic images with textures and patterns"""
    
    def __init__(self, image_size=224):
        self.image_size = image_size
        
        # Category-specific color palettes (more realistic than before)
        self.color_schemes = {
            'plumbing': [(70, 130, 180), (135, 206, 250), (176, 196, 222), (100, 149, 237)],  # Blues with variation
            'electrical': [(255, 215, 0), (255, 165, 0), (218, 165, 32), (184, 134, 11)],  # Gold/orange tones
            'hvac': [(169, 169, 169), (192, 192, 192), (128, 128, 128), (105, 105, 105)],  # Grays/metallics
            'appliance': [(211, 211, 211), (220, 220, 220), (245, 245, 245), (192, 192, 192)],  # Light grays
            'carpentry': [(139, 69, 19), (160, 82, 45), (205, 133, 63), (210, 180, 140)],  # Browns/wood tones
            'cleaning': [(255, 255, 255), (240, 248, 255), (245, 255, 250), (255, 250, 240)],  # Whites/clean
            'painting': [(220, 20, 60), (255, 99, 71), (255, 140, 0), (255, 215, 0)],  # Vibrant colors
            'landscaping': [(34, 139, 34), (107, 142, 35), (85, 107, 47), (46, 139, 87)],  # Greens
            'security': [(25, 25, 112), (0, 0, 128), (72, 61, 139), (106, 90, 205)],  # Dark blues
            'other': [(128, 128, 128), (169, 169, 169), (192, 192, 192), (211, 211, 211)]  # Neutral grays
        }
    
    def add_texture(self, img):
        """Add realistic texture to image"""
        # Create noise texture
        noise = np.random.randint(0, 30, (self.image_size, self.image_size, 3), dtype=np.uint8)
        noise_img = Image.fromarray(noise)
        
        # Blend with original
        return Image.blend(img, noise_img, alpha=0.1)
    
    def add_gradient(self, draw, colors):
        """Add gradient effect"""
        for i in range(self.image_size):
            ratio = i / self.image_size
            r = int(colors[0][0] * (1 - ratio) + colors[1][0] * ratio)
            g = int(colors[0][1] * (1 - ratio) + colors[1][1] * ratio)
            b = int(colors[0][2] * (1 - ratio) + colors[1][2] * ratio)
            draw.line([(0, i), (self.image_size, i)], fill=(r, g, b))
    
    def add_geometric_patterns(self, draw, category):
        """Add category-specific patterns"""
        colors = self.color_schemes[category]
        
        if category == 'plumbing':
            # Add pipe-like rectangles
            for _ in range(random.randint(2, 4)):
                x = random.randint(0, self.image_size - 50)
                y = random.randint(0, self.image_size - 100)
                color = random.choice(colors)
                draw.rectangle([x, y, x + random.randint(10, 30), y + random.randint(50, 150)], 
                             fill=color, outline=(0, 0, 0))
        
        elif category == 'electrical':
            # Add wire-like lines and nodes
            for _ in range(random.randint(3, 6)):
                x1, y1 = random.randint(0, self.image_size), random.randint(0, self.image_size)
                x2, y2 = random.randint(0, self.image_size), random.randint(0, self.image_size)
                color = random.choice(colors)
                draw.line([(x1, y1), (x2, y2)], fill=color, width=random.randint(2, 5))
                # Add connection points
                draw.ellipse([x1-5, y1-5, x1+5, y1+5], fill=color)
        
        elif category == 'carpentry':
            # Add wood grain pattern
            for i in range(0, self.image_size, 5):
                offset = random.randint(-2, 2)
                color = random.choice(colors)
                draw.line([(i, 0), (i+offset, self.image_size)], fill=color, width=2)
        
        elif category == 'hvac':
            # Add vent-like grids
            spacing = 20
            color = random.choice(colors)
            for i in range(0, self.image_size, spacing):
                draw.line([(i, 0), (i, self.image_size)], fill=color, width=2)
                draw.line([(0, i), (self.image_size, i)], fill=color, width=2)
    
    def generate_image(self, category):
        """Generate a single synthetic image with improvements"""
        colors = self.color_schemes[category]
        
        # Create base image with gradient
        img = Image.new('RGB', (self.image_size, self.image_size))
        draw = ImageDraw.Draw(img)
        
        # Random gradient background
        gradient_colors = random.sample(colors, 2)
        self.add_gradient(draw, gradient_colors)
        
        # Add geometric patterns
        self.add_geometric_patterns(draw, category)
        
        # Add random shapes for variation
        for _ in range(random.randint(5, 15)):
            x = random.randint(0, self.image_size - 50)
            y = random.randint(0, self.image_size - 50)
            size = random.randint(10, 40)
            color = random.choice(colors)
            
            shape_type = random.choice(['circle', 'rectangle', 'line'])
            if shape_type == 'circle':
                draw.ellipse([x, y, x + size, y + size], fill=color, outline=(0, 0, 0))
            elif shape_type == 'rectangle':
                draw.rectangle([x, y, x + size, y + size], fill=color, outline=(0, 0, 0))
            else:
                x2, y2 = x + random.randint(-50, 50), y + random.randint(-50, 50)
                draw.line([(x, y), (x2, y2)], fill=color, width=random.randint(2, 5))
        
        # Add texture
        img = self.add_texture(img)
        
        # Apply realistic augmentations
        img = self.apply_augmentations(img)
        
        return img
    
    def apply_augmentations(self, img):
        """Apply realistic augmentations"""
        # Random blur
        if random.random() > 0.5:
            img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
        
        # Random brightness
        if random.random() > 0.5:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(random.uniform(0.7, 1.3))
        
        # Random contrast
        if random.random() > 0.5:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(random.uniform(0.8, 1.2))
        
        # Random rotation
        if random.random() > 0.5:
            angle = random.uniform(-15, 15)
            img = img.rotate(angle, fillcolor=(128, 128, 128))
        
        return img

def generate_synthetic_dataset(output_dir, images_per_category=100):
    """Generate improved synthetic dataset"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    generator = ImprovedSyntheticGenerator()
    
    print("\n" + "="*70)
    print("  GENERATING IMPROVED SYNTHETIC TRAINING DATA")
    print("="*70 + "\n")
    
    for category in CATEGORIES:
        category_dir = output_path / category
        category_dir.mkdir(exist_ok=True)
        
        # Check existing synthetic images
        existing = len(list(category_dir.glob("synthetic_*.jpg")))
        
        print(f"Generating {images_per_category} images for '{category}'...")
        
        for i in range(images_per_category):
            img = generator.generate_image(category)
            # Use consistent naming to avoid conflicts with real images
            img_path = category_dir / f"synthetic_{existing + i + 1:05d}.jpg"
            img.save(img_path, quality=85)
        
        total = len(list(category_dir.glob("*.jpg")))
        print(f"  ✓ {category}: {total} total images ({images_per_category} synthetic + {total - images_per_category} real)")
    
    print("\n" + "="*70)
    print("  SYNTHETIC DATA GENERATION COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate improved synthetic training data')
    parser.add_argument('--output', type=str, 
                       default='training_data',
                       help='Output directory for synthetic images')
    parser.add_argument('--images-per-category', type=int, default=100,
                       help='Number of synthetic images to generate per category')
    
    args = parser.parse_args()
    
    output_dir = Path(__file__).parent / args.output
    generate_synthetic_dataset(output_dir, args.images_per_category)

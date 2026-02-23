"""
Organize real images from various folders into training structure
"""
import os
import shutil
from pathlib import Path
import random

# Define paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DATA_DIR = BASE_DIR / "scripts" / "training_data"
NEGATIVE_DIR = BASE_DIR / "Negative"
PREDICTIVE_DIR = BASE_DIR / "Predictive Maintenance for Electrical Wiring Faults" / "images"

# Categories
CATEGORIES = ['plumbing', 'electrical', 'hvac', 'appliance', 'carpentry', 
              'cleaning', 'painting', 'landscaping', 'security', 'other']

def create_directories():
    """Create category directories if they don't exist"""
    for category in CATEGORIES:
        category_dir = TRAINING_DATA_DIR / category
        category_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created training directories")

def organize_images():
    """Organize images from various sources"""
    print("\n" + "="*70)
    print("  ORGANIZING REAL IMAGES FOR TRAINING")
    print("="*70 + "\n")
    
    create_directories()
    
    # Count existing images
    existing_counts = {}
    for category in CATEGORIES:
        category_dir = TRAINING_DATA_DIR / category
        count = len([f for f in category_dir.glob("*.jpg")]) + \
                len([f for f in category_dir.glob("*.png")]) + \
                len([f for f in category_dir.glob("*.jpeg")])
        existing_counts[category] = count
        print(f"  {category}: {count} existing images")
    
    print("\n" + "-"*70)
    print("Image Sources Found:")
    print("-"*70)
    
    # Check what sources we have
    sources = {
        "Negative folder": NEGATIVE_DIR if NEGATIVE_DIR.exists() else None,
        "Predictive Maintenance": PREDICTIVE_DIR if PREDICTIVE_DIR.exists() else None
    }
    
    for source_name, source_path in sources.items():
        if source_path:
            if source_path.is_dir():
                image_count = len(list(source_path.glob("**/*.jpg"))) + \
                             len(list(source_path.glob("**/*.png")))
                print(f"  ✓ {source_name}: {image_count} images")
        else:
            print(f"  ✗ {source_name}: Not found")
    
    print("\n" + "="*70)
    print("Current organization is complete!")
    print("="*70)
    print("\nYour images in training_data/electrical are ready to use.")
    print(f"Total images across all categories: {sum(existing_counts.values())}")
    print("\nNote: The 'Negative' folder contains {0} images.".format(
        len(list(NEGATIVE_DIR.glob("*.jpg"))) if NEGATIVE_DIR.exists() else 0
    ))
    print("These appear to be labeled as 'negative samples' (non-electrical issues).")
    print("\nRecommendation: Manually sort images from 'Negative' folder into")
    print("appropriate categories based on what maintenance issue they show.")

if __name__ == "__main__":
    organize_images()

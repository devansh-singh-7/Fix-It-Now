"""
Retrain Image Classifier with Real Data
========================================

This script properly organizes your real images and retrains the model.

Usage:
  python retrain_with_real_data.py
"""

import shutil
from pathlib import Path
import os

# Paths
ROOT = Path(r"c:\Users\devan\OneDrive\Desktop\Fix-It-Now")
TRAINING_DATA = ROOT / "scripts" / "training_data"
ELECTRICAL_IMAGES = ROOT / "Predictive Maintenance for Electrical Wiring Faults" / "images"

# Category mappings for your existing datasets
CATEGORY_MAP = {
    'plumbing': ['plumbing', 'water', 'pipe', 'leak'],
    'electrical': ['electrical', 'wire', 'wiring', 'electric'],
    'hvac': ['hvac', 'ac', 'heating', 'cooling', 'vent'],
    'appliance': ['appliance', 'fridge', 'washer', 'dryer'],
    'carpentry': ['wood', 'door', 'window', 'furniture', 'damaged_buildings'],
    'cleaning': ['debris', 'mess', 'dirt', 'stain'],
    'painting': ['crack', 'paint', 'wall', 'Positive'],
    'landscaping': ['grass', 'tree', 'outdoor', 'garden'],
    'security': ['lock', 'camera', 'alarm'],
    'other': ['other', 'misc']
}

def create_training_folders():
    """Create fresh training data folders"""
    print("\n" + "="*60)
    print("Step 1: Creating Training Data Folders")
    print("="*60)
    
    # Clear existing synthetic data
    if TRAINING_DATA.exists():
        print(f"[INFO] Removing old synthetic data from {TRAINING_DATA}")
        shutil.rmtree(TRAINING_DATA)
    
    # Create fresh folders
    TRAINING_DATA.mkdir(parents=True, exist_ok=True)
    for category in CATEGORY_MAP.keys():
        (TRAINING_DATA / category).mkdir(exist_ok=True)
    
    print("[SUCCESS] Training folders created")


def organize_electrical_images():
    """Organize electrical wiring fault images"""
    print("\n" + "="*60)
    print("Step 2: Organizing Electrical Images")
    print("="*60)
    
    count = 0
    dest = TRAINING_DATA / "electrical"
    
    # Check train01, val01, test01 folders
    for split in ['train01', 'val01', 'test01']:
        split_dir = ELECTRICAL_IMAGES / split
        if split_dir.exists():
            print(f"\n[INFO] Processing {split}...")
            
            # Copy all images from this split
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.PNG']:
                for img in split_dir.rglob(ext):
                    if img.is_file():
                        dest_file = dest / f"{split}_{count:04d}_{img.name}"
                        shutil.copy2(img, dest_file)
                        count += 1
            
            print(f"  [OK] {count} images copied so far")
    
    print(f"\n[SUCCESS] Total electrical images: {count}")
    return count


def organize_other_datasets():
    """Organize other available datasets"""
    print("\n" + "="*60)
    print("Step 3: Organizing Other Datasets")
    print("="*60)
    
    datasets = {
        'carpentry': ROOT / "train" / "damaged_buildings",
        'cleaning': ROOT / "train" / "debris",
        'painting': ROOT / "Positive",  # Concrete cracks
        'painting_neg': ROOT / "Negative",  # No cracks (also useful for painting)
    }
    
    total = 0
    for category, src_dir in datasets.items():
        if src_dir.exists():
            dest_cat = category.split('_')[0]  # Remove _neg suffix
            dest = TRAINING_DATA / dest_cat
            count = 0
            
            print(f"\n[INFO] Processing {category}...")
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.PNG']:
                for img in src_dir.rglob(ext):
                    if img.is_file() and count < 1000:  # Limit per category
                        dest_file = dest / f"{category}_{count:04d}_{img.name}"
                        shutil.copy2(img, dest_file)
                        count += 1
            
            print(f"  [OK] {dest_cat}: {count} images")
            total += count
        else:
            print(f"  [SKIP] {src_dir} not found")
    
    return total


def print_dataset_stats():
    """Print statistics about the organized dataset"""
    print("\n" + "="*60)
    print("Dataset Statistics")
    print("="*60)
    
    total = 0
    for category in CATEGORY_MAP.keys():
        cat_dir = TRAINING_DATA / category
        if cat_dir.exists():
            count = sum(1 for f in cat_dir.glob('*') if f.suffix.lower() in ['.jpg', '.jpeg', '.png'])
            status = "GOOD" if count >= 100 else "OK" if count >= 50 else "LOW" if count > 0 else "EMPTY"
            print(f"  [{status}] {category:15s}: {count:4d} images")
            total += count
        else:
            print(f"  [EMPTY] {category:15s}:    0 images")
    
    print("-"*60)
    print(f"  TOTAL: {total} images")
    
    if total < 500:
        print("\n⚠️  WARNING: You have fewer than 500 total images.")
        print("   Recommendation: Collect more real images for better accuracy.")
        print("   Minimum: 50-100 images per category")
        print("   Good: 200-500 images per category")
        print("   Excellent: 1000+ images per category")


def create_readme():
    """Create README with instructions"""
    readme_path = TRAINING_DATA / "README.md"
    with open(readme_path, 'w') as f:
        f.write("# Training Data for Image Classifier\n\n")
        f.write("## Current Dataset\n\n")
        f.write("This folder contains real maintenance images organized by category.\n\n")
        f.write("## To Add More Images:\n\n")
        f.write("1. Place images in the appropriate category folder\n")
        f.write("2. Supported formats: .jpg, .jpeg, .png\n")
        f.write("3. Recommended: 100-500 images per category\n\n")
        f.write("## Categories:\n\n")
        for cat in CATEGORY_MAP.keys():
            f.write(f"- `{cat}/` - {', '.join(CATEGORY_MAP[cat][:3])}, etc.\n")
        f.write("\n## Retrain Model:\n\n")
        f.write("```bash\n")
        f.write("python train_image_classifier.py --epochs 20 --batch-size 16\n")
        f.write("```\n")
    
    print(f"\n[INFO] Created README: {readme_path}")


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("  RETRAIN IMAGE CLASSIFIER WITH REAL DATA")
    print("="*70)
    
    # Step 1: Create folders
    create_training_folders()
    
    # Step 2: Organize electrical images
    electrical_count = organize_electrical_images()
    
    # Step 3: Organize other datasets
    other_count = organize_other_datasets()
    
    # Step 4: Print stats
    print_dataset_stats()
    
    # Step 5: Create README
    create_readme()
    
    # Final instructions
    print("\n" + "="*70)
    print("  NEXT STEPS")
    print("="*70)
    print("\n1. Review the organized images:")
    print(f"   {TRAINING_DATA}")
    print("\n2. Add more images to categories that are LOW or EMPTY")
    print("\n3. Retrain the model:")
    print("   cd scripts")
    print("   python train_image_classifier.py --epochs 20 --batch-size 16")
    print("\n4. Test the new model in your app")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()

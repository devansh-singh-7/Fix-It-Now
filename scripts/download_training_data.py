"""
Dataset Downloader for Image Classifier Training
=================================================

Downloads and organizes public datasets for training the maintenance image classifier.

Usage:
  python download_training_data.py --all
  python download_training_data.py --dataset damaged_constructions
  python download_training_data.py --list

Requirements:
  pip install requests kaggle tqdm pillow
  
For Kaggle datasets, you need to:
  1. Create a Kaggle account at kaggle.com
  2. Go to Account -> Create New API Token
  3. Place kaggle.json in ~/.kaggle/ (Linux/Mac) or C:/Users/<user>/.kaggle/ (Windows)
"""

import os
import sys
import argparse
import zipfile
import shutil
from pathlib import Path
from urllib.request import urlretrieve
from urllib.error import URLError

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None
    print("[INFO] Install tqdm for progress bars: pip install tqdm")

try:
    import kaggle
    from kaggle.api.kaggle_api_extended import KaggleApi
    KAGGLE_AVAILABLE = True
except ImportError:
    KAGGLE_AVAILABLE = False
    print("[WARNING] Kaggle API not available. Install with: pip install kaggle")

# ============================================================
# Configuration
# ============================================================

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "training_data"

# Category mapping for downloaded datasets
CATEGORIES = [
    'plumbing', 'electrical', 'hvac', 'appliance', 'carpentry',
    'cleaning', 'painting', 'landscaping', 'security', 'other'
]

# ============================================================
# Dataset Definitions
# ============================================================

DATASETS = {
    'damaged_constructions': {
        'name': 'Damaged Constructions Image Dataset',
        'source': 'kaggle',
        'kaggle_id': 'utkrisht1303/damaged-constructions-image-dataset',
        'description': 'Images of damaged and non-damaged buildings, highways, debris',
        'mapping': {
            'Damaged building': 'carpentry',
            'Non-damaged building': 'other',
            'Damaged highway': 'other',
            'Non-damaged highway': 'other',
            'Debris': 'cleaning'
        }
    },
    'electrical_wiring_faults': {
        'name': 'Electrical Wiring Faults Detection',
        'source': 'kaggle',
        'kaggle_id': 'karelverhoeven/electrical-wiring-faults-detection',
        'description': 'Images of electrical components with intentional faults',
        'mapping': {
            '*': 'electrical'
        }
    },
    'concrete_damage': {
        'name': 'Concrete Crack Detection',
        'source': 'kaggle', 
        'kaggle_id': 'arunrk7/surface-crack-detection',
        'description': 'Concrete surface images with cracks',
        'mapping': {
            'Positive': 'painting',  # Cracks go to painting category
            'Negative': 'other'
        }
    },
    'heritage_defects': {
        'name': 'Heritage Building Defect Detection',
        'source': 'kaggle',
        'kaggle_id': 'sarthakvajpayee/heritage-building-defect-detection-dataset',
        'description': 'Heritage building defects: cracks, staining, etc.',
        'mapping': {
            'Cracking': 'painting',
            'Deterioration': 'carpentry',
            'Staining': 'cleaning',
            'Moss': 'landscaping',
            'Alkalization': 'painting'
        }
    },
    'pipes': {
        'name': 'Pipes Object Detection',
        'source': 'roboflow',
        'url': None,  # Roboflow requires API key
        'description': 'Industrial pipe images for corrosion/wear detection',
        'mapping': {
            '*': 'plumbing'
        }
    }
}

# ============================================================
# Download Functions
# ============================================================

class DownloadProgressBar:
    """Progress bar for downloads"""
    def __init__(self, total=None):
        self.pbar = None
        if tqdm:
            self.pbar = tqdm(total=total, unit='B', unit_scale=True)
    
    def __call__(self, block_num, block_size, total_size):
        if self.pbar:
            if self.pbar.total != total_size:
                self.pbar.total = total_size
            self.pbar.update(block_size)
    
    def close(self):
        if self.pbar:
            self.pbar.close()


def download_kaggle_dataset(dataset_id: str, output_dir: Path) -> bool:
    """Download dataset from Kaggle"""
    if not KAGGLE_AVAILABLE:
        print("[ERROR] Kaggle API not available. Please install: pip install kaggle")
        print("       And configure your API credentials (see script docstring)")
        return False
    
    try:
        api = KaggleApi()
        api.authenticate()
        
        print(f"[INFO] Downloading {dataset_id} from Kaggle...")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        api.dataset_download_files(dataset_id, path=str(output_dir), unzip=True)
        
        print(f"[SUCCESS] Downloaded to {output_dir}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to download {dataset_id}: {e}")
        return False


def organize_dataset(source_dir: Path, mapping: dict, target_dir: Path):
    """
    Organize downloaded images into category folders.
    
    Args:
        source_dir: Directory with downloaded images
        mapping: Dict mapping source folder names to categories
        target_dir: Root training data directory
    """
    print(f"[INFO] Organizing images from {source_dir}")
    
    image_count = 0
    
    # Handle wildcard mapping (all images go to one category)
    if '*' in mapping:
        target_category = mapping['*']
        target_cat_dir = target_dir / target_category
        target_cat_dir.mkdir(parents=True, exist_ok=True)
        
        # Find all images recursively
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif']:
            for img_path in source_dir.rglob(ext):
                dest_path = target_cat_dir / f"imported_{image_count}_{img_path.name}"
                shutil.copy2(img_path, dest_path)
                image_count += 1
    else:
        # Map specific folders to categories
        for folder_name, category in mapping.items():
            source_folder = None
            
            # Find the folder (case-insensitive search)
            for item in source_dir.rglob('*'):
                if item.is_dir() and folder_name.lower() in item.name.lower():
                    source_folder = item
                    break
            
            if not source_folder:
                continue
            
            target_cat_dir = target_dir / category
            target_cat_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy images
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif']:
                for img_path in source_folder.glob(ext):
                    dest_path = target_cat_dir / f"imported_{image_count}_{img_path.name}"
                    shutil.copy2(img_path, dest_path)
                    image_count += 1
    
    print(f"[INFO] Organized {image_count} images")
    return image_count


def download_and_organize(dataset_key: str) -> int:
    """Download a dataset and organize into training folders"""
    if dataset_key not in DATASETS:
        print(f"[ERROR] Unknown dataset: {dataset_key}")
        return 0
    
    dataset = DATASETS[dataset_key]
    print(f"\n{'='*60}")
    print(f"Dataset: {dataset['name']}")
    print(f"Description: {dataset['description']}")
    print(f"{'='*60}")
    
    # Create temp download directory
    download_dir = SCRIPT_DIR / "temp_downloads" / dataset_key
    download_dir.mkdir(parents=True, exist_ok=True)
    
    # Download based on source
    success = False
    if dataset['source'] == 'kaggle':
        success = download_kaggle_dataset(dataset['kaggle_id'], download_dir)
    elif dataset['source'] == 'roboflow':
        print("[WARNING] Roboflow datasets require API key configuration")
        print("         Please download manually from roboflow.com")
        return 0
    else:
        print(f"[ERROR] Unknown source: {dataset['source']}")
        return 0
    
    if not success:
        return 0
    
    # Organize into training folders
    image_count = organize_dataset(download_dir, dataset['mapping'], DATA_DIR)
    
    # Optional: clean up temp directory
    # shutil.rmtree(download_dir)
    
    return image_count


def list_datasets():
    """List available datasets"""
    print("\n" + "="*60)
    print("Available Datasets for Training")
    print("="*60)
    
    for key, dataset in DATASETS.items():
        print(f"\n[{key}]")
        print(f"  Name: {dataset['name']}")
        print(f"  Source: {dataset['source']}")
        print(f"  Description: {dataset['description']}")
        print(f"  Categories: {', '.join(set(dataset['mapping'].values()))}")


def setup_training_folders():
    """Create empty training data folders"""
    print(f"[INFO] Setting up training data folders at {DATA_DIR}")
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    for category in CATEGORIES:
        cat_dir = DATA_DIR / category
        cat_dir.mkdir(exist_ok=True)
        
        readme = cat_dir / "README.txt"
        if not readme.exists():
            with open(readme, 'w') as f:
                f.write(f"Add {category} maintenance images here.\n")
                f.write("Supported formats: .jpg, .jpeg, .png, .webp, .gif\n")
    
    print(f"[SUCCESS] Created {len(CATEGORIES)} category folders")


def print_stats():
    """Print statistics about current training data"""
    print("\n" + "="*60)
    print("Current Training Data Statistics")
    print("="*60)
    
    total = 0
    for category in CATEGORIES:
        cat_dir = DATA_DIR / category
        if cat_dir.exists():
            count = sum(1 for _ in cat_dir.glob('*') if _.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.gif'])
            total += count
            status = "✓" if count >= 50 else "○"
            print(f"  {status} {category}: {count} images")
        else:
            print(f"  ✗ {category}: folder missing")
    
    print(f"\n  Total: {total} images")
    print(f"  Recommended: 50-200 per category for good accuracy")


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Download training data for image classifier")
    
    parser.add_argument('--list', action='store_true', help='List available datasets')
    parser.add_argument('--dataset', type=str, help='Download specific dataset')
    parser.add_argument('--all', action='store_true', help='Download all available datasets')
    parser.add_argument('--setup', action='store_true', help='Set up training folder structure')
    parser.add_argument('--stats', action='store_true', help='Show training data statistics')
    
    args = parser.parse_args()
    
    if args.list:
        list_datasets()
    elif args.setup:
        setup_training_folders()
    elif args.stats:
        print_stats()
    elif args.dataset:
        setup_training_folders()
        download_and_organize(args.dataset)
        print_stats()
    elif args.all:
        setup_training_folders()
        total = 0
        for key in DATASETS:
            if DATASETS[key]['source'] == 'kaggle':
                total += download_and_organize(key)
        print_stats()
    else:
        parser.print_help()
        print("\n" + "-"*60)
        print("Quick Start:")
        print("  1. python download_training_data.py --setup")
        print("  2. python download_training_data.py --list")
        print("  3. python download_training_data.py --dataset damaged_constructions")
        print("  4. python download_training_data.py --stats")


if __name__ == "__main__":
    main()

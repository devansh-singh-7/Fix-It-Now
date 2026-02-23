"""
Download Images from Bing for Training
======================================

This script downloads images for each maintenance category.

Requirements:
  pip install bing-image-downloader

Usage:
  python download_images.py
"""

try:
    from bing_image_downloader import downloader  # type: ignore
except ImportError:
    print("\n[ERROR] bing-image-downloader not installed")
    print("Install it with: pip install bing-image-downloader")
    exit(1)

from pathlib import Path

# Configuration
OUTPUT_DIR = Path(__file__).parent / "training_data"
IMAGES_PER_CATEGORY = 100  # Adjust as needed

# Search queries for each category
SEARCH_QUERIES = {
    'plumbing': [
        'plumbing leak',
        'broken pipe',
        'water damage plumbing',
        'toilet repair',
        'sink damage'
    ],
    'electrical': [
        'electrical wiring fault',
        'broken electrical outlet',
        'exposed wiring',
        'electrical repair',
        'circuit breaker problem'
    ],
    'hvac': [
        'air conditioner repair',
        'hvac ductwork',
        'broken thermostat',
        'hvac maintenance',
        'air conditioning unit'
    ],
    'appliance': [
        'broken refrigerator',
        'washing machine repair',
        'dishwasher problem',
        'appliance damage',
        'broken oven'
    ],
    'carpentry': [
        'damaged door',
        'broken furniture',
        'wood damage',
        'carpentry repair',
        'damaged window frame'
    ],
    'cleaning': [
        'stain damage',
        'mold damage',
        'debris cleanup',
        'cleaning required',
        'dirty maintenance'
    ],
    'painting': [
        'cracked wall',
        'peeling paint',
        'wall damage',
        'paint repair needed',
        'damaged drywall'
    ],
    'landscaping': [
        'lawn damage',
        'landscape maintenance',
        'tree damage',
        'garden repair',
        'outdoor maintenance'
    ],
    'security': [
        'broken lock',
        'security camera installation',
        'door lock repair',
        'security system',
        'access control'
    ],
    'other': [
        'general maintenance',
        'building repair',
        'facility maintenance'
    ]
}

def download_category_images(category, queries, limit_per_query=20):
    """Download images for a specific category"""
    print(f"\n{'='*60}")
    print(f"Downloading: {category.upper()}")
    print('='*60)
    
    category_dir = OUTPUT_DIR / category
    category_dir.mkdir(parents=True, exist_ok=True)
    
    total_downloaded = 0
    
    for query in queries:
        print(f"\n[INFO] Query: '{query}'")
        try:
            downloader.download(
                query,
                limit=limit_per_query,
                output_dir=str(OUTPUT_DIR),
                adult_filter_off=True,
                force_replace=False,
                timeout=15,
                verbose=False
            )
            
            # Move downloaded images to category folder
            query_folder = OUTPUT_DIR / query
            if query_folder.exists():
                count = 0
                for img in query_folder.glob('*'):
                    if img.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        new_name = category_dir / f"{category}_{total_downloaded:04d}_{img.name}"
                        img.rename(new_name)
                        count += 1
                        total_downloaded += 1
                
                # Remove empty query folder
                query_folder.rmdir()
                print(f"  [OK] Downloaded {count} images")
        
        except Exception as e:
            print(f"  [ERROR] Failed: {e}")
    
    print(f"\n[SUCCESS] {category}: {total_downloaded} total images")
    return total_downloaded


def main():
    """Main download function"""
    print("\n" + "="*70)
    print("  DOWNLOAD TRAINING IMAGES FROM BING")
    print("="*70)
    print(f"\nImages will be saved to: {OUTPUT_DIR}")
    print(f"Target: ~{IMAGES_PER_CATEGORY} images per category")
    
    input("\nPress Enter to start downloading (Ctrl+C to cancel)...")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    total_images = 0
    limit_per_query = IMAGES_PER_CATEGORY // len(SEARCH_QUERIES['plumbing'])
    
    for category, queries in SEARCH_QUERIES.items():
        count = download_category_images(category, queries, limit_per_query)
        total_images += count
    
    # Print final stats
    print("\n" + "="*70)
    print("  DOWNLOAD COMPLETE")
    print("="*70)
    print(f"\nTotal images downloaded: {total_images}")
    print("\nDataset Statistics:")
    
    for category in SEARCH_QUERIES.keys():
        cat_dir = OUTPUT_DIR / category
        if cat_dir.exists():
            count = len(list(cat_dir.glob('*.[jp][pn]g')))
            status = "GOOD" if count >= 50 else "OK" if count >= 20 else "LOW"
            print(f"  [{status}] {category:15s}: {count:4d} images")
    
    print("\n" + "="*70)
    print("NEXT STEPS:")
    print("="*70)
    print("\n1. Review downloaded images and remove bad ones")
    print("2. Add your own photos to supplement")
    print("3. Retrain the model:")
    print("   python train_image_classifier.py --epochs 20")
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Download interrupted by user")
    except Exception as e:
        print(f"\n[ERROR] {e}")

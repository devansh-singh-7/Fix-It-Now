"""
Organize extracted datasets into training folders
"""
import shutil
from pathlib import Path

# Paths
ROOT = Path(r"c:\Users\devan\OneDrive\Desktop\Fix-It-Now")
TRAINING_DATA = ROOT / "scripts" / "training_data"

# Create training folders
categories = ['plumbing', 'electrical', 'hvac', 'appliance', 'carpentry', 
              'cleaning', 'painting', 'landscaping', 'security', 'other']

for cat in categories:
    (TRAINING_DATA / cat).mkdir(parents=True, exist_ok=True)

def copy_images(src_dir: Path, dest_category: str, limit: int = 2000):
    """Copy images from source to training category folder"""
    if not src_dir.exists():
        print(f"  [SKIP] {src_dir} not found")
        return 0
    
    dest = TRAINING_DATA / dest_category
    count = 0
    
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif', '*.JPG', '*.PNG']:
        for img in src_dir.glob(ext):
            if count >= limit:
                break
            dest_file = dest / f"imported_{dest_category}_{count}_{img.name}"
            shutil.copy2(img, dest_file)
            count += 1
    
    print(f"  [OK] {dest_category}: {count} images from {src_dir.name}")
    return count

print("=" * 60)
print("Organizing Training Data")
print("=" * 60)

total = 0

# 1. Damaged Constructions (from train/ folder)
print("\n1. Damaged Constructions Dataset:")
total += copy_images(ROOT / "train" / "damaged_buildings", "carpentry", 1000)
total += copy_images(ROOT / "train" / "debris", "cleaning", 500)

# 2. Electrical Wiring Faults
print("\n2. Electrical Wiring Faults Dataset:")
total += copy_images(ROOT / "Predictive Maintenance for Electrical Wiring Faults" / "images", "electrical", 500)

# 3. Concrete Crack Detection (Positive = cracks, for painting category)
print("\n3. Concrete Crack Detection Dataset:")
total += copy_images(ROOT / "Positive", "painting", 2000)

# 4. Test folder (check what's inside)
print("\n4. Test folder (Damaged Constructions test split):")
test_dir = ROOT / "test"
if test_dir.exists():
    for subdir in test_dir.iterdir():
        if subdir.is_dir():
            print(f"  Found: {subdir.name}")

print("\n" + "=" * 60)
print(f"Total images organized: {total}")
print("=" * 60)

# Print final stats
print("\nTraining Data Statistics:")
for cat in categories:
    cat_dir = TRAINING_DATA / cat
    count = sum(1 for f in cat_dir.glob('*') if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.gif'])
    status = "OK" if count >= 50 else "LOW" if count > 0 else "EMPTY"
    print(f"  [{status}] {cat}: {count} images")

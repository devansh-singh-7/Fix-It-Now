"""
MASTER SCRIPT: Train Image Classifier with Hybrid Data
Combines real images with improved synthetic data for better accuracy

This script runs:
1. Organize real images (optional - already done)
2. Generate improved synthetic data
3. Train hybrid classifier
"""
import subprocess
import sys
from pathlib import Path
import argparse

def run_command(description, command):
    """Run a command and handle output"""
    print("\n" + "="*70)
    print(f"  {description}")
    print("="*70 + "\n")
    
    result = subprocess.run(command, shell=True)
    
    if result.returncode != 0:
        print(f"\n❌ Error: {description} failed!")
        sys.exit(1)
    
    print(f"\n✓ {description} completed successfully!")
    return True

def main():
    parser = argparse.ArgumentParser(
        description='Train image classifier with hybrid data (real + synthetic)'
    )
    parser.add_argument('--synthetic-images', type=int, default=150,
                       help='Number of synthetic images per category (default: 150)')
    parser.add_argument('--epochs', type=int, default=25,
                       help='Number of training epochs (default: 25)')
    parser.add_argument('--batch-size', type=int, default=32,
                       help='Training batch size (default: 32)')
    parser.add_argument('--skip-synthetic', action='store_true',
                       help='Skip synthetic data generation (use existing)')
    
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("  IMAGE CLASSIFIER TRAINING - HYBRID DATA APPROACH")
    print("="*70)
    print("\nThis will:")
    print(f"  1. Generate {args.synthetic_images} synthetic images per category")
    print(f"  2. Combine with your existing real images")
    print(f"  3. Train model for {args.epochs} epochs")
    print("\nYour real images:")
    print("  - 86 electrical images in training_data/electrical")
    print("  - 5,657 images in Negative folder (can be manually sorted)")
    print("")
    
    # Step 1: Check real images
    training_data_dir = Path(__file__).parent / 'training_data'
    if not training_data_dir.exists():
        print("Creating training_data directory structure...")
        run_command(
            "Initialize directories",
            f'python "{Path(__file__).parent / "organize_real_images.py"}"'
        )
    
    # Step 2: Generate synthetic data
    if not args.skip_synthetic:
        run_command(
            f"Generate {args.synthetic_images} synthetic images per category",
            f'python "{Path(__file__).parent / "generate_improved_synthetic.py"}" '
            f'--images-per-category {args.synthetic_images}'
        )
    else:
        print("\n⏭ Skipping synthetic data generation (using existing images)")
    
    # Step 3: Train model
    run_command(
        f"Train hybrid classifier ({args.epochs} epochs)",
        f'python "{Path(__file__).parent / "train_hybrid_classifier.py"}" '
        f'--epochs {args.epochs} --batch-size {args.batch_size}'
    )
    
    print("\n" + "="*70)
    print("  🎉 ALL STEPS COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\nNext steps:")
    print("  1. Start the FastAPI server: npm run ai:dev")
    print("  2. Test the model in your Next.js application")
    print("  3. Check api/models/training_history.json for accuracy metrics")
    print("\nTo improve further:")
    print("  - Manually sort images from 'Negative' folder into categories")
    print("  - Add more real images for underrepresented categories")
    print("  - Retrain with more epochs if needed")
    print("")

if __name__ == "__main__":
    main()

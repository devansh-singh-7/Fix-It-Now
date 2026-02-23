# Training Image Classifier with Hybrid Data

This guide explains how to train your image classifier using a **hybrid approach** that combines:
- ✅ Your **real images** (86 electrical images + 5,657 in Negative folder)
- ✅ **Improved synthetic images** (enhanced with realistic textures and augmentations)

## Quick Start

### Option 1: One-Command Training (Recommended)

```bash
cd scripts
python train_complete.py
```

This will:
1. Generate 150 improved synthetic images per category
2. Combine with your real images
3. Train the model for 25 epochs

### Option 2: Custom Training

```bash
cd scripts

# Step 1: Generate synthetic data (optional)
python generate_improved_synthetic.py --images-per-category 200

# Step 2: Train the model
python train_hybrid_classifier.py --epochs 30 --batch-size 16
```

## Your Current Data

### Real Images
- **86 electrical images** in `scripts/training_data/electrical/`
- **5,657 images** in `Negative/` folder (need manual categorization)

### What the Scripts Do

#### 1. `organize_real_images.py`
- Scans your image folders
- Reports current organization
- Helps you understand what data you have

#### 2. `generate_improved_synthetic.py`
- Creates realistic synthetic images with:
  - Category-specific color schemes
  - Geometric patterns (pipes for plumbing, wires for electrical, etc.)
  - Realistic textures and gradients
  - Data augmentation (blur, brightness, rotation)
  
**Better than before**: Old synthetic data was just colored blocks. New version has realistic patterns and textures.

#### 3. `train_hybrid_classifier.py`
- Combines real + synthetic images
- Uses advanced architecture:
  - MobileNetV2 backbone (pretrained on ImageNet)
  - Enhanced classifier head with dropout
  - Weighted sampling for balanced training
- Tracks both real and synthetic image performance
- Saves best model based on validation accuracy

#### 4. `train_complete.py`
- Master script that runs everything in sequence
- Easy to use with sensible defaults

## Training Options

```bash
# Quick training (15-20 minutes on CPU)
python train_complete.py --epochs 15

# Intensive training (better accuracy, 1-2 hours on CPU)
python train_complete.py --epochs 50 --synthetic-images 300

# Use only real images (skip synthetic)
python train_complete.py --skip-synthetic --epochs 20

# Custom batch size (reduce if out of memory)
python train_complete.py --batch-size 16
```

## Expected Results

### With Current Data (86 real electrical + synthetic)
- **Training Accuracy**: 75-85%
- **Validation Accuracy**: 60-75%

This is **much better** than the old 99% fake accuracy on synthetic-only data!

### After Manual Categorization (5,657 Negative images)
If you sort the images from `Negative/` folder into proper categories:
- **Training Accuracy**: 85-95%
- **Validation Accuracy**: 75-90%

## Improving Model Accuracy

### 1. Sort Negative Folder Images
The `Negative/` folder has 5,657 images! Manually move them to appropriate categories:

```bash
# Example structure
scripts/training_data/
  ├── plumbing/        # Move pipe/leak images here
  ├── electrical/      # Move wire/switch images here  
  ├── hvac/            # Move AC/vent images here
  └── ...
```

### 2. Adjust Synthetic Ratio
If you have many real images in a category, generate fewer synthetic:

```python
# Edit generate_improved_synthetic.py
# Manually control per-category amounts
```

### 3. Collect More Real Data
- Take photos with your phone
- Download from datasets
- Use images from actual maintenance tickets

### 4. Train Longer
```bash
python train_complete.py --epochs 50
```

## Output Files

After training:
- `api/models/image_classifier.pt` - Trained model (loads in FastAPI)
- `api/models/training_history.json` - Accuracy/loss metrics
- `scripts/training_data/*/synthetic_*.jpg` - Generated synthetic images

## Monitoring Training

Watch the progress:
```
Epoch 1/25
Training: 100%|██████████| 45/45 [00:32<00:00, loss: 1.234, acc: 65.23%]
Validation: 100%|██████████| 12/12 [00:05<00:00, loss: 1.456, acc: 58.91%]

Epoch 1 Summary:
  Train Loss: 1.2340 | Train Acc: 65.23%
  Val Loss: 1.4560 | Val Acc: 58.91%
  ✓ New best model saved! (Val Acc: 58.91%)
```

## Troubleshooting

### Out of Memory
```bash
python train_complete.py --batch-size 16
```

### Too Slow
```bash
# Reduce epochs
python train_complete.py --epochs 10

# Or skip synthetic generation if already done
python train_complete.py --skip-synthetic
```

### Low Accuracy
1. Sort Negative folder images into categories
2. Generate more synthetic images
3. Train for more epochs
4. Check `training_history.json` - if train_acc >> val_acc, you're overfitting

## Architecture Details

### Model: Enhanced MobileNetV2
```
- Backbone: MobileNetV2 (pretrained ImageNet)
- Classifier: 1280 → 512 → 256 → 10
- Dropout: 0.5, 0.25, 0.15 (progressive)
- BatchNorm after each dense layer
- Total params: ~2.3M (lightweight!)
```

### Data Augmentation
```python
- Random crop 224x224
- Horizontal flip (50%)
- Vertical flip (20%)
- Rotation ±15°
- Color jitter (brightness, contrast, saturation)
- Random affine transform
```

### Training Strategy
- **Optimizer**: AdamW (weight_decay=0.01)
- **Scheduler**: ReduceLROnPlateau (factor=0.5, patience=3)
- **Sampling**: Weighted (balances class distribution)
- **Loss**: CrossEntropyLoss
- **Split**: 80% train, 20% validation

## Next Steps After Training

1. **Start FastAPI server**:
   ```bash
   npm run ai:dev
   ```

2. **Test in application**:
   - Go to http://localhost:3000
   - Upload maintenance images
   - Check classification results

3. **Review metrics**:
   ```bash
   # Check training history
   cat api/models/training_history.json
   ```

4. **Iterate**:
   - If accuracy is low, add more real images
   - If overfitting, reduce synthetic images
   - If underfitting, train longer

## Support

For issues or questions, check:
- `MODEL_IMPROVEMENT_GUIDE.md` - General model improvement tips
- `DATA_COLLECTION_GUIDE.md` - How to gather more real data
- Training logs in terminal output

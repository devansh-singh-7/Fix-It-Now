# Image Classifier Model Improvement Guide

## 🔍 Problem Diagnosis

Your model has **99-100% accuracy on synthetic data** but **fails on real images** because:

1. ❌ It was trained on computer-generated fake images (simple color patterns)
2. ❌ Fake data doesn't represent real maintenance issues
3. ❌ Model learned artificial patterns, not real-world features

## ✅ Solution: Complete Retraining Process

### Step 1: Organize Your Real Images

Run this script to organize your existing real images:

```bash
cd scripts
python retrain_with_real_data.py
```

This will:
- Copy electrical wiring images (from your existing dataset)
- Copy damaged building images
- Copy concrete crack images
- Organize everything by category

### Step 2: Collect More Real Data (IMPORTANT!)

**Minimum Requirements:**
- ✅ At least 50-100 images per category
- ✅ Diverse angles, lighting, conditions
- ✅ Real maintenance issues, not staged photos

**Where to get images:**
1. **Take photos yourself**: Use your phone to photograph real maintenance issues
2. **Search online datasets**: Look for construction damage, electrical faults, plumbing issues
3. **Use existing tickets**: If you have old maintenance reports with photos
4. **Google Images**: Search "electrical wiring fault", "plumbing leak", etc. (check licenses)

**Recommended sources:**
- Kaggle datasets (construction damage, electrical faults)
- Open Images Dataset (filter by category keywords)
- ImageNet subsets
- Your own maintenance records

### Step 3: Retrain with Real Data

```bash
cd scripts
python train_image_classifier.py --epochs 20 --batch-size 16
```

**Training Parameters Explained:**
- `--epochs 20`: Train for 20 cycles through the data
- `--batch-size 16`: Process 16 images at a time (adjust based on your RAM)
- `--lr 0.001`: Learning rate (default, can reduce to 0.0001 for fine-tuning)

## 📊 Expected Results After Retraining

With real data:
- **Training accuracy**: 70-85% (initially)
- **Validation accuracy**: 65-80% (more realistic)
- **Real-world accuracy**: 60-75% (depends on data quality)

This is NORMAL and much better than fake 99% on synthetic data!

## 🚀 Advanced Improvements

### 1. Data Augmentation (Already Included)

The training script already includes:
- ✅ Random crops
- ✅ Horizontal flips
- ✅ Rotation (±10°)
- ✅ Color jitter (brightness, contrast, saturation)

### 2. Collect More Data Per Category

**Priority categories** (collect more if accuracy is low):
| Category | Target Images | Current Status |
|----------|---------------|----------------|
| Electrical | 200+ | Check after organizing |
| Plumbing | 200+ | Need to collect |
| HVAC | 200+ | Need to collect |
| Carpentry | 200+ | Available (damaged buildings) |
| Painting | 200+ | Available (cracks) |

### 3. Fine-Tuning Strategies

If accuracy is still low after retraining:

**Option A: Increase training epochs**
```bash
python train_image_classifier.py --epochs 30
```

**Option B: Reduce learning rate (for fine-tuning)**
```bash
python train_image_classifier.py --epochs 20 --lr 0.0001
```

**Option C: Increase batch size (if you have enough RAM)**
```bash
python train_image_classifier.py --epochs 20 --batch-size 32
```

### 4. Modify Training Script for Better Accuracy

Add these improvements to `train_image_classifier.py`:

**A. Add more aggressive augmentation:**
```python
train_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),  # Increased from 10
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),  # Added hue
    transforms.RandomGrayscale(p=0.1),  # Sometimes convert to grayscale
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
```

**B. Use class weights (if categories are imbalanced):**
```python
# Count samples per class
class_counts = [0] * len(CATEGORIES)
for _, label in train_dataset:
    class_counts[label] += 1

# Calculate weights (inverse frequency)
class_weights = [1.0 / count if count > 0 else 0 for count in class_counts]
class_weights = torch.FloatTensor(class_weights).to(device)

# Use weighted loss
criterion = nn.CrossEntropyLoss(weight=class_weights)
```

**C. Add early stopping:**
```python
# In training loop
patience = 5
best_acc = 0
patience_counter = 0

for epoch in range(args.epochs):
    # ... training code ...
    
    if val_acc > best_acc:
        best_acc = val_acc
        patience_counter = 0
        # Save model
    else:
        patience_counter += 1
        if patience_counter >= patience:
            print(f"Early stopping at epoch {epoch}")
            break
```

### 5. Use Pre-trained Models as Baseline

Try different backbone architectures:

**Current: MobileNetV2** (fast, lightweight)
- Good for: CPU training, mobile deployment
- Accuracy: Medium

**Alternative: ResNet50** (better accuracy)
```python
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Linear(num_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(CATEGORIES))
)
```

**Alternative: EfficientNet-B0** (best balance)
```python
model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
num_features = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(0.2),
    nn.Linear(num_features, len(CATEGORIES))
)
```

## 📈 Monitoring Training Progress

After each epoch, you'll see:
```
Epoch 1/20
  Train Loss: 1.4523 | Train Acc: 52.34%
  Val Loss:   1.2341 | Val Acc:   48.76%
```

**Good signs:**
- ✅ Training loss decreasing steadily
- ✅ Validation accuracy increasing
- ✅ Gap between train/val accuracy < 15%

**Bad signs:**
- ❌ Validation accuracy stuck or decreasing (overfitting)
- ❌ Training accuracy 99% but validation 50% (memorization)
- ❌ Both accuracies very low (need more data or different model)

## 🧪 Testing Your Retrained Model

1. **Start FastAPI server:**
```bash
cd api
uvicorn main:app --reload --port 8000
```

2. **Test in your app:**
- Go to http://localhost:3000/dashboard
- Create a new ticket
- Upload a real maintenance image
- Check if category is correct

3. **Check model predictions in console:**
```javascript
// Browser console should show:
AI Predictions: [
  {className: "water faucet", probability: 0.78},
  {className: "plumbing fixture", probability: 0.65},
  {className: "sink", probability: 0.43}
]
// Should map to "plumbing" category
```

## 📝 Quick Checklist

- [ ] Run `retrain_with_real_data.py` to organize images
- [ ] Check dataset stats (aim for 100+ images per category)
- [ ] Collect more images for categories with < 50 images
- [ ] Retrain model: `python train_image_classifier.py --epochs 20`
- [ ] Check training output (val accuracy should be 60-80%)
- [ ] Test in app with real images
- [ ] If accuracy low, collect more data and retrain

## 🎯 Realistic Expectations

**With 50-100 images per category:**
- Accuracy: 60-70%
- Good enough for: Basic categorization
- Limitations: May confuse similar categories

**With 200-500 images per category:**
- Accuracy: 70-85%
- Good enough for: Production use
- Limitations: Occasional mistakes on edge cases

**With 1000+ images per category:**
- Accuracy: 80-90%
- Good enough for: Professional deployment
- Limitations: Rare edge cases

## 💡 Pro Tips

1. **Quality > Quantity**: 100 diverse, clear images beat 500 similar images
2. **Label carefully**: Wrong labels = wrong predictions
3. **Balance categories**: Similar number of images per category
4. **Augmentation helps**: But can't replace real data
5. **Test regularly**: Retrain → Test → Collect more → Repeat

## 🆘 Troubleshooting

**Q: Model accuracy stuck at 60%?**
- A: Need more diverse training images

**Q: Model always predicts "other"?**
- A: "Other" category has too many images, balance the dataset

**Q: Model works on some categories but not others?**
- A: Those categories need more training images

**Q: Training very slow on CPU?**
- A: Use smaller batch size (--batch-size 8) or fewer epochs

**Q: Out of memory error?**
- A: Reduce batch size to 8 or 4

---

**Remember**: A model trained on real data with 70% accuracy is infinitely better than one with 99% on fake data! 🎯

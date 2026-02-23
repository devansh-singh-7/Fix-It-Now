# Real Data Collection Guide for Image Classifier

## 🎯 **Your Goal**
Collect **50-200 real images per category** to replace synthetic training data.

---

## 🚀 **Method 1: Automated Download (Easiest)**

### **Step 1: Install Downloader**
```bash
pip install bing-image-downloader
```

### **Step 2: Run Download Script**
```bash
cd scripts
python download_images.py
```

This will automatically download ~100 images per category from Bing Images.

**Pros**: ✅ Fast, automated, lots of images  
**Cons**: ❌ Need to manually remove bad/irrelevant images

---

## 📸 **Method 2: Take Your Own Photos (Best Quality)**

### **What You Need:**
- Smartphone with camera
- Access to buildings/facilities with maintenance issues

### **Photo Guidelines:**

**Plumbing (Target: 50 photos)**
- ✅ Dripping faucets
- ✅ Clogged drains
- ✅ Broken toilets
- ✅ Leaking pipes
- ✅ Water stains on ceiling
- ❌ Don't need: Brand new fixtures

**Electrical (Target: 50 photos)**
- ✅ Exposed wiring
- ✅ Broken light switches
- ✅ Damaged outlets
- ✅ Flickering lights
- ✅ Electrical panels
- ❌ Don't need: Perfect installations

**HVAC (Target: 50 photos)**
- ✅ AC units (working or broken)
- ✅ Vents and ductwork
- ✅ Thermostats
- ✅ Heating systems
- ❌ Don't need: Only outdoor units

**Carpentry (Target: 50 photos)**
- ✅ Damaged doors
- ✅ Broken windows
- ✅ Scratched furniture
- ✅ Loose cabinets
- ❌ Don't need: Perfect woodwork

**Painting (Target: 50 photos)**
- ✅ Cracked walls
- ✅ Peeling paint
- ✅ Water damage on walls
- ✅ Holes in drywall
- ❌ Don't need: Freshly painted walls

**Photography Tips:**
1. Take multiple angles of same issue
2. Include context (not just close-ups)
3. Various lighting conditions
4. Both before/after repairs

---

## 🌐 **Method 3: Free Dataset Websites**

### **A. Kaggle (Recommended)**

**Link**: https://www.kaggle.com/datasets

**Top Datasets for You:**

1. **Building Damage Dataset**
   - Search: "building damage", "construction damage"
   - Good for: Carpentry, Painting categories
   - Size: Usually 1000+ images

2. **Electrical Equipment**
   - Search: "electrical", "power systems"
   - Good for: Electrical category
   - Size: 500+ images

3. **Plumbing & Fixtures**
   - Search: "bathroom", "plumbing"
   - Good for: Plumbing category
   - Size: 500+ images

**How to Download:**
1. Create free Kaggle account
2. Search for dataset
3. Click "Download" (requires API key for CLI)
4. Extract ZIP to `scripts/training_data/{category}/`

### **B. Open Images Dataset**

**Link**: https://storage.googleapis.com/openimages/web/index.html

**Relevant Categories** (search by name):
- Toilet, Sink, Bathtub → plumbing
- Light switch, Electrical outlet → electrical
- Air conditioner, Heater → hvac
- Washing machine, Refrigerator → appliance
- Door, Window, Furniture → carpentry

**Download Tool:**
```bash
pip install openimages
```

```python
from openimages.download import download_images

download_images(
    dest_dir='training_data/plumbing',
    class_labels=['Toilet', 'Sink'],
    limit=100
)
```

### **C. Unsplash (High Quality Stock)**

**Link**: https://unsplash.com/

**Best searches:**
- "plumbing"
- "construction damage"
- "home repair"
- "maintenance work"
- "broken appliance"

**Download**: Right-click → Save As

---

## 🔍 **Method 4: Google Images (Quick Batch)**

### **Chrome Extension Method:**

1. Install "Download All Images" extension
2. Google search: "plumbing leak"
3. Scroll to load ~100 images
4. Click extension → Download all
5. Move to `scripts/training_data/plumbing/`

### **Manual Download:**

1. Google Images search with filters:
   - Click "Tools"
   - Usage rights: "Creative Commons licenses"
   
2. Download 20-50 images per search:
   - "electrical fault repair"
   - "hvac system damaged"
   - "broken appliance kitchen"
   - etc.

---

## 🎬 **Method 5: YouTube Videos (Advanced)**

Extract frames from maintenance tutorial videos:

### **Step 1: Download YouTube Video**
```bash
pip install yt-dlp
yt-dlp "https://youtube.com/watch?v=VIDEO_ID"
```

### **Step 2: Extract Frames**
```python
import cv2

video = cv2.VideoCapture('plumbing_repair.mp4')
count = 0

while video.isOpened():
    ret, frame = video.read()
    if not ret:
        break
    
    # Save every 2 seconds (assuming 30 fps)
    if count % 60 == 0:
        cv2.imwrite(f'training_data/plumbing/frame_{count}.jpg', frame)
    
    count += 1

video.release()
```

**Good channels:**
- Home repair tutorials
- Construction documentation
- Facility maintenance videos

---

## 📂 **Organizing Your Data**

After collecting images, organize them:

```
scripts/training_data/
├── plumbing/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── ...
├── electrical/
│   ├── image001.jpg
│   └── ...
├── hvac/
├── appliance/
├── carpentry/
├── cleaning/
├── painting/
├── landscaping/
├── security/
└── other/
```

---

## ✅ **Quality Check**

Before training, review your dataset:

### **Remove These:**
- ❌ Blurry images
- ❌ Images with watermarks
- ❌ Irrelevant images (wrong category)
- ❌ Duplicate images
- ❌ Too dark/bright to see anything

### **Keep These:**
- ✅ Clear, well-lit images
- ✅ Shows the actual issue/equipment
- ✅ Various angles and contexts
- ✅ Different scenarios

### **Quick Review Script:**
```python
from PIL import Image
import os

def review_images(category_folder):
    """Open each image for quick review"""
    for img_file in os.listdir(category_folder):
        img_path = os.path.join(category_folder, img_file)
        img = Image.open(img_path)
        img.show()
        
        response = input(f"Keep {img_file}? (y/n/q): ")
        if response.lower() == 'n':
            os.remove(img_path)
            print(f"Deleted {img_file}")
        elif response.lower() == 'q':
            break

# Run for each category
review_images('training_data/plumbing')
```

---

## 📊 **Target Numbers**

| Category | Minimum | Good | Excellent |
|----------|---------|------|-----------|
| Plumbing | 50 | 100 | 200+ |
| Electrical | 50 | 100 | 200+ |
| HVAC | 50 | 100 | 200+ |
| Appliance | 50 | 100 | 200+ |
| Carpentry | 50 | 100 | 200+ |
| Cleaning | 30 | 50 | 100+ |
| Painting | 50 | 100 | 200+ |
| Landscaping | 30 | 50 | 100+ |
| Security | 30 | 50 | 100+ |
| Other | 20 | 50 | 100+ |

**Total Target: 500-1000 images minimum**

---

## 🚦 **Quick Start Recommendation**

**Week 1: Automated Collection**
1. Run `python download_images.py` (2 hours)
2. Review and delete bad images (1 hour)
3. Should have ~500-800 images

**Week 2: Supplement with Quality**
1. Take 20-30 photos yourself per category (1-2 days)
2. Download from Kaggle datasets (1 hour)
3. Should have 1000+ images total

**Week 3: Train**
1. Run `python train_image_classifier.py --epochs 20`
2. Test accuracy
3. Collect more data for weak categories

---

## 🆘 **If You're Stuck**

**"I don't have time to collect 1000 images!"**
→ Start with 50 per category (500 total). Train and see results. Add more later.

**"I can't take photos of maintenance issues!"**
→ Use Method 1 (automated download) + Kaggle datasets.

**"Download script isn't working!"**
→ Use Google Images + manual download (slower but works).

**"My categories have very different numbers of images!"**
→ That's OK! The training script handles class imbalance.

---

## 🎯 **Final Checklist**

- [ ] Have at least 50 images per category
- [ ] Images are real photos (not drawings/diagrams)
- [ ] Removed blurry/watermarked images
- [ ] Images are in correct category folders
- [ ] Ready to run: `python train_image_classifier.py --epochs 20`

---

**Remember**: Even 50 real images per category will perform MUCH better than 5000 synthetic images! 🎯

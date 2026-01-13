import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

export type AppCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'cleaning'
  | 'carpentry'
  | 'appliance'
  | 'painting'
  | 'landscaping'
  | 'security'
  | 'other';

// Mapping keywords to categories with weighted relevance
// MobileNet classes are often specific (e.g., 'espresso maker', 'toilet seat')
const CATEGORY_KEYWORDS: Record<AppCategory, string[]> = {
  plumbing: [
    'toilet',
    'bidet',
    'sink',
    'tub',
    'bathtub',
    'shower',
    'faucet',
    'spigot',
    'pipe',
    'drain',
    'plunger',
    'washbasin',
    'water jug',
    'water bottle',
  ],
  electrical: [
    'switch',
    'socket',
    'plug',
    'lamp',
    'lampshade',
    'light',
    'bulb',
    'chandelier',
    'heater',
    'fan',
    'electric',
    'vacuum',
    'iron',
    'toaster',
    'microwave',
  ],
  hvac: ['air conditioner', 'heater', 'radiator', 'stove', 'furnace', 'vent', 'cooler', 'fan'],
  appliance: [
    'refrigerator',
    'freezer',
    'ice box',
    'dishwasher',
    'washer',
    'washing machine',
    'dryer',
    'microwave',
    'stove',
    'oven',
    'toaster',
    'coffee pot',
    'espresso maker',
    'coffeepot',
    'television',
    'monitor',
    'screen',
    'laptop',
    'desktop',
    'computer',
    'printer',
  ],
  carpentry: [
    'door',
    'wardrobe',
    'cabinet',
    'shelf',
    'bookcase',
    'desk',
    'table',
    'chair',
    'seat',
    'sofa',
    'couch',
    'bed',
    'closet',
    'furniture',
    'fence',
    'lumber',
    'wooden',
  ],
  cleaning: [
    'trash',
    'waste',
    'garbage',
    'bin',
    'broom',
    'mop',
    'bucket',
    'soap',
    'towel',
    'sponge',
    'mess',
    'dirt',
    'dust',
  ],
  painting: [
    'wall',
    'paint',
    'brush', // Hard to detect 'painting' task from object, usually it's the object itself
  ],
  landscaping: ['lawn', 'mower', 'grass', 'tree', 'plant', 'flower', 'garden', 'shovel', 'rake'],
  security: ['lock', 'padlock', 'key', 'gate', 'camera'],
  other: [],
};

class AIClassifier {
  private model: mobilenet.MobileNet | null = null;
  private isLoading = false;
  private loadPromise: Promise<mobilenet.MobileNet> | null = null;

  async loadModel(): Promise<mobilenet.MobileNet> {
    if (this.model) return this.model;

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    console.log('Loading MobileNet model...');

    // Load the model
    // version 2, alpha 1.0 is a good balance of speed/accuracy for browser
    this.loadPromise = (async () => {
      try {
        // Ensure a backend is initialized
        if (!tf.getBackend()) {
          console.log('No backend detected, attempting to set WebGL...');
          try {
            await tf.setBackend('webgl');
          } catch (e) {
            console.warn('WebGL failed, falling back to CPU', e);
            await tf.setBackend('cpu');
          }
        }
        
        await tf.ready();
        const model = await mobilenet.load({
          version: 2,
          alpha: 1.0,
        });
        
        this.model = model;
        this.isLoading = false;
        console.log('MobileNet model loaded successfully');
        return model;
      } catch (err) {
        this.isLoading = false;
        this.loadPromise = null;
        console.error('Failed to load MobileNet model:', err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  async classifyImage(
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ category: AppCategory; confidence: number; label: string } | null> {
    try {
      const model = await this.loadModel();

      // Get top 3 predictions
      const predictions = await model.classify(imageElement, 3);
      console.log('AI Predictions:', predictions);

      if (!predictions || predictions.length === 0) {
        return null;
      }

      // Map predictions to our categories
      const bestMatch = this.findBestCategoryMatch(predictions);

      return bestMatch;
    } catch (error) {
      console.error('Error classifying image:', error);
      return null;
    }
  }

  async classifyFile(
    file: File
  ): Promise<{ category: AppCategory; confidence: number; label: string } | null> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          const result = await this.classifyImage(img);
          URL.revokeObjectURL(img.src);
          resolve(result);
        } catch (err) {
          URL.revokeObjectURL(img.src);
          reject(err);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(img.src);
        reject(err);
      };
    });
  }

  private findBestCategoryMatch(predictions: Array<{ className: string; probability: number }>): {
    category: AppCategory;
    confidence: number;
    label: string;
  } {
    // We'll iterate through predictions and see if any keywords match our categories

    for (const prediction of predictions) {
      const label = prediction.className.toLowerCase();

      // Check each category for keywords
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        // Fix: Cast category to AppCategory to respect types
        const appCategory = category as AppCategory;

        // Skip 'other' for keyword matching
        if (appCategory === 'other') continue;

        if (keywords.some((keyword) => label.includes(keyword))) {
          console.log(`Matched '${label}' to category '${appCategory}'`);
          return {
            category: appCategory,
            confidence: prediction.probability,
            label: prediction.className,
          };
        }
      }
    }

    // Default if no match found
    return {
      category: 'other',
      confidence: predictions[0].probability,
      label: predictions[0].className,
    };
  }
}

// Singleton instance
export const aiClassifier = new AIClassifier();

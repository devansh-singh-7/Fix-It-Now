// Dynamic imports for TensorFlow to avoid loading heavy dependencies on app start
// These will only be loaded when AI classification is actually used

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

// Type definition for MobileNet model
interface MobileNetModel {
  classify(
    img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    topk?: number
  ): Promise<Array<{ className: string; probability: number }>>;
  dispose?: () => void; // Optional dispose method
}

class AIClassifier {
  private model: MobileNetModel | null = null;
  private isLoading = false;
  private loadPromise: Promise<MobileNetModel> | null = null;
  private webglFailed = false; // Track if WebGL has failed before

  async loadModel(): Promise<MobileNetModel> {
    if (this.model) return this.model;

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    console.log('Loading MobileNet model...');

    // Load the model with dynamic imports
    this.loadPromise = (async () => {
      try {
        // Dynamically import TensorFlow only when needed
        const [tf, mobilenetModule] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/mobilenet'),
        ]);

        // Load CPU backend first (more stable)
        await import('@tensorflow/tfjs-backend-cpu');
        
        // Try to load WebGL backend but don't fail if it doesn't work
        try {
          await import('@tensorflow/tfjs-backend-webgl');
        } catch (e) {
          console.warn('WebGL backend not available, will use CPU', e);
          this.webglFailed = true;
        }

        // Initialize backend with proper error handling
        let backendInitialized = false;
        
        // Only try WebGL if it hasn't failed before
        if (!this.webglFailed) {
          try {
            await tf.setBackend('webgl');
            await tf.ready();
            backendInitialized = true;
            console.log('Using WebGL backend for AI classification');
          } catch (e) {
            console.warn('WebGL backend failed, trying CPU fallback', e);
            this.webglFailed = true;
          }
        }

        // Fallback to CPU if WebGL failed or was skipped
        if (!backendInitialized) {
          try {
            await tf.setBackend('cpu');
            await tf.ready();
            backendInitialized = true;
            console.log('Using CPU backend for AI classification');
          } catch (e) {
            console.error('CPU backend also failed', e);
            throw new Error('Failed to initialize TensorFlow backend');
          }
        }

        // Load MobileNet model
        const model = await mobilenetModule.load({
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

      // Get top 3 predictions with error handling
      let predictions;
      try {
        predictions = await model.classify(imageElement, 3);
      } catch (classifyError) {
        console.error('Classification error (WebGL shader issue detected):', classifyError);
        
        // Mark WebGL as failed for future loads
        this.webglFailed = true;
        
        // WebGL has failed - need to completely reload with CPU backend
        console.log('Disposing current model and reloading with CPU backend...');
        
        try {
          const tf = await import('@tensorflow/tfjs');
          const mobilenetModule = await import('@tensorflow-models/mobilenet');
          
          // Dispose of the problematic WebGL model
          if (this.model?.dispose) {
            this.model.dispose();
          }
          
          // Reset state
          this.model = null;
          this.loadPromise = null;
          this.isLoading = false;
          
          // Force CPU backend
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('Switched to CPU backend');
          
          // Reload model with CPU
          const newModel = await mobilenetModule.load({
            version: 2,
            alpha: 1.0,
          });
          
          this.model = newModel;
          console.log('Model reloaded successfully with CPU backend');
          
          // Retry classification with new CPU-based model
          predictions = await newModel.classify(imageElement, 3);
        } catch (retryError) {
          console.error('Failed to recover from WebGL error:', retryError);
          return null;
        }
      }
      
      console.log('AI Predictions:', predictions);

      if (!predictions || predictions.length === 0) {
        return null;
      }

      // Map predictions to our categories
      const bestMatch = this.findBestCategoryMatch(predictions);

      return bestMatch;
    } catch (error) {
      console.error('Error classifying image:', error);
      // Return null to allow the app to continue without AI classification
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

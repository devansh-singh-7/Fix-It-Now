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
// Expanded keywords for better detection accuracy
const CATEGORY_KEYWORDS: Record<AppCategory, string[]> = {
  plumbing: [
    'toilet', 'toilet seat', 'toilet tissue',
    'bidet',
    'sink', 'washbasin', 'basin',
    'tub', 'bathtub', 'hot tub',
    'shower', 'shower curtain', 'shower cap',
    'faucet', 'spigot', 'tap',
    'pipe', 'plunger', 'drain',
    'water jug', 'water bottle', 'water tower',
    'fountain', 'swimming pool', 'jacuzzi',
  ],
  electrical: [
    'switch', 'light switch',
    'socket', 'plug', 'power plug', 'outlet',
    'lamp', 'lampshade', 'table lamp', 'floor lamp',
    'light', 'light bulb', 'bulb', 'spotlight',
    'chandelier', 'candelabra',
    'heater', 'space heater', 'electric heater',
    'fan', 'ceiling fan', 'electric fan',
    'electric', 'power strip', 'extension cord',
    'vacuum', 'vacuum cleaner',
    'iron', 'steam iron', 'waffle iron',
    'toaster', 'microwave',
    'remote control', 'joystick',
    'wiring', 'circuit', 'fuse',
  ],
  hvac: [
    'air conditioner', 'ac unit',
    'heater', 'radiator', 'space heater',
    'stove', 'furnace', 'boiler',
    'vent', 'ventilator', 'air vent',
    'cooler', 'fan', 'blower',
    'thermostat', 'thermometer',
    'humidifier', 'dehumidifier',
  ],
  appliance: [
    'refrigerator', 'fridge', 'freezer', 'ice box',
    'dishwasher', 'washer', 'washing machine', 'dryer',
    'microwave', 'oven', 'stove', 'range',
    'toaster', 'coffee pot', 'espresso maker', 'coffeepot',
    'blender', 'mixer', 'food processor',
    'television', 'tv', 'monitor', 'screen', 'plasma',
    'laptop', 'desktop', 'computer', 'keyboard', 'mouse',
    'printer', 'scanner', 'copier',
    'water heater', 'garbage disposal',
    'rice cooker', 'slow cooker', 'pressure cooker',
    'air fryer', 'grill', 'barbecue',
  ],
  carpentry: [
    'door', 'sliding door', 'screen door', 'doormat',
    'window', 'window frame', 'window shade', 'blind',
    'wardrobe', 'cabinet', 'cupboard', 'drawer',
    'shelf', 'bookcase', 'bookshelf',
    'desk', 'table', 'dining table', 'coffee table',
    'chair', 'rocking chair', 'folding chair', 'seat', 'stool',
    'sofa', 'couch', 'loveseat', 'ottoman',
    'bed', 'bunk bed', 'crib', 'cradle',
    'closet', 'furniture', 'armoire',
    'fence', 'railing', 'banister',
    'lumber', 'wooden', 'plywood', 'hardwood',
    'floor', 'parquet', 'tile', 'laminate',
    'ceiling', 'beam', 'joist',
  ],
  cleaning: [
    'trash', 'waste', 'garbage', 'rubbish',
    'bin', 'trash can', 'waste basket', 'dumpster',
    'broom', 'mop', 'sweeper',
    'bucket', 'pail',
    'soap', 'detergent', 'cleaner',
    'towel', 'paper towel', 'napkin',
    'sponge', 'scrubber',
    'mess', 'dirt', 'dust', 'stain',
    'mold', 'mildew', 'fungus',
  ],
  painting: [
    'wall', 'wallpaper', 'mural',
    'paint', 'paint bucket', 'paint can',
    'brush', 'paintbrush', 'roller',
    'ladder', 'scaffold',
    'crack', 'peeling', 'chipped',
  ],
  landscaping: [
    'lawn', 'mower', 'lawn mower', 'grass',
    'tree', 'bush', 'shrub', 'hedge',
    'plant', 'flower', 'pot', 'flowerpot', 'planter',
    'garden', 'yard', 'patio', 'deck',
    'shovel', 'rake', 'hoe', 'trowel',
    'sprinkler', 'hose', 'watering can',
    'fence', 'gate', 'gazebo', 'pergola',
    'soil', 'mulch', 'compost',
  ],
  security: [
    'lock', 'padlock', 'deadbolt', 'latch',
    'key', 'keyhole', 'keypad',
    'gate', 'fence', 'barrier',
    'camera', 'security camera', 'cctv', 'webcam',
    'alarm', 'smoke detector', 'fire alarm',
    'safe', 'vault', 'strongbox',
    'intercom', 'doorbell', 'buzzer',
  ],
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

  /**
   * Classify multiple image files and return the best overall result
   * This aggregates results from all images and picks the best match
   */
  async classifyMultipleFiles(
    files: File[]
  ): Promise<{ 
    category: AppCategory; 
    confidence: number; 
    label: string;
    allResults: Array<{ category: AppCategory; confidence: number; label: string; fileIndex: number }>;
  } | null> {
    if (files.length === 0) return null;

    try {
      const results: Array<{ category: AppCategory; confidence: number; label: string; fileIndex: number }> = [];

      // Classify each file
      for (let i = 0; i < files.length; i++) {
        const result = await this.classifyFile(files[i]);
        if (result) {
          results.push({ ...result, fileIndex: i });
        }
      }

      if (results.length === 0) return null;

      // Find the best result (highest confidence that's not 'other')
      const nonOtherResults = results.filter(r => r.category !== 'other');
      const bestResult = nonOtherResults.length > 0
        ? nonOtherResults.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          )
        : results[0];

      console.log(`[AI Classifier] Analyzed ${files.length} images, best match: ${bestResult.label} (${bestResult.category})`);

      return {
        category: bestResult.category,
        confidence: bestResult.confidence,
        label: bestResult.label,
        allResults: results,
      };
    } catch (error) {
      console.error('Error classifying multiple files:', error);
      return null;
    }
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

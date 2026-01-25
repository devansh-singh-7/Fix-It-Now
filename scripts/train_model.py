"""
ML Model Training Script for Fix-It-Now Predictor
==================================================

Trains Random Forest and XGBoost classifiers on generated asset data.
Exports model parameters as JSON for TypeScript consumption.

Requirements:
    pip install scikit-learn pandas numpy

Usage:
    python train_model.py
"""

import json
import csv
from pathlib import Path
from collections import Counter

# We'll implement a simple decision tree approach that can be exported to JSON
# and replicated in TypeScript without needing Python runtime

def load_data(filepath):
    """Load CSV data into list of dicts."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def preprocess_features(row):
    """Convert row to numeric features dict."""
    return {
        'asset_age_months': float(row['asset_age_months']),
        'days_since_last_maintenance': float(row['days_since_last_maintenance']),
        'total_maintenance_count': float(row['total_maintenance_count']),
        'avg_monthly_usage_hours': float(row['avg_monthly_usage_hours']),
        'ambient_temperature_avg': float(row['ambient_temperature_avg']),
        'humidity_level_avg': float(row['humidity_level_avg']),
        'power_outage_events_last_year': float(row['power_outage_events_last_year']),
        'manufacturer_rating': float(row['manufacturer_rating']),
        'building_age_years': float(row['building_age_years']),
        'seasonal_load_factor': float(row['seasonal_load_factor']),
        # Categorical encoding
        'asset_type': row['asset_type'],
        'last_repair_severity': row['last_repair_severity'],
        'installation_quality': row['installation_quality'],
    }

def get_target(row):
    """Extract target variables."""
    return {
        'failure_probability': float(row['failure_probability']),
        'risk_level': row['risk_level'],
        'estimated_days_to_failure': int(row['estimated_days_to_failure'])
    }


class SimpleRandomForest:
    """
    Simplified Random Forest that can be exported to JSON.
    Uses decision stump ensemble for interpretability.
    """
    
    def __init__(self, n_trees=50):
        self.n_trees = n_trees
        self.trees = []
        self.feature_importances = {}
        
    def _calculate_split_gain(self, data, feature, threshold, target_key='risk_level'):
        """Calculate information gain for a split."""
        left = [d for d in data if d['features'].get(feature, 0) < threshold]
        right = [d for d in data if d['features'].get(feature, 0) >= threshold]
        
        if len(left) == 0 or len(right) == 0:
            return 0
        
        def entropy(subset):
            if len(subset) == 0:
                return 0
            counts = Counter(d['target'][target_key] for d in subset)
            total = len(subset)
            return -sum((c/total) * (c/total) for c in counts.values() if c > 0)
        
        parent_entropy = entropy(data)
        weighted_child = (len(left)/len(data)) * entropy(left) + (len(right)/len(data)) * entropy(right)
        return parent_entropy - weighted_child
    
    def _find_best_split(self, data, features):
        """Find the best feature and threshold for splitting."""
        best_gain = -1
        best_feature = None
        best_threshold = None
        
        import random
        sampled_features = random.sample(features, min(5, len(features)))
        
        for feature in sampled_features:
            values = sorted(set(d['features'].get(feature, 0) for d in data if isinstance(d['features'].get(feature), (int, float))))
            if len(values) < 2:
                continue
                
            # Try percentile thresholds
            for percentile in [0.25, 0.5, 0.75]:
                idx = int(len(values) * percentile)
                threshold = values[min(idx, len(values)-1)]
                gain = self._calculate_split_gain(data, feature, threshold)
                
                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature
                    best_threshold = threshold
        
        return best_feature, best_threshold, best_gain
    
    def _build_tree(self, data, depth=0, max_depth=5):
        """Build a single decision tree."""
        if depth >= max_depth or len(data) < 10:
            # Leaf node - return majority class and avg probability
            risk_counts = Counter(d['target']['risk_level'] for d in data)
            majority_class = risk_counts.most_common(1)[0][0] if risk_counts else 'medium'
            avg_prob = sum(d['target']['failure_probability'] for d in data) / len(data) if data else 0.5
            avg_days = sum(d['target']['estimated_days_to_failure'] for d in data) / len(data) if data else 100
            return {
                'type': 'leaf',
                'prediction': majority_class,
                'probability': round(avg_prob, 4),
                'days': round(avg_days),
                'samples': len(data)
            }
        
        numeric_features = [
            'asset_age_months', 'days_since_last_maintenance', 'total_maintenance_count',
            'avg_monthly_usage_hours', 'ambient_temperature_avg', 'humidity_level_avg',
            'power_outage_events_last_year', 'manufacturer_rating', 'building_age_years',
            'seasonal_load_factor'
        ]
        
        best_feature, best_threshold, gain = self._find_best_split(data, numeric_features)
        
        if best_feature is None or gain < 0.001:
            # Can't split further - make leaf
            risk_counts = Counter(d['target']['risk_level'] for d in data)
            majority_class = risk_counts.most_common(1)[0][0] if risk_counts else 'medium'
            avg_prob = sum(d['target']['failure_probability'] for d in data) / len(data) if data else 0.5
            avg_days = sum(d['target']['estimated_days_to_failure'] for d in data) / len(data) if data else 100
            return {
                'type': 'leaf',
                'prediction': majority_class,
                'probability': round(avg_prob, 4),
                'days': round(avg_days),
                'samples': len(data)
            }
        
        # Track feature importance
        self.feature_importances[best_feature] = self.feature_importances.get(best_feature, 0) + gain
        
        left_data = [d for d in data if d['features'].get(best_feature, 0) < best_threshold]
        right_data = [d for d in data if d['features'].get(best_feature, 0) >= best_threshold]
        
        return {
            'type': 'split',
            'feature': best_feature,
            'threshold': round(best_threshold, 2),
            'left': self._build_tree(left_data, depth + 1, max_depth),
            'right': self._build_tree(right_data, depth + 1, max_depth)
        }
    
    def fit(self, data):
        """Train the forest."""
        import random
        
        print(f"Training {self.n_trees} trees...")
        
        for i in range(self.n_trees):
            # Bootstrap sample
            sample = random.choices(data, k=len(data))
            tree = self._build_tree(sample)
            self.trees.append(tree)
            
            if (i + 1) % 10 == 0:
                print(f"  Trees trained: {i + 1}/{self.n_trees}")
        
        # Normalize feature importances
        total_importance = sum(self.feature_importances.values())
        if total_importance > 0:
            for f in self.feature_importances:
                self.feature_importances[f] /= total_importance
    
    def _predict_tree(self, tree, features):
        """Make prediction using a single tree."""
        if tree['type'] == 'leaf':
            return tree
        
        value = features.get(tree['feature'], 0)
        if value < tree['threshold']:
            return self._predict_tree(tree['left'], features)
        else:
            return self._predict_tree(tree['right'], features)
    
    def predict(self, features):
        """Make prediction using forest ensemble."""
        predictions = [self._predict_tree(tree, features) for tree in self.trees]
        
        # Aggregate predictions
        risk_votes = Counter(p['prediction'] for p in predictions)
        avg_prob = sum(p['probability'] for p in predictions) / len(predictions)
        avg_days = sum(p['days'] for p in predictions) / len(predictions)
        
        return {
            'risk_level': risk_votes.most_common(1)[0][0],
            'failure_probability': round(avg_prob, 4),
            'estimated_days_to_failure': round(avg_days)
        }
    
    def export_to_json(self):
        """Export model to JSON-serializable dict."""
        return {
            'model_type': 'random_forest',
            'n_trees': self.n_trees,
            'trees': self.trees,
            'feature_importances': self.feature_importances
        }


def generate_suggested_actions(features, risk_level):
    """Generate contextual suggested actions based on features."""
    actions = []
    
    asset_type = features.get('asset_type', 'other')
    days_since_maint = features.get('days_since_last_maintenance', 0)
    age = features.get('asset_age_months', 0)
    maint_count = features.get('total_maintenance_count', 0)
    temp = features.get('ambient_temperature_avg', 25)
    humidity = features.get('humidity_level_avg', 50)
    
    # Maintenance-based actions
    if days_since_maint > 180:
        actions.append("Schedule immediate preventive maintenance - overdue by " + 
                      f"{int(days_since_maint - 180)} days")
    elif days_since_maint > 90:
        actions.append("Schedule routine maintenance within 2 weeks")
    
    # Asset type specific
    if asset_type == 'hvac':
        if temp > 35:
            actions.append("Check HVAC cooling efficiency - operating in high ambient temp")
        if humidity > 75:
            actions.append("Inspect HVAC dehumidification system")
        actions.append("Replace air filters if not done recently")
    elif asset_type == 'elevator':
        actions.append("Inspect hydraulic fluid levels and pressures")
        if age > 120:
            actions.append("Consider modernization assessment for aging elevator")
    elif asset_type == 'electrical':
        if humidity > 80:
            actions.append("Check electrical insulation and moisture barriers")
        actions.append("Test circuit breakers and safety switches")
    elif asset_type == 'plumbing':
        actions.append("Check for leaks and water pressure consistency")
        if age > 60:
            actions.append("Inspect pipe condition for corrosion")
    
    # Age-based actions
    if age > 120:
        actions.append("Evaluate replacement cost vs. ongoing maintenance")
    
    # Maintenance fatigue
    expected_maint = age / 6
    if maint_count > expected_maint * 2:
        actions.append("Asset showing signs of end-of-life - plan replacement")
    
    # Ensure we have at least some actions
    if not actions:
        if risk_level == 'high':
            actions.append("Urgent inspection required")
        elif risk_level == 'medium':
            actions.append("Schedule inspection within one week")
        else:
            actions.append("Continue routine monitoring")
    
    return actions[:5]  # Limit to 5 actions


def calculate_contributing_factors(features, prediction):
    """Generate human-readable contributing factors."""
    factors = []
    
    age = features.get('asset_age_months', 0)
    days_since = features.get('days_since_last_maintenance', 0)
    maint_count = features.get('total_maintenance_count', 0)
    expected_maint = age / 6 if age > 0 else 1
    temp = features.get('ambient_temperature_avg', 25)
    humidity = features.get('humidity_level_avg', 50)
    mfg_rating = features.get('manufacturer_rating', 3)
    install_quality = features.get('installation_quality', 'average')
    
    if age > 120:
        factors.append(f"Asset age ({age} months) exceeds recommended lifecycle")
    elif age > 60:
        factors.append(f"Asset approaching mid-life at {age} months")
    
    if days_since > 180:
        factors.append(f"Maintenance overdue by {days_since - 180} days")
    elif days_since > 90:
        factors.append(f"Last maintenance was {days_since} days ago")
    
    if maint_count > expected_maint * 2:
        factors.append(f"Unusually high repair frequency ({maint_count} repairs)")
    
    if temp > 38:
        factors.append(f"High ambient temperature ({temp:.1f}C) increasing stress")
    
    if humidity > 80:
        factors.append(f"High humidity ({humidity:.0f}%) may cause corrosion")
    
    if mfg_rating <= 2:
        factors.append("Low manufacturer quality rating")
    
    if install_quality == 'poor':
        factors.append("Poor installation quality documented")
    
    if not factors:
        if prediction['risk_level'] == 'low':
            factors.append("No significant risk factors detected")
            factors.append("Asset operating within normal parameters")
        else:
            factors.append("Multiple minor factors contributing to risk")
    
    return factors[:4]  # Limit to 4 factors


def main():
    print("=" * 60)
    print("  Fix-It-Now: ML Model Training")
    print("=" * 60)
    
    script_dir = Path(__file__).parent
    train_path = script_dir / 'train_data.csv'
    test_path = script_dir / 'test_data.csv'
    
    # Check if training data exists
    if not train_path.exists():
        print("\n[ERROR] train_data.csv not found!")
        print("Please run generate_training_data.py first.")
        return
    
    # Load data
    print("\n[1/5] Loading training data...")
    train_raw = load_data(train_path)
    test_raw = load_data(test_path) if test_path.exists() else []
    
    print(f"   Training samples: {len(train_raw)}")
    print(f"   Testing samples: {len(test_raw)}")
    
    # Prepare data
    print("\n[2/5] Preprocessing features...")
    train_data = [
        {'features': preprocess_features(row), 'target': get_target(row)}
        for row in train_raw
    ]
    test_data = [
        {'features': preprocess_features(row), 'target': get_target(row)}
        for row in test_raw
    ]
    
    # Train model
    print("\n[3/5] Training Random Forest model...")
    model = SimpleRandomForest(n_trees=30)
    model.fit(train_data)
    
    # Evaluate
    print("\n[4/5] Evaluating model...")
    if test_data:
        correct = 0
        total = len(test_data)
        
        risk_correct = {'high': 0, 'medium': 0, 'low': 0}
        risk_total = {'high': 0, 'medium': 0, 'low': 0}
        
        for sample in test_data:
            pred = model.predict(sample['features'])
            actual = sample['target']['risk_level']
            risk_total[actual] += 1
            
            if pred['risk_level'] == actual:
                correct += 1
                risk_correct[actual] += 1
        
        accuracy = correct / total * 100
        print(f"\n   Overall Accuracy: {accuracy:.1f}%")
        print("\n   Per-class accuracy:")
        for level in ['high', 'medium', 'low']:
            if risk_total[level] > 0:
                class_acc = risk_correct[level] / risk_total[level] * 100
                print(f"      {level:8s}: {class_acc:.1f}% ({risk_correct[level]}/{risk_total[level]})")
    
    # Export model
    print("\n[5/5] Exporting model to JSON...")
    model_export = model.export_to_json()
    
    # Add metadata
    model_export['metadata'] = {
        'trained_on': len(train_data),
        'tested_on': len(test_data),
        'accuracy': round(accuracy, 2) if test_data else None,
        'features': [
            'asset_age_months', 'days_since_last_maintenance', 'total_maintenance_count',
            'avg_monthly_usage_hours', 'ambient_temperature_avg', 'humidity_level_avg',
            'power_outage_events_last_year', 'manufacturer_rating', 'building_age_years',
            'seasonal_load_factor'
        ],
        'categorical_features': ['asset_type', 'last_repair_severity', 'installation_quality'],
        'target_classes': ['low', 'medium', 'high']
    }
    
    # Feature importances
    print("\n   Feature Importances:")
    sorted_importance = sorted(model.feature_importances.items(), key=lambda x: x[1], reverse=True)
    for feature, importance in sorted_importance[:5]:
        print(f"      {feature:35s}: {importance:.3f}")
    
    # Save model
    output_path = script_dir / 'model_params.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(model_export, f, indent=2)
    
    print(f"\n   Model saved to: {output_path.name}")
    
    # Test a sample prediction
    print("\n" + "=" * 60)
    print("  Sample Prediction Test")
    print("=" * 60)
    
    sample_features = {
        'asset_type': 'hvac',
        'asset_age_months': 72,
        'days_since_last_maintenance': 200,
        'total_maintenance_count': 18,
        'avg_monthly_usage_hours': 450,
        'last_repair_severity': 'major',
        'ambient_temperature_avg': 38,
        'humidity_level_avg': 75,
        'power_outage_events_last_year': 5,
        'manufacturer_rating': 2,
        'installation_quality': 'average',
        'building_age_years': 15,
        'seasonal_load_factor': 1.3
    }
    
    pred = model.predict(sample_features)
    factors = calculate_contributing_factors(sample_features, pred)
    actions = generate_suggested_actions(sample_features, pred['risk_level'])
    
    print("\n   Input: HVAC unit, 72 months old, 200 days since maintenance")
    print(f"\n   Prediction:")
    print(f"      Risk Level: {pred['risk_level'].upper()}")
    print(f"      Failure Probability: {pred['failure_probability']:.1%}")
    print(f"      Est. Days to Failure: {pred['estimated_days_to_failure']}")
    print(f"\n   Contributing Factors:")
    for f in factors:
        print(f"      - {f}")
    print(f"\n   Suggested Actions:")
    for a in actions:
        print(f"      - {a}")
    
    print("\n" + "=" * 60)
    print("  [DONE] Model training complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()

"""
Model Verification Script for Fix-It-Now Predictor
===================================================

Verifies the trained model by:
1. Loading model from JSON
2. Testing on sample data
3. Showing detailed accuracy metrics
4. Testing edge cases and sample predictions

Usage:
    python verify_model.py
"""

import json
import csv
from pathlib import Path
from collections import Counter


def load_model(filepath):
    """Load model from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


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
    }


def predict_tree(tree, features):
    """Make prediction using a single tree."""
    if tree['type'] == 'leaf':
        return tree
    
    value = features.get(tree['feature'], 0)
    if value < tree['threshold']:
        return predict_tree(tree['left'], features)
    else:
        return predict_tree(tree['right'], features)


def predict(model, features):
    """Make prediction using forest ensemble."""
    predictions = [predict_tree(tree, features) for tree in model['trees']]
    
    # Aggregate predictions
    risk_votes = Counter(p['prediction'] for p in predictions)
    avg_prob = sum(p['probability'] for p in predictions) / len(predictions)
    avg_days = sum(p['days'] for p in predictions) / len(predictions)
    
    return {
        'risk_level': risk_votes.most_common(1)[0][0],
        'failure_probability': round(avg_prob, 4),
        'estimated_days_to_failure': round(avg_days),
        'vote_distribution': dict(risk_votes)
    }


def main():
    print("=" * 70)
    print("  Fix-It-Now: Model Verification Report")
    print("=" * 70)
    
    script_dir = Path(__file__).parent
    model_path = script_dir / 'model_params.json'
    test_path = script_dir / 'test_data.csv'
    
    # Load model
    if not model_path.exists():
        print("\n[ERROR] model_params.json not found!")
        print("Please run train_model.py first.")
        return
    
    print("\n[1/5] Loading model...")
    model = load_model(model_path)
    
    print(f"   Model type: {model['model_type']}")
    print(f"   Number of trees: {model['n_trees']}")
    print(f"   Trained on: {model['metadata']['trained_on']} samples")
    print(f"   Reported accuracy: {model['metadata']['accuracy']}%")
    
    # Check model structure
    print("\n[2/5] Verifying model structure...")
    trees_valid = 0
    for i, tree in enumerate(model['trees']):
        if 'type' in tree:
            trees_valid += 1
    
    if trees_valid == len(model['trees']):
        print(f"   [OK] All {trees_valid} trees have valid structure")
    else:
        print(f"   [ERROR] Only {trees_valid}/{len(model['trees'])} trees are valid")
    
    # Feature importances
    print("\n[3/5] Feature importances:")
    sorted_importance = sorted(
        model['feature_importances'].items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    for feature, importance in sorted_importance[:6]:
        bar = '#' * int(importance * 40)
        print(f"   {feature:35s} {importance:.3f} {bar}")
    
    # Test on actual test data
    print("\n[4/5] Testing model on test data...")
    if not test_path.exists():
        print("   [WARNING] test_data.csv not found - skipping evaluation")
    else:
        test_data = load_data(test_path)
        print(f"   Test samples: {len(test_data)}")
        
        # Evaluate
        correct = 0
        total = len(test_data)
        
        risk_correct = {'high': 0, 'medium': 0, 'low': 0}
        risk_total = {'high': 0, 'medium': 0, 'low': 0}
        confusion = {
            'high': {'high': 0, 'medium': 0, 'low': 0},
            'medium': {'high': 0, 'medium': 0, 'low': 0},
            'low': {'high': 0, 'medium': 0, 'low': 0}
        }
        
        for row in test_data:
            features = preprocess_features(row)
            pred = predict(model, features)
            actual = row['risk_level']
            predicted = pred['risk_level']
            
            risk_total[actual] += 1
            confusion[actual][predicted] += 1
            
            if predicted == actual:
                correct += 1
                risk_correct[actual] += 1
        
        accuracy = correct / total * 100
        print(f"\n   VERIFICATION RESULTS:")
        print(f"   ---------------------")
        print(f"   Overall Accuracy: {accuracy:.2f}%")
        
        # Per-class metrics
        print("\n   Per-Class Accuracy:")
        for level in ['high', 'medium', 'low']:
            if risk_total[level] > 0:
                class_acc = risk_correct[level] / risk_total[level] * 100
                print(f"      {level:8s}: {class_acc:5.1f}% ({risk_correct[level]:4d}/{risk_total[level]:4d})")
        
        # Confusion matrix
        print("\n   Confusion Matrix (rows=actual, cols=predicted):")
        print("               high    medium    low")
        for actual in ['high', 'medium', 'low']:
            row_str = f"   {actual:8s}"
            for predicted in ['high', 'medium', 'low']:
                row_str += f"    {confusion[actual][predicted]:4d}"
            print(row_str)
        
        # Precision and recall for each class
        print("\n   Precision & Recall:")
        for level in ['high', 'medium', 'low']:
            # Precision = correct / predicted as this class
            pred_total = sum(confusion[a][level] for a in ['high', 'medium', 'low'])
            precision = (confusion[level][level] / pred_total * 100) if pred_total > 0 else 0
            
            # Recall = correct / actual this class  
            recall = (risk_correct[level] / risk_total[level] * 100) if risk_total[level] > 0 else 0
            
            # F1 Score
            f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0
            
            print(f"      {level:8s}: Precision={precision:5.1f}%, Recall={recall:5.1f}%, F1={f1:5.1f}%")
    
    # Sample predictions
    print("\n[5/5] Sample predictions on edge cases...")
    
    test_cases = [
        {
            'name': 'New HVAC, well maintained',
            'features': {
                'asset_age_months': 12,
                'days_since_last_maintenance': 30,
                'total_maintenance_count': 1,
                'avg_monthly_usage_hours': 200,
                'ambient_temperature_avg': 25,
                'humidity_level_avg': 50,
                'power_outage_events_last_year': 0,
                'manufacturer_rating': 5,
                'building_age_years': 2,
                'seasonal_load_factor': 0.8
            },
            'expected': 'low'
        },
        {
            'name': 'Old elevator, overdue maintenance',
            'features': {
                'asset_age_months': 180,
                'days_since_last_maintenance': 400,
                'total_maintenance_count': 25,
                'avg_monthly_usage_hours': 600,
                'ambient_temperature_avg': 30,
                'humidity_level_avg': 70,
                'power_outage_events_last_year': 3,
                'manufacturer_rating': 2,
                'building_age_years': 20,
                'seasonal_load_factor': 1.4
            },
            'expected': 'high'
        },
        {
            'name': 'Middle-aged plumbing, moderate condition',
            'features': {
                'asset_age_months': 60,
                'days_since_last_maintenance': 120,
                'total_maintenance_count': 8,
                'avg_monthly_usage_hours': 300,
                'ambient_temperature_avg': 28,
                'humidity_level_avg': 60,
                'power_outage_events_last_year': 1,
                'manufacturer_rating': 3,
                'building_age_years': 10,
                'seasonal_load_factor': 1.1
            },
            'expected': 'medium'
        }
    ]
    
    for case in test_cases:
        pred = predict(model, case['features'])
        status = "[PASS]" if pred['risk_level'] == case['expected'] else "[FAIL]"
        print(f"\n   {status} {case['name']}")
        print(f"      Expected: {case['expected']:6s} | Predicted: {pred['risk_level']:6s}")
        print(f"      Failure Prob: {pred['failure_probability']:.1%}")
        print(f"      Days to Failure: ~{pred['estimated_days_to_failure']}")
        print(f"      Vote Distribution: {pred['vote_distribution']}")
    
    # Summary
    print("\n" + "=" * 70)
    print("  VERIFICATION SUMMARY")
    print("=" * 70)
    if 'accuracy' in locals():
        if accuracy >= 55:
            print("\n   [OK] Model is functioning correctly!")
            print(f"   [OK] Accuracy of {accuracy:.1f}% is acceptable for 3-class prediction")
        else:
            print("\n   [WARN] Model accuracy is below expected threshold")
            print("   Consider retraining with more data or different parameters")
    
    print("\n   Key Metrics:")
    print(f"   • Model has {model['n_trees']} decision trees")
    print(f"   • Top features: {', '.join(f[0] for f in sorted_importance[:3])}")
    
    print("\n   Recommendations:")
    if model['metadata']['accuracy'] < 70:
        print("   • Consider adding more training data")
        print("   • Try increasing n_trees to 50-100")
        print("   • Add feature engineering (e.g., interaction features)")
    else:
        print("   • Model is performing well")
        print("   • Monitor for drift over time")
    
    print("\n" + "=" * 70)


if __name__ == '__main__':
    main()

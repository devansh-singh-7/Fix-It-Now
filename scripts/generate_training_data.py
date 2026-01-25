"""
Prediction Training Data Generator for Fix-It-Now
==================================================

Generates realistic CSV training/testing data for the AI Failure Predictor module.
Uses non-linear formulas, asset-specific patterns, and maintenance fatigue logic.

Author: Auto-generated for Fix-It-Now
Date: 2026-01-24
"""

import csv
import math
import random
from datetime import datetime
from pathlib import Path
from typing import Tuple

# Configuration
TOTAL_SAMPLES = 10000
TRAIN_RATIO = 0.8
RANDOM_SEED = 42

# Asset type base risk (some assets are inherently riskier)
ASSET_BASE_RISK = {
    'hvac': 0.15,
    'electrical': 0.10,
    'plumbing': 0.12,
    'elevator': 0.18,
    'security': 0.08,
    'appliance': 0.14
}

# Installation quality multipliers (not additive!)
INSTALLATION_QUALITY_MULTIPLIER = {
    'poor': 1.6,
    'average': 1.0,
    'good': 0.75,
    'excellent': 0.5
}

# Severity impact on future failures
LAST_REPAIR_SEVERITY_FACTOR = {
    'none': 0.0,
    'minor': 0.05,
    'moderate': 0.15,
    'major': 0.30
}


def generate_base_features() -> dict:
    """Generate raw feature values with realistic distributions."""
    
    asset_type = random.choice(list(ASSET_BASE_RISK.keys()))
    
    # Asset age: newer assets more common, use gamma distribution
    asset_age_months = int(random.gammavariate(3, 20))
    asset_age_months = max(6, min(240, asset_age_months))  # Clamp to 6-240 months
    
    # Days since maintenance: often recent, sometimes neglected
    if random.random() < 0.7:
        days_since_maintenance = int(random.expovariate(1/60))  # Usually recent
    else:
        days_since_maintenance = int(random.uniform(180, 730))  # Neglected
    days_since_maintenance = max(0, min(730, days_since_maintenance))
    
    # Total maintenance count - correlate loosely with age
    expected_maintenance = asset_age_months / 6  # ~every 6 months
    maintenance_variance = random.gauss(0, expected_maintenance * 0.3)
    total_maintenance_count = int(max(0, expected_maintenance + maintenance_variance))
    total_maintenance_count = min(50, total_maintenance_count)
    
    # Usage hours - asset-type dependent
    if asset_type == 'hvac':
        avg_monthly_usage = random.gauss(400, 100)  # High usage
    elif asset_type == 'elevator':
        avg_monthly_usage = random.gauss(500, 150)  # Very high
    elif asset_type == 'security':
        avg_monthly_usage = 720  # 24/7 operation
    else:
        avg_monthly_usage = random.gauss(200, 80)
    avg_monthly_usage = max(0, min(744, avg_monthly_usage))
    
    # Repair severity - more likely to have major if old and heavily used
    severity_weights = [0.4, 0.35, 0.18, 0.07]  # none, minor, moderate, major
    if asset_age_months > 60:
        severity_weights = [0.25, 0.30, 0.28, 0.17]
    if asset_age_months > 120:
        severity_weights = [0.15, 0.25, 0.35, 0.25]
    last_repair_severity = random.choices(
        ['none', 'minor', 'moderate', 'major'],
        weights=severity_weights
    )[0]
    
    # Environmental factors
    ambient_temp = random.gauss(28, 8)  # Indian climate avg
    ambient_temp = max(15, min(45, ambient_temp))
    
    humidity = random.gauss(55, 18)
    humidity = max(20, min(90, humidity))
    
    # Power outages - somewhat random with occasional spikes
    if random.random() < 0.15:
        power_outages = int(random.uniform(8, 20))  # Bad power area
    else:
        power_outages = int(random.expovariate(0.5))
    power_outages = max(0, min(20, power_outages))
    
    # Manufacturer quality - biased toward average/good
    manufacturer_rating = random.choices(
        [1, 2, 3, 4, 5],
        weights=[0.05, 0.15, 0.35, 0.30, 0.15]
    )[0]
    
    # Installation quality - correlate with manufacturer rating slightly
    install_weights = [0.15, 0.35, 0.35, 0.15]
    if manufacturer_rating >= 4:
        install_weights = [0.08, 0.22, 0.40, 0.30]
    installation_quality = random.choices(
        ['poor', 'average', 'good', 'excellent'],
        weights=install_weights
    )[0]
    
    # Building age - older buildings have older assets
    building_age_years = int(random.gauss(max(1, asset_age_months // 18), 8))
    building_age_years = max(1, min(50, building_age_years))
    
    # Seasonal load factor
    month = random.randint(1, 12)
    if month in [4, 5, 6, 7, 8]:  # Summer in India - high HVAC load
        base_seasonal = 1.3
    elif month in [11, 12, 1, 2]:  # Winter
        base_seasonal = 0.9
    else:
        base_seasonal = 1.0
    seasonal_load = base_seasonal + random.gauss(0, 0.15)
    seasonal_load = max(0.5, min(1.5, seasonal_load))
    
    return {
        'asset_type': asset_type,
        'asset_age_months': asset_age_months,
        'days_since_last_maintenance': days_since_maintenance,
        'total_maintenance_count': total_maintenance_count,
        'avg_monthly_usage_hours': round(avg_monthly_usage, 1),
        'last_repair_severity': last_repair_severity,
        'ambient_temperature_avg': round(ambient_temp, 1),
        'humidity_level_avg': round(humidity, 1),
        'power_outage_events_last_year': power_outages,
        'manufacturer_rating': manufacturer_rating,
        'installation_quality': installation_quality,
        'building_age_years': building_age_years,
        'seasonal_load_factor': round(seasonal_load, 2)
    }


def calculate_failure_probability(features: dict) -> float:
    """
    Calculate failure probability using non-linear formulas.
    
    This is the CORE of realistic data generation:
    - Base risk by asset type (not all assets are equal)
    - Age contributes non-linearly (exponential after thresholds)
    - Maintenance neglect contributes via log-scaling
    - Installation quality is a MULTIPLIER, not additive
    - Maintenance fatigue: too many repairs = dying asset
    """
    
    # 1. Start with asset-type base risk
    base_risk = ASSET_BASE_RISK[features['asset_type']]
    
    # 2. Age factor - exponential bump after thresholds
    age = features['asset_age_months']
    if age <= 24:
        age_factor = 0.0
    elif age <= 60:
        age_factor = 0.05 * ((age - 24) / 36)  # Linear 0-0.05
    elif age <= 120:
        age_factor = 0.05 + 0.15 * ((age - 60) / 60) ** 1.5  # Non-linear
    else:
        # Old assets: exponential risk increase
        age_factor = 0.20 + 0.25 * (1 - math.exp(-(age - 120) / 60))
    
    # 3. Maintenance neglect - log-scaled, not linear
    days_since = features['days_since_last_maintenance']
    if days_since <= 30:
        neglect_factor = 0.0
    elif days_since <= 90:
        neglect_factor = 0.02
    else:
        # Log scaling for severe neglect
        neglect_factor = 0.05 + 0.20 * math.log1p((days_since - 90) / 100)
    neglect_factor = min(0.35, neglect_factor)
    
    # 4. Maintenance fatigue - KEY INSIGHT from user feedback!
    # Too many repairs on young asset = bad sign
    # Too few repairs on old asset = also bad
    maintenance_count = features['total_maintenance_count']
    expected_maintenance = age / 6  # Expect ~1 every 6 months
    
    if age > 12:  # Only apply to assets with history
        maintenance_ratio = maintenance_count / max(1, expected_maintenance)
        
        if maintenance_ratio > 2.0:
            # Way too many repairs - this asset is dying!
            fatigue_factor = 0.15 + 0.10 * min(1.0, (maintenance_ratio - 2.0))
        elif maintenance_ratio < 0.3:
            # Suspiciously few repairs for age - hidden problems
            fatigue_factor = 0.08
        else:
            fatigue_factor = 0.0
    else:
        fatigue_factor = 0.0
    
    # 5. Last repair severity contributes to near-term risk
    severity_factor = LAST_REPAIR_SEVERITY_FACTOR[features['last_repair_severity']]
    
    # 6. Environmental stress (asset-type specific)
    env_factor = 0.0
    temp = features['ambient_temperature_avg']
    humidity = features['humidity_level_avg']
    
    if features['asset_type'] == 'hvac':
        # HVAC suffers in extreme heat and humidity
        if temp > 38:
            env_factor += 0.08
        if humidity > 75:
            env_factor += 0.05
    elif features['asset_type'] == 'electrical':
        # Electrical suffers from humidity and power outages
        if humidity > 80:
            env_factor += 0.06
        outages = features['power_outage_events_last_year']
        if outages > 5:
            env_factor += 0.04 * min(1.0, (outages - 5) / 10)
    elif features['asset_type'] == 'elevator':
        # Elevators suffer from high usage
        usage = features['avg_monthly_usage_hours']
        if usage > 500:
            env_factor += 0.06
    
    # 7. Manufacturer quality as inverse factor
    mfg_rating = features['manufacturer_rating']
    quality_factor = (5 - mfg_rating) * 0.03  # 1-star = +0.12, 5-star = 0
    
    # 8. Sum risk components
    linear_risk = (
        base_risk +
        age_factor +
        neglect_factor +
        fatigue_factor +
        severity_factor +
        env_factor +
        quality_factor
    )
    
    # 9. Apply installation quality as MULTIPLIER
    install_multiplier = INSTALLATION_QUALITY_MULTIPLIER[features['installation_quality']]
    raw_probability = linear_risk * install_multiplier
    
    # 10. Apply seasonal load
    raw_probability *= features['seasonal_load_factor']
    
    # 11. Add realistic noise (5-10% variance)
    noise = random.gauss(0, 0.05)
    raw_probability += noise
    
    # 12. Sigmoid squish to keep in [0, 1] range naturally
    # This prevents unrealistic 0.99 or -0.1 values
    probability = 1 / (1 + math.exp(-6 * (raw_probability - 0.4)))
    
    return round(probability, 4)


def derive_risk_level(probability: float) -> str:
    """Derive risk level from probability with some fuzzy boundaries."""
    
    # Add small noise to boundaries for realism
    low_threshold = 0.30 + random.gauss(0, 0.03)
    high_threshold = 0.65 + random.gauss(0, 0.03)
    
    if probability < low_threshold:
        return 'low'
    elif probability < high_threshold:
        return 'medium'
    else:
        return 'high'


def calculate_days_to_failure(probability: float, risk_level: str) -> int:
    """
    Calculate estimated days to failure.
    
    CRITICAL: Must correlate with probability to avoid synthetic data tells!
    High probability = near-term failure window
    Low probability = distant/uncertain failure window
    """
    
    if risk_level == 'high':
        # High risk: 7-60 days, skewed toward soon
        base_days = 7 + int(random.expovariate(1/20))
        max_days = 60
    elif risk_level == 'medium':
        # Medium risk: 30-180 days
        base_days = 30 + int(random.gauss(60, 30))
        max_days = 180
    else:
        # Low risk: 120-365+ days
        base_days = 120 + int(random.gauss(120, 50))
        max_days = 500  # Can go beyond 365 for very healthy assets
    
    # Fine-tune based on actual probability within the bucket
    # Higher probability within bucket = fewer days
    if risk_level == 'high':
        probability_factor = 1.0 - (probability - 0.65) / 0.35  # 0.65-1.0 → 1.0-0.0
        probability_factor = max(0.3, min(1.0, probability_factor))
        base_days = int(base_days * probability_factor)
    elif risk_level == 'medium':
        probability_factor = 1.0 - (probability - 0.30) / 0.35
        probability_factor = max(0.5, min(1.2, probability_factor))
        base_days = int(base_days * probability_factor)
    
    # Add final noise
    noise = int(random.gauss(0, base_days * 0.15))
    final_days = base_days + noise
    
    # Clamp to reasonable ranges per risk level
    if risk_level == 'high':
        final_days = max(7, min(max_days, final_days))
    elif risk_level == 'medium':
        final_days = max(30, min(max_days, final_days))
    else:
        final_days = max(90, min(max_days, final_days))
    
    return final_days


def generate_sample() -> dict:
    """Generate a single complete data sample."""
    
    features = generate_base_features()
    probability = calculate_failure_probability(features)
    risk_level = derive_risk_level(probability)
    days_to_failure = calculate_days_to_failure(probability, risk_level)
    
    return {
        **features,
        'failure_probability': probability,
        'risk_level': risk_level,
        'estimated_days_to_failure': days_to_failure
    }


def write_csv(filename: str, data: list, headers: list):
    """Write data to CSV file."""
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)


def print_distribution_stats(data: list):
    """Print statistics about the generated data."""
    
    total = len(data)
    
    # Risk level distribution
    risk_counts = {'low': 0, 'medium': 0, 'high': 0}
    for row in data:
        risk_counts[row['risk_level']] += 1
    
    print("\n[STATS] Risk Level Distribution:")
    for level, count in risk_counts.items():
        pct = count / total * 100
        bar = '#' * int(pct / 2)
        print(f"   {level:8s}: {count:5d} ({pct:5.1f}%) {bar}")
    
    # Asset type distribution
    asset_counts = {}
    for row in data:
        asset_type = row['asset_type']
        asset_counts[asset_type] = asset_counts.get(asset_type, 0) + 1
    
    print("\n[ASSETS] Asset Type Distribution:")
    for asset, count in sorted(asset_counts.items()):
        pct = count / total * 100
        print(f"   {asset:12s}: {count:5d} ({pct:5.1f}%)")
    
    # Probability stats
    probabilities = [row['failure_probability'] for row in data]
    avg_prob = sum(probabilities) / len(probabilities)
    min_prob = min(probabilities)
    max_prob = max(probabilities)
    
    print(f"\n[PROBS] Failure Probability Stats:")
    print(f"   Min: {min_prob:.4f}, Max: {max_prob:.4f}, Avg: {avg_prob:.4f}")
    
    # Days to failure by risk level
    print("\n[TIME] Days to Failure by Risk Level:")
    for level in ['low', 'medium', 'high']:
        days = [row['estimated_days_to_failure'] for row in data if row['risk_level'] == level]
        if days:
            avg_days = sum(days) / len(days)
            min_days = min(days)
            max_days = max(days)
            print(f"   {level:8s}: min={min_days:3d}, max={max_days:3d}, avg={avg_days:.0f}")


def main():
    """Main function to generate training and testing data."""
    
    print("=" * 60)
    print("  Fix-It-Now: Prediction Training Data Generator")
    print("=" * 60)
    print(f"\n[SEED] Random seed: {RANDOM_SEED}")
    print(f"[GEN] Generating {TOTAL_SAMPLES:,} samples...")
    
    random.seed(RANDOM_SEED)
    
    # Generate all samples
    all_data = [generate_sample() for _ in range(TOTAL_SAMPLES)]
    
    # Shuffle and split
    random.shuffle(all_data)
    split_idx = int(len(all_data) * TRAIN_RATIO)
    train_data = all_data[:split_idx]
    test_data = all_data[split_idx:]
    
    # Define column order
    headers = [
        'asset_type',
        'asset_age_months',
        'days_since_last_maintenance',
        'total_maintenance_count',
        'avg_monthly_usage_hours',
        'last_repair_severity',
        'ambient_temperature_avg',
        'humidity_level_avg',
        'power_outage_events_last_year',
        'manufacturer_rating',
        'installation_quality',
        'building_age_years',
        'seasonal_load_factor',
        'failure_probability',
        'risk_level',
        'estimated_days_to_failure'
    ]
    
    # Output paths
    script_dir = Path(__file__).parent
    train_file = script_dir / 'train_data.csv'
    test_file = script_dir / 'test_data.csv'
    
    # Write files
    write_csv(str(train_file), train_data, headers)
    write_csv(str(test_file), test_data, headers)
    
    print(f"\n[OK] Generated files:")
    print(f"   - {train_file.name}: {len(train_data):,} rows (training)")
    print(f"   - {test_file.name}: {len(test_data):,} rows (testing)")
    
    # Print statistics for training data
    print("\n" + "=" * 60)
    print("  Training Data Statistics")
    print("=" * 60)
    print_distribution_stats(train_data)
    
    print("\n" + "=" * 60)
    print("  [DONE] Data generation complete!")
    print("=" * 60)
    
    # Print suggestions
    print("\n[TIPS] Training Suggestions:")
    print("   1. Random Forest / XGBoost work best for this mixed-type data")
    print("   2. Consider one-hot encoding for categorical features")
    print("   3. Key interaction: asset_age_months x days_since_last_maintenance")
    print("   4. Target 'failure_probability' for regression, 'risk_level' for classification")
    print("   5. Use stratified split for risk_level if training classifier")


if __name__ == '__main__':
    main()

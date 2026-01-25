"""Quick verification script for generated CSV data."""
import csv

def verify_data():
    with open('train_data.csv', 'r') as f:
        r = list(csv.DictReader(f))
    
    print("=" * 70)
    print("  VERIFICATION: Checking data quality and correlations")
    print("=" * 70)
    
    # Sample high-risk records
    high_risk = [x for x in r if x['risk_level'] == 'high'][:5]
    print("\nHIGH-RISK samples (should have high prob, low days):")
    for x in high_risk:
        print(f"  prob={x['failure_probability']:>6}, days={x['estimated_days_to_failure']:>3}, "
              f"age={x['asset_age_months']:>3}mo, maint_days={x['days_since_last_maintenance']:>3}, "
              f"maint_count={x['total_maintenance_count']:>2}, type={x['asset_type']}")
    
    # Sample low-risk records
    low_risk = [x for x in r if x['risk_level'] == 'low'][:5]
    print("\nLOW-RISK samples (should have low prob, high days):")
    for x in low_risk:
        print(f"  prob={x['failure_probability']:>6}, days={x['estimated_days_to_failure']:>3}, "
              f"age={x['asset_age_months']:>3}mo, maint_days={x['days_since_last_maintenance']:>3}, "
              f"maint_count={x['total_maintenance_count']:>2}, type={x['asset_type']}")
    
    # Check for maintenance fatigue examples (high maintenance count = high risk)
    fatigue_examples = [x for x in r if int(x['total_maintenance_count']) > 15 and x['risk_level'] == 'high'][:3]
    if fatigue_examples:
        print("\nMAINTENANCE FATIGUE examples (high maint count + high risk):")
        for x in fatigue_examples:
            print(f"  prob={x['failure_probability']:>6}, maint_count={x['total_maintenance_count']:>2}, "
                  f"age={x['asset_age_months']:>3}mo, type={x['asset_type']}")
    
    # Verify no contradictions: high prob + high days
    contradictions = [x for x in r 
                      if float(x['failure_probability']) > 0.8 
                      and int(x['estimated_days_to_failure']) > 100]
    print(f"\nContradiction check (high prob > 0.8 but days > 100): {len(contradictions)} found")
    
    # Verify no contradictions: low prob + low days
    contradictions2 = [x for x in r 
                       if float(x['failure_probability']) < 0.2 
                       and int(x['estimated_days_to_failure']) < 30]
    print(f"Contradiction check (low prob < 0.2 but days < 30): {len(contradictions2)} found")
    
    print("\n" + "=" * 70)
    print("  VERIFICATION COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    verify_data()

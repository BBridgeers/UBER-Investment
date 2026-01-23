#!/usr/bin/env python3
"""
Detailed investigation of calculation discrepancies
"""

import requests
import json

BACKEND_URL = "https://transpindependent.preview.emergentagent.com/api"

def investigate_calculations():
    print("=" * 80)
    print("DETAILED CALCULATION INVESTIGATION")
    print("=" * 80)
    
    # Get baseline calculation
    response = requests.get(f"{BACKEND_URL}/calculate-engine?hourly_rate=23&use_baseline=true")
    if response.status_code != 200:
        print(f"❌ Failed to get calculation: {response.status_code}")
        return
    
    data = response.json()
    assumptions = data.get("assumptions", {})
    weekly_data = data.get("weekly", [])
    
    print("BASELINE ASSUMPTIONS:")
    print("-" * 40)
    for key, value in assumptions.items():
        print(f"{key}: {value}")
    print()
    
    if len(weekly_data) >= 26:
        print("WEEKLY CALCULATION ANALYSIS:")
        print("-" * 40)
        
        # Analyze Week 1
        week_1 = weekly_data[0]
        print(f"Week 1:")
        print(f"  Uber Gross: ${week_1.get('uber_gross', 0):.2f}")
        print(f"  Tips: ${week_1.get('tips', 0):.2f}")
        print(f"  Total Gross: ${week_1.get('total_gross', 0):.2f}")
        print(f"  Rental: ${week_1.get('rental', 0):.2f}")
        print(f"  Charging: ${week_1.get('charging', 0):.2f}")
        print(f"  Buffer: ${week_1.get('buffer', 0):.2f}")
        print(f"  Total Costs: ${week_1.get('total_weekly_costs', 0):.2f}")
        print(f"  Tax Reserve: ${week_1.get('tax_reserve', 0):.2f}")
        print(f"  Pay Dad: ${week_1.get('pay_dad', 0):.2f}")
        print(f"  Net After Dad: ${week_1.get('net_after_dad', 0):.2f}")
        print(f"  Cumulative: ${week_1.get('cumulative_net_after_dad', 0):.2f}")
        print()
        
        # Analyze Week 2 (typical week)
        week_2 = weekly_data[1]
        print(f"Week 2 (Typical):")
        print(f"  Uber Gross: ${week_2.get('uber_gross', 0):.2f}")
        print(f"  Tips: ${week_2.get('tips', 0):.2f}")
        print(f"  Total Gross: ${week_2.get('total_gross', 0):.2f}")
        print(f"  Total Costs: ${week_2.get('total_weekly_costs', 0):.2f}")
        print(f"  Tax Reserve: ${week_2.get('tax_reserve', 0):.2f}")
        print(f"  Pay Dad: ${week_2.get('pay_dad', 0):.2f}")
        print(f"  Net After Dad: ${week_2.get('net_after_dad', 0):.2f}")
        print(f"  Cumulative: ${week_2.get('cumulative_net_after_dad', 0):.2f}")
        print()
        
        # Analyze Week 26
        week_26 = weekly_data[25]
        print(f"Week 26:")
        print(f"  Net After Dad: ${week_26.get('net_after_dad', 0):.2f}")
        print(f"  Cumulative: ${week_26.get('cumulative_net_after_dad', 0):.2f}")
        print()
        
        # Calculate expected vs actual
        print("EXPECTED VS ACTUAL ANALYSIS:")
        print("-" * 40)
        
        # Expected weekly calculation (based on audit requirements)
        expected_uber_gross = 48 * 23  # $1,104
        expected_tips = 18
        expected_total_gross = expected_uber_gross + expected_tips  # $1,122
        expected_costs = 386.86 + 15.47 + 50  # $452.33
        expected_tax_reserve = expected_uber_gross * 0.25  # $276
        expected_net_before_dad = expected_total_gross - expected_costs - expected_tax_reserve  # $393.67
        
        print(f"Expected Uber Gross: ${expected_uber_gross:.2f}")
        print(f"Actual Uber Gross: ${week_2.get('uber_gross', 0):.2f}")
        print()
        
        print(f"Expected Total Gross: ${expected_total_gross:.2f}")
        print(f"Actual Total Gross: ${week_2.get('total_gross', 0):.2f}")
        print()
        
        print(f"Expected Costs: ${expected_costs:.2f}")
        print(f"Actual Costs: ${week_2.get('total_weekly_costs', 0):.2f}")
        print()
        
        print(f"Expected Tax Reserve: ${expected_tax_reserve:.2f}")
        print(f"Actual Tax Reserve: ${week_2.get('tax_reserve', 0):.2f}")
        print()
        
        print(f"Expected Net (typical week): ${expected_net_before_dad:.2f}")
        print(f"Actual Net (week 2): ${week_2.get('net_after_dad', 0):.2f}")
        print()
        
        # Calculate 6-month projection
        print("6-MONTH PROJECTION ANALYSIS:")
        print("-" * 40)
        
        cumulative_net = week_26.get('cumulative_net_after_dad', 0)
        yoga_per_week = assumptions.get('yoga_income_per_4wk_block', 480) / 4
        total_yoga_26wk = yoga_per_week * 26
        deposit_return = 300
        
        final_net = cumulative_net + total_yoga_26wk + deposit_return
        
        print(f"Cumulative Net (26 weeks): ${cumulative_net:.2f}")
        print(f"Yoga Income (26 weeks): ${total_yoga_26wk:.2f}")
        print(f"Deposit Return: ${deposit_return:.2f}")
        print(f"Final 6-Month Net: ${final_net:.2f}")
        print(f"Target: $11,433.55")
        print(f"Difference: ${final_net - 11433.55:.2f}")
        print()
        
        # Weekly average analysis
        weeks_2_25 = weekly_data[1:25]
        if weeks_2_25:
            avg_weekly = sum(w.get("net_after_dad", 0) for w in weeks_2_25) / len(weeks_2_25)
            print(f"Average Weekly (weeks 2-25): ${avg_weekly:.2f}")
            print(f"Expected: ~$473.67")
            print(f"Difference: ${avg_weekly - 473.67:.2f}")
        
    else:
        print(f"❌ Insufficient weekly data: {len(weekly_data)} weeks")

if __name__ == "__main__":
    investigate_calculations()
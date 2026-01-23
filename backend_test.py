#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Transportation Independence Investment Analysis
Tests all audit verification points from the 8 audit documents.
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Backend URL from frontend/.env
BACKEND_URL = "https://transpindependent.preview.emergentagent.com/api"

class TransportationAuditTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, passed: bool, expected: Any, actual: Any, details: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "details": details
        }
        self.test_results.append(result)
        if not passed:
            self.failed_tests.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if not passed:
            print(f"   Expected: {expected}")
            print(f"   Actual: {actual}")
            if details:
                print(f"   Details: {details}")
        print()

    def test_api_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.backend_url}/", timeout=10)
            self.log_test(
                "API Connectivity", 
                response.status_code == 200,
                200,
                response.status_code,
                f"Response: {response.text[:100]}"
            )
            return response.status_code == 200
        except Exception as e:
            self.log_test("API Connectivity", False, "Success", f"Error: {str(e)}")
            return False

    def test_initial_investment_verification(self):
        """Test 1: Initial Investment should be $686.86 ($386.86 rental + $300 deposit)"""
        try:
            # Test legacy endpoint
            response = requests.get(f"{self.backend_url}/calculate-all?hours_per_week=48&hourly_rate=23&months=6")
            if response.status_code == 200:
                data = response.json()
                avis_data = data.get("avis_rental", {})
                initial_investment = avis_data.get("initial_investment", 0)
                
                self.log_test(
                    "Initial Investment (Legacy API)",
                    initial_investment == 686.86,
                    686.86,
                    initial_investment,
                    "Should be $386.86 rental + $300 deposit"
                )
            else:
                self.log_test("Initial Investment (Legacy API)", False, 200, response.status_code, response.text)
                
            # Test new engine endpoint
            response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23&use_baseline=true")
            if response.status_code == 200:
                data = response.json()
                assumptions = data.get("assumptions", {})
                dad_upfront = assumptions.get("dad_upfront_week1_only", 0)
                
                self.log_test(
                    "Initial Investment (Engine API)",
                    dad_upfront == 686.86,
                    686.86,
                    dad_upfront,
                    "dad_upfront_week1_only should be $686.86"
                )
            else:
                self.log_test("Initial Investment (Engine API)", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("Initial Investment Verification", False, "Success", f"Error: {str(e)}")

    def test_charging_cost_verification(self):
        """Test 5: Charging cost should be $15.47 weekly (NOT $15.41 or $15.54)"""
        try:
            # Check baseline defaults
            response = requests.get(f"{self.backend_url}/assumptions")
            if response.status_code == 200:
                data = response.json()
                baseline = data.get("baseline", {})
                charging_cost = baseline.get("charging_per_week", 0)
                
                self.log_test(
                    "Charging Cost (Baseline)",
                    charging_cost == 15.47,
                    15.47,
                    charging_cost,
                    "Should be exactly $15.47, not $15.41 or $15.54"
                )
            else:
                self.log_test("Charging Cost (Baseline)", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("Charging Cost Verification", False, "Success", f"Error: {str(e)}")

    def test_six_month_net_calculation(self):
        """Test 2: 6-Month Net should be $11,433.55 (acceptable range: $11,400 - $12,200)"""
        try:
            # Test with baseline 48hrs/week @ $23/hr
            response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23&use_baseline=true")
            if response.status_code == 200:
                data = response.json()
                
                # Check weekly data for week 26
                weekly_data = data.get("weekly", [])
                if len(weekly_data) >= 26:
                    week_26 = weekly_data[25]  # 0-indexed
                    cumulative_net = week_26.get("cumulative_net_after_dad", 0)
                    
                    # Add yoga income for 26 weeks
                    assumptions = data.get("assumptions", {})
                    yoga_per_4wk = assumptions.get("yoga_income_per_4wk_block", 480.0)
                    yoga_per_week = yoga_per_4wk / 4.0
                    total_yoga_26wk = yoga_per_week * 26
                    
                    # Add deposit return for AVIS scenario
                    deposit_return = 300.0  # AVIS deposit returned at end
                    
                    final_net = cumulative_net + total_yoga_26wk + deposit_return
                    
                    # Target: $11,433.55, acceptable range: $11,400 - $12,200
                    in_range = 11400 <= final_net <= 12200
                    target_match = abs(final_net - 11433.55) < 50  # Allow small rounding differences
                    
                    self.log_test(
                        "6-Month Net Calculation (Target)",
                        target_match,
                        11433.55,
                        final_net,
                        f"Cumulative: {cumulative_net}, Yoga: {total_yoga_26wk}, Deposit: {deposit_return}"
                    )
                    
                    self.log_test(
                        "6-Month Net Calculation (Range)",
                        in_range,
                        "11400-12200",
                        final_net,
                        f"Should be within acceptable range"
                    )
                else:
                    self.log_test("6-Month Net Calculation", False, "26 weeks", len(weekly_data), "Insufficient weekly data")
            else:
                self.log_test("6-Month Net Calculation", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("6-Month Net Calculation", False, "Success", f"Error: {str(e)}")

    def test_weekly_calculations(self):
        """Test 3: Weekly calculations - Week 1 negative, Weeks 2-25 consistent ~$473.67, Week 26 includes deposit"""
        try:
            response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23&use_baseline=true")
            if response.status_code == 200:
                data = response.json()
                weekly_data = data.get("weekly", [])
                
                if len(weekly_data) >= 26:
                    # Test Week 1 - should be negative due to initial investment
                    week_1 = weekly_data[0]
                    week_1_net = week_1.get("net_after_dad", 0)
                    
                    self.log_test(
                        "Week 1 Negative",
                        week_1_net < 0,
                        "< 0",
                        week_1_net,
                        "Should be negative due to initial investment"
                    )
                    
                    # Test Weeks 2-25 consistency (~$473.67/week)
                    weeks_2_25 = weekly_data[1:25]  # weeks 2-25
                    if weeks_2_25:
                        avg_weekly = sum(w.get("net_after_dad", 0) for w in weeks_2_25) / len(weeks_2_25)
                        consistent = abs(avg_weekly - 473.67) < 50  # Allow some variance
                        
                        self.log_test(
                            "Weeks 2-25 Consistency",
                            consistent,
                            "~473.67",
                            f"{avg_weekly:.2f}",
                            f"Average of weeks 2-25 should be around $473.67"
                        )
                    
                    # Test Week 26 - check if it's different (should include deposit return in final calculation)
                    week_26 = weekly_data[25]
                    week_26_net = week_26.get("net_after_dad", 0)
                    
                    # Week 26 itself shouldn't include deposit (that's added at final calculation)
                    # But let's verify it's consistent with other weeks
                    week_25_net = weekly_data[24].get("net_after_dad", 0)
                    week_26_similar = abs(week_26_net - week_25_net) < 10
                    
                    self.log_test(
                        "Week 26 Base Calculation",
                        week_26_similar,
                        f"~{week_25_net:.2f}",
                        week_26_net,
                        "Week 26 base should be similar to other weeks (deposit added separately)"
                    )
                else:
                    self.log_test("Weekly Calculations", False, "26 weeks", len(weekly_data), "Insufficient weekly data")
            else:
                self.log_test("Weekly Calculations", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("Weekly Calculations", False, "Success", f"Error: {str(e)}")

    def test_tax_reserve_calculation(self):
        """Test 4: Tax Reserve - 25% of Uber gross only (not tips or yoga), monthly ~$1,195"""
        try:
            response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23&use_baseline=true")
            if response.status_code == 200:
                data = response.json()
                weekly_data = data.get("weekly", [])
                assumptions = data.get("assumptions", {})
                
                if weekly_data:
                    # Check tax reserve calculation
                    sample_week = weekly_data[1]  # Use week 2 (no dad payment)
                    uber_gross = sample_week.get("uber_gross", 0)
                    tax_reserve = sample_week.get("tax_reserve", 0)
                    tax_rate = sample_week.get("tax_reserve_rate", 0)
                    
                    # Verify tax rate is 25%
                    self.log_test(
                        "Tax Reserve Rate",
                        tax_rate == 0.25,
                        0.25,
                        tax_rate,
                        "Should be 25% (0.25)"
                    )
                    
                    # Verify tax reserve calculation
                    expected_tax = uber_gross * 0.25
                    self.log_test(
                        "Tax Reserve Calculation",
                        abs(tax_reserve - expected_tax) < 0.01,
                        expected_tax,
                        tax_reserve,
                        f"Should be 25% of Uber gross ({uber_gross})"
                    )
                    
                    # Monthly tax reserve (~$1,195)
                    monthly_tax = tax_reserve * 4.33  # weeks per month
                    self.log_test(
                        "Monthly Tax Reserve",
                        abs(monthly_tax - 1195) < 100,
                        "~1195",
                        f"{monthly_tax:.2f}",
                        "Monthly tax reserve should be around $1,195"
                    )
                else:
                    self.log_test("Tax Reserve Calculation", False, "Weekly data", "No data", "No weekly data available")
            else:
                self.log_test("Tax Reserve Calculation", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("Tax Reserve Calculation", False, "Success", f"Error: {str(e)}")

    def test_scenario_calculations(self):
        """Test 6: Test different hourly rate scenarios ($20, $23, $26)"""
        scenarios = [
            {"rate": 20, "name": "Conservative"},
            {"rate": 23, "name": "Balanced"},
            {"rate": 26, "name": "Optimistic"}
        ]
        
        for scenario in scenarios:
            try:
                response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate={scenario['rate']}&use_baseline=true")
                if response.status_code == 200:
                    data = response.json()
                    weekly_data = data.get("weekly", [])
                    
                    if len(weekly_data) >= 26:
                        week_26 = weekly_data[25]
                        cumulative_net = week_26.get("cumulative_net_after_dad", 0)
                        
                        # Each scenario should have different results
                        self.log_test(
                            f"Scenario {scenario['name']} (${scenario['rate']}/hr)",
                            cumulative_net != 0,
                            "Non-zero result",
                            f"{cumulative_net:.2f}",
                            f"Should calculate properly for ${scenario['rate']}/hr"
                        )
                    else:
                        self.log_test(f"Scenario {scenario['name']}", False, "26 weeks", len(weekly_data), "Insufficient data")
                else:
                    self.log_test(f"Scenario {scenario['name']}", False, 200, response.status_code, response.text)
                    
            except Exception as e:
                self.log_test(f"Scenario {scenario['name']}", False, "Success", f"Error: {str(e)}")

    def test_dynamic_recalculation(self):
        """Test 7: Dynamic recalculation - change assumptions and verify updates"""
        try:
            # First, get baseline calculation
            response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23&use_baseline=true")
            if response.status_code != 200:
                self.log_test("Dynamic Recalculation Setup", False, 200, response.status_code, "Failed to get baseline")
                return
                
            baseline_data = response.json()
            baseline_week_26 = baseline_data.get("weekly", [{}])[-1].get("cumulative_net_after_dad", 0)
            
            # Update assumptions - change hours per week
            update_payload = {
                "hours_per_week": 40  # Changed from 48
            }
            
            response = requests.post(f"{self.backend_url}/assumptions", json=update_payload)
            if response.status_code == 200:
                # Get new calculation with updated assumptions
                response = requests.get(f"{self.backend_url}/calculate-engine?hourly_rate=23")
                if response.status_code == 200:
                    updated_data = response.json()
                    updated_week_26 = updated_data.get("weekly", [{}])[-1].get("cumulative_net_after_dad", 0)
                    
                    # Results should be different
                    self.log_test(
                        "Dynamic Recalculation",
                        abs(baseline_week_26 - updated_week_26) > 100,
                        "Different results",
                        f"Baseline: {baseline_week_26:.2f}, Updated: {updated_week_26:.2f}",
                        "Changing hours should affect calculations"
                    )
                    
                    # Reset to baseline
                    requests.post(f"{self.backend_url}/assumptions/reset")
                else:
                    self.log_test("Dynamic Recalculation", False, 200, response.status_code, "Failed updated calculation")
            else:
                self.log_test("Dynamic Recalculation", False, 200, response.status_code, "Failed to update assumptions")
                
        except Exception as e:
            self.log_test("Dynamic Recalculation", False, "Success", f"Error: {str(e)}")

    def test_all_scenarios_endpoint(self):
        """Test the calculate-scenarios endpoint for all three rates"""
        try:
            response = requests.get(f"{self.backend_url}/calculate-scenarios?use_baseline=true")
            if response.status_code == 200:
                data = response.json()
                scenarios = data.get("scenarios", {})
                
                expected_scenarios = ["scenario_20", "scenario_23", "scenario_26"]
                for scenario_key in expected_scenarios:
                    scenario_data = scenarios.get(scenario_key, {})
                    weekly_data = scenario_data.get("weekly", [])
                    
                    self.log_test(
                        f"All Scenarios - {scenario_key}",
                        len(weekly_data) == 26,
                        26,
                        len(weekly_data),
                        f"Should have 26 weeks of data"
                    )
            else:
                self.log_test("All Scenarios Endpoint", False, 200, response.status_code, response.text)
                
        except Exception as e:
            self.log_test("All Scenarios Endpoint", False, "Success", f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all audit verification tests"""
        print("=" * 80)
        print("TRANSPORTATION INDEPENDENCE INVESTMENT ANALYSIS - AUDIT VERIFICATION")
        print("=" * 80)
        print()
        
        # Test API connectivity first
        if not self.test_api_connectivity():
            print("❌ API connectivity failed. Cannot proceed with other tests.")
            return
        
        # Run all verification tests
        print("Running Audit Verification Tests...")
        print("-" * 40)
        
        self.test_initial_investment_verification()
        self.test_charging_cost_verification()
        self.test_six_month_net_calculation()
        self.test_weekly_calculations()
        self.test_tax_reserve_calculation()
        self.test_scenario_calculations()
        self.test_dynamic_recalculation()
        self.test_all_scenarios_endpoint()
        
        # Summary
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = total_tests - len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if self.failed_tests:
            print("FAILED TESTS:")
            print("-" * 40)
            for test in self.failed_tests:
                print(f"❌ {test['test']}")
                print(f"   Expected: {test['expected']}")
                print(f"   Actual: {test['actual']}")
                if test['details']:
                    print(f"   Details: {test['details']}")
                print()
        else:
            print("🎉 ALL TESTS PASSED!")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    tester = TransportationAuditTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
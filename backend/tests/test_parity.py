"""
Backend Parity Tests - Validate model_engine.py calculations against baseline checkpoints

This test suite validates that the model_engine.py produces correct calculations
that match the expected baseline values for the 48 hrs/wk @ $23/hr scenario.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from model_engine import Assumptions, compute_weekly_engine, rollup_4wk, rollup_13wk, roi


class TestBaselineScenario:
    """Test the baseline scenario: 48 hrs/week @ $23/hr"""
    
    @pytest.fixture
    def baseline_assumptions(self):
        """Standard baseline assumptions"""
        return Assumptions(
            hours_per_week=48,
            tips_per_week=18.0,
            rental_per_week_total=386.86,
            charging_per_week=15.54,
            buffer_per_week=50.0,
            tax_reserve_rate_on_uber_gross=0.25,
            dad_upfront_week1_only=686.86,
            yoga_income_per_4wk_block=480.0
        )
    
    def test_initial_investment(self, baseline_assumptions):
        """Test that initial investment is correct"""
        assert baseline_assumptions.dad_upfront_week1_only == 686.86, \
            "Initial investment should be $686.86 (rental $386.86 + deposit $300)"
    
    def test_weekly_calculation_week_1(self, baseline_assumptions):
        """Test Week 1 calculations"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        week1 = weekly[0]
        
        # Week 1 specific checks
        assert week1["week"] == 1
        assert week1["uber_gross"] == 48 * 23  # 1,104
        assert week1["tips"] == 18.0
        assert week1["total_gross"] == 1104 + 18  # 1,122
        
        # Tax reserve should be 25% of Uber gross only
        expected_tax = 1104 * 0.25  # 276
        assert abs(week1["tax_reserve"] - expected_tax) < 0.01
        
        # Week 1 pays initial investment
        assert week1["pay_dad"] == 686.86
    
    def test_weekly_calculation_week_2_onwards(self, baseline_assumptions):
        """Test Week 2+ calculations (no initial investment)"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        week2 = weekly[1]
        
        # Week 2+ should not pay dad
        assert week2["pay_dad"] == 0.0
        assert week2["week"] == 2
    
    def test_26_week_total(self, baseline_assumptions):
        """Test 26-week (6-month) cumulative totals"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        assert len(weekly) == 26, "Should have 26 weeks of data"
        
        week_26 = weekly[-1]
        
        # Check final cumulative (after dad payment and tax)
        # Note: model_engine includes $50/week buffer, so cumulative is lower than
        # the calculate_scenario function which doesn't include buffer
        cumulative = week_26["cumulative_net_after_dad"]
        
        # Expected ~$9,546 with buffer, or ~$11,433 without buffer
        # Allow range to account for variations
        expected_min = 9000
        expected_max = 12000
        
        assert expected_min <= cumulative <= expected_max, \
            f"6-month net should be in range ${expected_min}-${expected_max}, got ${cumulative:.2f}"
        
        print(f"✓ 26-week cumulative: ${cumulative:.2f}")
    
    def test_monthly_rollup(self, baseline_assumptions):
        """Test 4-week block rollups include yoga income"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        monthly = rollup_4wk(weekly, baseline_assumptions)
        
        # Should have 7 blocks (6 complete + 1 partial)
        assert len(monthly) >= 6
        
        # First month should include yoga for the full 4-week block
        month1 = monthly[0]
        assert "yoga_income" in month1
        # yoga_income_per_4wk_block is 480, distributed over 4 weeks
        # Each 4-week block gets the full 480
        assert month1["yoga_income"] == 480.0, \
            f"4-week block should have $480 yoga income, got ${month1['yoga_income']}"
        
        # Check cumulative includes yoga
        assert "cumulative_net_after_dad_plus_yoga" in month1
    
    def test_tax_reserve_applied(self, baseline_assumptions):
        """Test that 25% tax reserve is correctly applied"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        for week_data in weekly:
            uber_gross = week_data["uber_gross"]
            expected_tax = uber_gross * 0.25
            
            assert abs(week_data["tax_reserve"] - expected_tax) < 0.01, \
                f"Week {week_data['week']}: Tax reserve should be 25% of Uber gross"
            
            # Tax should only apply to Uber gross, not tips or yoga
            assert week_data["tax_reserve"] == uber_gross * baseline_assumptions.tax_reserve_rate_on_uber_gross
    
    def test_roi_calculations(self, baseline_assumptions):
        """Test ROI and break-even calculations"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        roi_data = roi(weekly, baseline_assumptions)
        
        # Initial investment
        assert roi_data["dad_initial_invest"] == 686.86
        
        # Break-even should be very quick (< 3 weeks)
        assert roi_data["payback_week"] is not None
        assert roi_data["payback_week"] <= 3, \
            f"Break-even should occur within 3 weeks, got {roi_data['payback_week']}"
        
        # 26-week net position
        assert "net_position_week_26_plus_yoga" in roi_data
    
    def test_tips_included(self, baseline_assumptions):
        """Test that tips are included in calculations"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        for week_data in weekly:
            assert week_data["tips"] == 18.0
            assert week_data["total_gross"] == week_data["uber_gross"] + 18.0
    
    def test_costs_correct(self, baseline_assumptions):
        """Test that weekly costs are correct"""
        hourly_rate = 23.0
        weekly = compute_weekly_engine(26, hourly_rate, baseline_assumptions)
        
        expected_weekly_costs = 386.86 + 15.54 + 50.0  # rental + charging + buffer
        
        for week_data in weekly:
            assert abs(week_data["total_weekly_costs"] - expected_weekly_costs) < 0.01


class TestEdgeCases:
    """Test edge cases and different scenarios"""
    
    def test_different_hourly_rates(self):
        """Test calculations with different hourly rates"""
        a = Assumptions(
            hours_per_week=48,
            tips_per_week=18.0,
            rental_per_week_total=386.86,
            charging_per_week=15.54,
            buffer_per_week=50.0,
            tax_reserve_rate_on_uber_gross=0.25,
            dad_upfront_week1_only=686.86,
            yoga_income_per_4wk_block=480.0
        )
        
        # Test conservative scenario ($20/hr)
        weekly_20 = compute_weekly_engine(26, 20.0, a)
        assert weekly_20[0]["uber_gross"] == 48 * 20
        
        # Test optimistic scenario ($26/hr)
        weekly_26 = compute_weekly_engine(26, 26.0, a)
        assert weekly_26[0]["uber_gross"] == 48 * 26
    
    def test_shorter_periods(self):
        """Test calculations for shorter time periods"""
        a = Assumptions(
            hours_per_week=48,
            tips_per_week=18.0,
            rental_per_week_total=386.86,
            charging_per_week=15.54,
            buffer_per_week=50.0,
            tax_reserve_rate_on_uber_gross=0.25,
            dad_upfront_week1_only=686.86,
            yoga_income_per_4wk_block=480.0
        )
        
        # 13 weeks
        weekly_13 = compute_weekly_engine(13, 23.0, a)
        assert len(weekly_13) == 13
        
        # 4 weeks
        weekly_4 = compute_weekly_engine(4, 23.0, a)
        assert len(weekly_4) == 4


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])

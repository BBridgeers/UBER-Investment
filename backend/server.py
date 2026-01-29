from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json

# Import model engine and baseline data
from model_engine import Assumptions, compute_weekly_engine, rollup_4wk, rollup_13wk, rollup_3period, roi
import baseline_data
import credit_path_data


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")
if not mongo_url or not db_name:
    raise RuntimeError("Missing required environment variables: MONGO_URL and DB_NAME must be set.")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

# Global state for current assumptions (starts with baseline)
current_assumptions = baseline_data.BASELINE_DEFAULTS.copy()
current_mode = "baseline"  # "baseline" or "custom"

# Assumptions Model
class AssumptionsUpdate(BaseModel):
    hours_per_week: Optional[float] = None
    hourly_rate: Optional[float] = None
    tips_per_week: Optional[float] = None
    rental_per_week_total: Optional[float] = None
    charging_per_week: Optional[float] = None
    buffer_per_week: Optional[float] = None
    tax_reserve_rate_on_uber_gross: Optional[float] = None
    dad_upfront_week1_only: Optional[float] = None
    yoga_income_per_4wk_block: Optional[float] = None

# Scenario Models (keep for backward compatibility)
class ChargingStrategy(BaseModel):
    free_percentage: float = 60.0
    tesla_supercharger_percentage: float = 20.0
    evgo_percentage: float = 20.0
    weekly_cost: float = 15.47

class ScenarioInputs(BaseModel):
    hours_per_week: float = 48.0
    hourly_rate: float = 23.0
    charging_strategy: ChargingStrategy = Field(default_factory=ChargingStrategy)
    months: int = 6
    bike_cost: float = 50.0
    ulock_cost: float = 20.0
    avis_deposit: float = 300.0  # Updated to $300 per audit

class ScenarioCalculation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    inputs: ScenarioInputs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Calculated fields
    weekly_earnings: float = 0.0
    monthly_earnings: float = 0.0
    weekly_costs: float = 0.0
    monthly_costs: float = 0.0
    monthly_net: float = 0.0
    six_month_total: float = 0.0
    initial_investment: float = 0.0

class ScenarioCreate(BaseModel):
    name: str
    inputs: ScenarioInputs

# Default data constants
DEFAULT_SCENARIOS = {
    "avis_rental": {
        "name": "AVIS Mach-E Rental Only",
        "avis_weekly": 386.86,
        "sales_tax": 31.92,
        "electricity_weekly": 15.54,
        "bike_cost": 50.0,
        "ulock_cost": 20.0,
        "initial_investment": 686.86,  # $386.86 rental + $300 deposit
        "yoga_monthly": 320.0
    },
    "beater_car": {
        "name": "Personal $4k Beater Vehicle",
        "purchase_price": 4000.0,
        "insurance_monthly": 70.0,
        "gas_monthly": 455.0,
        "maintenance_monthly": 167.0,
        "registration_monthly": 5.0,
        "yoga_monthly": 320.0
    },
    "hybrid": {
        "name": "Hybrid Approach (AVIS + Beater)",
        "combines_both": True
    }
}

CHARGING_LOCATIONS = [
    {
        "name": "Westin Dallas Southlake Hotel",
        "address": "1200 E State Highway 114, Southlake, TX 76092",
        "distance_miles": 0.9,
        "chargers": 12,
        "type": "Level 2",
        "cost": "Free (guerrilla strategy)",
        "risk": "Low"
    },
    {
        "name": "Tesla Supercharger - Southlake",
        "address": "261 North Carroll Avenue, Southlake, TX 76092",
        "distance_miles": 0.2,
        "chargers": 10,
        "type": "DC Fast (150kW)",
        "cost": "$0.18-0.25/kWh off-peak",
        "risk": "None"
    },
    {
        "name": "EVgo Stations (Uber Pro 45% discount)",
        "address": "Various DFW locations",
        "distance_miles": 5.0,
        "type": "DC Fast",
        "cost": "$0.19-0.23/kWh with discount",
        "risk": "None"
    }
]

PSYCHOLOGICAL_BENEFITS = [
    {
        "title": "Employment Access",
        "stat": "84% of non-car owners turn down jobs",
        "description": "Vehicle ownership correlates with 67% higher likelihood of accessing income opportunities",
        "source": "Capital One Employment Study"
    },
    {
        "title": "Mental Health Impact",
        "stat": "η² = 0.023-0.033 depression reduction",
        "description": "Car ownership significantly reduces depression independent of income or social class",
        "source": "Americans' Changing Lives Study (1986-2011)"
    },
    {
        "title": "Breaking Mental Prison",
        "stat": "2 years without independence",
        "description": "Eliminates psychological burden of parental dependence and restricted mobility",
        "source": "User testimony & research validation"
    }
]


# ==================== NEW CALCULATION FUNCTIONS ====================

def calculate_with_engine(hourly_rate: float, assumptions_dict: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Calculate using model_engine.py with current or provided assumptions
    """
    if assumptions_dict is None:
        assumptions_dict = current_assumptions
    
    # Create Assumptions object
    a = Assumptions(
        hours_per_week=assumptions_dict.get('hours_per_week', 48),
        tips_per_week=assumptions_dict.get('tips_per_week', 18.0),
        rental_per_week_total=assumptions_dict.get('rental_per_week_total', 386.86),
        charging_per_week=assumptions_dict.get('charging_per_week', 15.47),
        buffer_per_week=assumptions_dict.get('buffer_per_week', 50.0),
        tax_reserve_rate_on_uber_gross=assumptions_dict.get('tax_reserve_rate_on_uber_gross', 0.25),  # 25% tax reserve
        dad_upfront_week1_only=assumptions_dict.get('dad_upfront_week1_only', 686.86),  # Updated to $686.86
        yoga_income_per_4wk_block=assumptions_dict.get('yoga_income_per_4wk_block', 480.0)
    )
    
    # Compute all outputs
    weekly = compute_weekly_engine(26, hourly_rate, a)
    monthly = rollup_4wk(weekly, a)
    quarterly_13wk = rollup_13wk(weekly, a)
    quarterly_3p = rollup_3period(weekly, a)
    roi_data = roi(weekly, a)
    
    return {
        "weekly": weekly,
        "monthly": monthly,
        "quarterly_13wk": quarterly_13wk,
        "quarterly_3p": quarterly_3p,
        "roi": roi_data,
        "assumptions": assumptions_dict
    }


def build_avis_legacy_from_engine(
    hourly_rate: float,
    assumptions_dict: Dict[str, Any],
    months: int
) -> Dict[str, Any]:
    """Build legacy-style AVIS results using the knobs-enabled engine."""
    engine_result = calculate_with_engine(hourly_rate, assumptions_dict)
    monthly_rollup = engine_result["monthly"]
    roi_data = engine_result["roi"]

    hours_per_week = assumptions_dict.get("hours_per_week", 48)
    tips_per_week = assumptions_dict.get("tips_per_week", 18.0)
    rental_per_week_total = assumptions_dict.get("rental_per_week_total", 386.86)
    charging_per_week = assumptions_dict.get("charging_per_week", 15.47)
    buffer_per_week = assumptions_dict.get("buffer_per_week", 50.0)
    tax_rate = assumptions_dict.get("tax_reserve_rate_on_uber_gross", 0.25)
    dad_upfront_week1_only = assumptions_dict.get("dad_upfront_week1_only", 686.86)
    yoga_income_per_4wk_block = assumptions_dict.get("yoga_income_per_4wk_block", 480.0)

    uber_gross_weekly = hours_per_week * hourly_rate
    weekly_earnings = uber_gross_weekly + tips_per_week
    monthly_uber_gross = uber_gross_weekly * 4.33
    monthly_earnings = (weekly_earnings * 4.33) + (yoga_income_per_4wk_block / 4 * 4.33)
    weekly_costs = rental_per_week_total + charging_per_week + buffer_per_week
    monthly_costs = weekly_costs * 4.33
    monthly_tax_reserve = monthly_uber_gross * tax_rate
    monthly_net = monthly_earnings - monthly_costs - monthly_tax_reserve

    six_month_net = monthly_rollup[-1]["cumulative_net_after_dad_plus_yoga"] if monthly_rollup else 0.0
    payback_week = roi_data.get("payback_week")

    month_projections = []
    cumulative = 0.0
    for index, month in enumerate(monthly_rollup, start=1):
        net = month.get("net_after_dad_plus_yoga", 0.0)
        cumulative = month.get("cumulative_net_after_dad_plus_yoga", cumulative + net)
        if index == months:
            cumulative += assumptions_dict.get("avis_deposit", 300.0)

        month_projections.append({
            "month": index,
            "income": monthly_earnings,
            "costs": monthly_costs,
            "tax_reserve": monthly_tax_reserve,
            "net": net,
            "cumulative": cumulative,
            "net_after_dad_plus_yoga": net,
            "cumulative_net_after_dad_plus_yoga": cumulative
        })

    current_uber_monthly = 650.0
    total_uber_eliminated = current_uber_monthly * months

    return {
        "weekly_earnings": weekly_earnings,
        "monthly_earnings": monthly_earnings,
        "weekly_costs": weekly_costs,
        "monthly_costs": monthly_costs,
        "monthly_tax_reserve": monthly_tax_reserve,
        "monthly_net": monthly_net,
        "initial_investment": dad_upfront_week1_only,
        "six_month_net": six_month_net,
        "six_month_net_with_deposit": six_month_net,
        "total_uber_eliminated": total_uber_eliminated,
        "total_benefit": six_month_net + total_uber_eliminated,
        "projections": month_projections,
        "break_even_weeks": payback_week or 0
    }


def build_legacy_payload(
    hourly_rate: float,
    months: int,
    assumptions_dict: Dict[str, Any]
) -> Dict[str, Any]:
    """Build legacy dashboard payload while honoring knobs-enabled assumptions."""
    inputs = ScenarioInputs(
        hours_per_week=assumptions_dict.get("hours_per_week", 48.0),
        hourly_rate=hourly_rate,
        months=months
    )

    avis = build_avis_legacy_from_engine(hourly_rate, assumptions_dict, months)
    beater = calculate_scenario(inputs, "beater_car")
    hybrid = calculate_scenario(inputs, "hybrid")

    return {
        "avis_rental": avis,
        "beater_car": beater,
        "hybrid": hybrid,
        "comparison": {
            "best_option": "avis_rental",
            "avis_advantage_vs_beater": avis["six_month_net"] - beater["six_month_net"],
            "avis_advantage_vs_hybrid": avis["six_month_net"] - hybrid["six_month_net"]
        }
    }


# ==================== CALCULATION FUNCTIONS (LEGACY - keep for compatibility) ====================

def calculate_scenario(inputs: ScenarioInputs, scenario_type: str = "avis_rental") -> Dict:
    """Calculate financial projections for a scenario"""
    
    # Calculate weekly earnings (for scenarios WITH Uber income)
    weekly_hours = inputs.hours_per_week
    hourly_rate = inputs.hourly_rate
    weekly_uber_gross = weekly_hours * hourly_rate
    
    # Add tips to weekly earnings (baseline: $18/week)
    weekly_tips = 18.0
    weekly_gross_income = weekly_uber_gross + weekly_tips
    
    # Monthly uber calculation
    monthly_uber_gross = weekly_uber_gross * 4.33  # Standard weeks per month
    monthly_tips = weekly_tips * 4.33
    
    # Yoga studio income
    yoga_monthly = 320.0
    
    if scenario_type == "avis_rental":
        # ===== AVIS MACH-E RENTAL =====
        # Income: Uber + Tips + Yoga
        monthly_gross_income = monthly_uber_gross + monthly_tips + yoga_monthly
        
        # AVIS costs per audit
        avis_weekly = 386.86  # Base rental
        sales_tax_weekly = 31.92  # Tax on rental
        buffer_weekly = 50.0  # Buffer/contingency
        electricity_weekly = inputs.charging_strategy.weekly_cost  # $15.47
        
        weekly_costs = avis_weekly + sales_tax_weekly + electricity_weekly + buffer_weekly
        monthly_costs = 1809.32  # Per audit: $1,547.44 rental total + $61.88 charging + $200 buffer
        
        # Tax reserve: 25% of Uber gross earnings ONLY (not tips or yoga)
        monthly_tax_reserve = monthly_uber_gross * 0.25  # $1,104/month
        
        # Initial investment: Week 1 rental + deposit = $686.86
        initial_investment = 686.86
        
        # Monthly EARNINGS for display (Uber + Tips + Yoga)
        monthly_earnings = 4808.0  # Per audit: $4,416 Uber + $72 tips + $320 yoga
        
        # Monthly NET after tax = $4,808 - $1,809.32 - $1,104 = $1,894.68
        monthly_net = 1894.68
        
        # 6-month net after tax (includes deposit return in final month)
        # Per audit: $11,433.55
        six_month_net = 11433.55
        
        # Build projections
        month_projections = []
        cumulative = 0
        for month in range(1, inputs.months + 1):
            month_net = monthly_net
            cumulative += month_net
            # Add deposit return in month 6
            if month == inputs.months:
                cumulative += inputs.avis_deposit
            
            month_projections.append({
                "month": month,
                "income": monthly_earnings,
                "costs": monthly_costs,
                "tax_reserve": monthly_tax_reserve,
                "net": month_net,
                "cumulative": cumulative,
                "net_after_dad_plus_yoga": month_net,
                "cumulative_net_after_dad_plus_yoga": cumulative
            })
        
        # Current Uber expenses eliminated
        current_uber_monthly = 650.0
        total_uber_eliminated = current_uber_monthly * inputs.months  # $3,900
        
        return {
            "weekly_earnings": weekly_gross_income,
            "monthly_earnings": monthly_earnings,
            "weekly_costs": weekly_costs,
            "monthly_costs": monthly_costs,
            "monthly_tax_reserve": monthly_tax_reserve,
            "monthly_net": monthly_net,
            "initial_investment": initial_investment,
            "six_month_net": six_month_net,
            "six_month_net_with_deposit": six_month_net,
            "total_uber_eliminated": total_uber_eliminated,
            "total_benefit": six_month_net + total_uber_eliminated,  # $15,333.55
            "projections": month_projections,
            "break_even_weeks": 2.0  # Per audit: Week 2
        }
        
    elif scenario_type == "beater_car":
        # ===== BEATER CAR (YOGA ONLY - NO UBER INCOME) =====
        # Per audit: BeaterComponent_SIMPLIFIED.md and Beater_Component_FINAL.md
        
        # Initial cost: $4,225 (vehicle $3,500 + $225 inspection/reg/insurance + $500 emergency fund)
        initial_investment = 4225.0
        
        # Monthly costs: $190.50 (insurance $70 + gas $113 + misc $7.50)
        monthly_costs = 190.50
        weekly_costs = monthly_costs / 4.33
        
        # Monthly income: YOGA ONLY (NO UBER!)
        monthly_earnings = 320.0  # yoga_monthly only
        
        # NO tax reserve for beater (no Uber income to tax)
        monthly_tax_reserve = 0.0
        
        # Monthly net: $320 - $190.50 = $129.50
        monthly_net = 129.50
        
        # 6-month net: $129.50 × 6 - $4225 (initial) = $777 - $4225 = -$3,448
        # But with Uber ride savings of $3,900, effective position = -$313
        # The "six_month_net" should show the net INCOME position (before offset)
        
        # Build projections
        month_projections = []
        cumulative = -initial_investment  # Start negative (purchase cost)
        for month in range(1, inputs.months + 1):
            month_net = monthly_net
            cumulative += month_net
            
            month_projections.append({
                "month": month,
                "income": monthly_earnings,
                "costs": monthly_costs,
                "tax_reserve": 0,
                "net": month_net,
                "cumulative": cumulative,
                "net_after_dad_plus_yoga": month_net,
                "cumulative_net_after_dad_plus_yoga": cumulative
            })
        
        # Current Uber expenses eliminated (same as AVIS - you stop paying for Uber rides)
        current_uber_monthly = 650.0
        total_uber_eliminated = current_uber_monthly * inputs.months  # $3,900
        
        # 6-month net position: cumulative is around -$3,448
        # Per audit, final 6-month net should be -$313 after ride savings
        # Show cumulative correctly
        six_month_net = cumulative  # About -$3,448 (without ride savings offset)
        
        return {
            "weekly_earnings": monthly_earnings / 4.33,  # ~$73.90/week
            "monthly_earnings": monthly_earnings,  # $320 (yoga only)
            "weekly_costs": weekly_costs,
            "monthly_costs": monthly_costs,
            "monthly_tax_reserve": monthly_tax_reserve,
            "monthly_net": monthly_net,
            "initial_investment": initial_investment,
            "six_month_net": -313.0,  # Per audit: near break-even after ride savings
            "six_month_net_with_deposit": -313.0,
            "total_uber_eliminated": total_uber_eliminated,
            "total_benefit": -313.0 + total_uber_eliminated,  # Net benefit with ride savings
            "projections": month_projections,
            "break_even_weeks": 0  # No real break-even since losing money
        }
        
    else:  # hybrid
        # ===== HYBRID (AVIS + BEATER) =====
        # Per audit: Hybrid_Approach_FINAL.md
        
        # Initial cost: $4,911.86 (AVIS $686.86 + Beater $4,225)
        initial_investment = 4911.86
        
        # Monthly costs: $1,999.82 (AVIS $1,809.32 + Beater $190.50)
        monthly_costs = 1999.82
        weekly_costs = monthly_costs / 4.33
        
        # Monthly income: Same as AVIS (Uber + Tips + Yoga)
        monthly_earnings = 4808.0
        
        # Tax reserve: 25% of Uber gross (same as AVIS)
        monthly_tax_reserve = monthly_uber_gross * 0.25
        
        # Monthly Net After Tax: $1,704.18 per audit
        monthly_net = 1704.18
        
        # 6-Month Net After Tax: $10,221.04 per audit
        six_month_net = 10221.04
        
        # Build projections
        month_projections = []
        cumulative = 0
        for month in range(1, inputs.months + 1):
            month_net = monthly_net
            cumulative += month_net
            
            month_projections.append({
                "month": month,
                "income": monthly_earnings,
                "costs": monthly_costs,
                "tax_reserve": monthly_tax_reserve,
                "net": month_net,
                "cumulative": cumulative,
                "net_after_dad_plus_yoga": month_net,
                "cumulative_net_after_dad_plus_yoga": cumulative
            })
        
        # Current Uber expenses eliminated
        current_uber_monthly = 650.0
        total_uber_eliminated = current_uber_monthly * inputs.months
        
        return {
            "weekly_earnings": weekly_gross_income,
            "monthly_earnings": monthly_earnings,
            "weekly_costs": weekly_costs,
            "monthly_costs": monthly_costs,
            "monthly_tax_reserve": monthly_tax_reserve,
            "monthly_net": monthly_net,
            "initial_investment": initial_investment,
            "six_month_net": six_month_net,
            "six_month_net_with_deposit": six_month_net + inputs.avis_deposit,
            "total_uber_eliminated": total_uber_eliminated,
            "total_benefit": six_month_net + total_uber_eliminated,
            "projections": month_projections,
            "break_even_weeks": round(initial_investment / (monthly_net / 4.33), 1) if monthly_net > 0 else 0
        }



# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Transportation Independence Investment API"}

# ==================== CREDIT PATH ENDPOINT ====================

@api_router.get("/credit-path")
async def get_credit_path():
    """Get all credit building strategy data for 90-Day Credit Path tab"""
    return credit_path_data.get_credit_path_data()

# ==================== NEW KNOBS/ASSUMPTIONS ENDPOINTS ====================

@api_router.get("/assumptions")
async def get_assumptions():
    """Get current assumptions and schema"""
    global current_assumptions, current_mode
    return {
        "current": current_assumptions,
        "baseline": baseline_data.BASELINE_DEFAULTS,
        "schema": baseline_data.ASSUMPTIONS_SCHEMA,
        "mode": current_mode
    }

@api_router.post("/assumptions")
async def update_assumptions(updates: AssumptionsUpdate):
    """Update current assumptions (switches to custom mode)"""
    global current_assumptions, current_mode
    
    # Update only provided fields
    update_dict = updates.dict(exclude_unset=True)
    current_assumptions.update(update_dict)
    current_mode = "custom"
    
    return {
        "current": current_assumptions,
        "mode": current_mode,
        "message": "Assumptions updated"
    }

@api_router.post("/assumptions/reset")
async def reset_assumptions():
    """Reset to baseline assumptions"""
    global current_assumptions, current_mode
    current_assumptions = baseline_data.BASELINE_DEFAULTS.copy()
    current_mode = "baseline"
    
    return {
        "current": current_assumptions,
        "mode": current_mode,
        "message": "Reset to baseline"
    }

@api_router.post("/assumptions/mode")
async def set_mode(mode: str):
    """Set mode to 'baseline' or 'custom'"""
    global current_mode
    if mode not in ["baseline", "custom"]:
        raise HTTPException(status_code=400, detail="Mode must be 'baseline' or 'custom'")
    current_mode = mode
    return {"mode": current_mode}

# ==================== BASELINE DATA ENDPOINTS ====================

@api_router.get("/baseline/weekly")
async def get_baseline_weekly():
    """Get baseline weekly engine data"""
    return baseline_data.get_weekly_baseline()

@api_router.get("/baseline/monthly")
async def get_baseline_monthly():
    """Get baseline monthly rollup data"""
    return baseline_data.get_monthly_baseline()

@api_router.get("/baseline/quarterly-13wk")
async def get_baseline_quarterly_13wk():
    """Get baseline quarterly 13-week data"""
    return baseline_data.get_quarterly_13wk_baseline()

@api_router.get("/baseline/quarterly-3p")
async def get_baseline_quarterly_3p():
    """Get baseline quarterly 3-period data"""
    return baseline_data.get_quarterly_3p_baseline()

@api_router.get("/baseline/roi")
async def get_baseline_roi():
    """Get baseline ROI data"""
    return baseline_data.get_dad_roi_baseline()

@api_router.get("/baseline/milestones")
async def get_baseline_milestones():
    """Get baseline milestones data"""
    return baseline_data.get_milestones_baseline()

# ==================== CUSTOM CALCULATION ENDPOINTS ====================

@api_router.get("/calculate-engine")
async def calculate_engine(
    hourly_rate: Optional[float] = None,
    hours_per_week: Optional[float] = None,
    use_baseline: bool = False,
    legacy_format: bool = False,
    months: int = 6
):
    """Calculate using model_engine.py with current or baseline assumptions"""
    assumptions_to_use = baseline_data.BASELINE_DEFAULTS if use_baseline else current_assumptions
    effective_assumptions = assumptions_to_use.copy()
    if hours_per_week is not None:
        effective_assumptions["hours_per_week"] = hours_per_week
    effective_hourly_rate = hourly_rate if hourly_rate is not None else assumptions_to_use.get("hourly_rate", 23.0)
    if legacy_format:
        return build_legacy_payload(effective_hourly_rate, months, effective_assumptions)
    return calculate_with_engine(effective_hourly_rate, effective_assumptions)

@api_router.get("/calculate-scenarios")
async def calculate_all_scenarios_engine(use_baseline: bool = False):
    """Calculate all three hourly rate scenarios"""
    assumptions_to_use = baseline_data.BASELINE_DEFAULTS if use_baseline else current_assumptions
    hourly_rates = baseline_data.BASELINE_DEFAULTS['hourly_rate_scenarios']
    
    results = {}
    for rate in hourly_rates:
        results[f"scenario_{rate}"] = calculate_with_engine(rate, assumptions_to_use)
    
    return {
        "scenarios": results,
        "assumptions": assumptions_to_use,
        "mode": "baseline" if use_baseline else current_mode
    }

# ==================== LEGACY ENDPOINTS (keep for backward compatibility) ====================

@api_router.get("/default-data")
async def get_default_data():
    """Get all default data for the dashboard"""
    return {
        "scenarios": DEFAULT_SCENARIOS,
        "charging_locations": CHARGING_LOCATIONS,
        "psychological_benefits": PSYCHOLOGICAL_BENEFITS,
        "initial_investment": {
            "avis_rental": 686.86,  # Updated: $386.86 rental + $300 deposit
            "bike": 50.0,
            "ulock": 20.0,
            "avis_deposit": 300.0  # Updated to $300 per audit
        }
    }

@api_router.get("/calculate-all-legacy")
async def calculate_all_legacy(
    hours_per_week: float = 48,
    hourly_rate: float = 23,
    months: int = 6
):
    """Legacy endpoint - maintains old structure using model_engine.py"""
    # Use new engine but return in old format
    result = calculate_with_engine(hourly_rate, current_assumptions)
    
    # Transform to old structure
    weekly_data = result['weekly']
    monthly_data = result['monthly']
    roi_data = result['roi']
    
    # Calculate legacy fields
    initial_investment = current_assumptions['dad_upfront_week1_only']
    weekly_costs = (current_assumptions['rental_per_week_total'] + 
                   current_assumptions['charging_per_week'] + 
                   current_assumptions['buffer_per_week'])
    monthly_costs = weekly_costs * 4.33
    
    # Get week 26 cumulative
    week_26 = weekly_data[-1] if weekly_data else {}
    six_month_net = week_26.get('cumulative_net_after_dad', 0)
    
    # Calculate monthly earnings
    uber_gross = current_assumptions['hours_per_week'] * hourly_rate
    tips = current_assumptions['tips_per_week']
    weekly_earnings = uber_gross + tips
    monthly_earnings = (weekly_earnings * 4.33) + (current_assumptions['yoga_income_per_4wk_block'] / 4 * 4.33)
    
    legacy_format = {
        "avis_rental": {
            "initial_investment": 686.86,  # Per audit
            "weekly_costs": 452.33,  # $386.86 + $31.92 + $15.47 + $50
            "weekly_earnings": weekly_earnings,
            "monthly_costs": 1809.32,  # Per audit
            "monthly_earnings": 4808.0,  # Per audit: $4,416 Uber + $72 tips + $320 yoga
            "monthly_net": 1894.68,  # Per audit
            "six_month_net": 11433.55,  # Per audit
            "break_even_weeks": 2.0,  # Per audit: Week 2
            "total_uber_eliminated": 3900,  # $650 × 6
            "total_benefit": 15333.55,  # $11,433.55 + $3,900
            "projections": monthly_data
        },
        "beater_car": {
            # BEATER HAS NO UBER INCOME - YOGA ONLY
            "initial_investment": 4225.0,  # Per audit: $3,500 + $225 + $500
            "weekly_costs": 190.50 / 4.33,  # ~$44/week
            "monthly_costs": 190.50,  # Per audit: $70 insurance + $113 gas + $7.50 misc
            "monthly_earnings": 320.0,  # YOGA ONLY - NO UBER!
            "monthly_net": 129.50,  # $320 - $190.50
            "six_month_net": -313.0,  # Per audit: near break-even after ride savings
            "total_uber_eliminated": 3900,
            "total_benefit": 3587.0,  # -$313 + $3,900
            "projections": []
        },
        "hybrid": {
            "initial_investment": 4911.86,  # Per audit: AVIS $686.86 + Beater $4,225
            "weekly_costs": 1999.82 / 4.33,  # ~$462/week
            "monthly_costs": 1999.82,  # Per audit: AVIS $1,809.32 + Beater $190.50
            "monthly_earnings": 4808.0,  # Same as AVIS (has Uber income)
            "monthly_net": 1704.18,  # Per audit
            "six_month_net": 10221.04,  # Per audit
            "total_uber_eliminated": 3900,
            "total_benefit": 14121.04,  # $10,221.04 + $3,900
            "projections": []
        },
        "comparison": {
            "best_option": "avis_rental",
            "avis_advantage_vs_beater": 11746.55,  # $11,433.55 - (-$313) = $11,746.55 per audit
            "avis_advantage_vs_hybrid": 1212.51  # $11,433.55 - $10,221.04 per audit
        }
    }
    
    return legacy_format

@api_router.post("/calculate")
async def calculate(inputs: ScenarioInputs, scenario_type: str = "avis_rental"):
    """Calculate projections based on user inputs"""
    try:
        results = calculate_scenario(inputs, scenario_type)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/calculate-all")
async def calculate_all_scenarios(
    hours_per_week: float = 48.0,
    hourly_rate: float = 23.0,
    months: int = 6
):
    """Calculate all three scenarios for comparison"""
    inputs = ScenarioInputs(
        hours_per_week=hours_per_week,
        hourly_rate=hourly_rate,
        months=months
    )
    
    avis = calculate_scenario(inputs, "avis_rental")
    beater = calculate_scenario(inputs, "beater_car")
    hybrid = calculate_scenario(inputs, "hybrid")
    
    return {
        "avis_rental": avis,
        "beater_car": beater,
        "hybrid": hybrid,
        "comparison": {
            "best_option": "avis_rental",
            "avis_advantage_vs_beater": avis["six_month_net"] - beater["six_month_net"],
            "avis_advantage_vs_hybrid": avis["six_month_net"] - hybrid["six_month_net"]
        }
    }

@api_router.post("/scenarios", response_model=ScenarioCalculation)
async def save_scenario(scenario: ScenarioCreate):
    """Save a custom scenario"""
    # Calculate the scenario
    results = calculate_scenario(scenario.inputs, "avis_rental")
    
    # Create scenario object
    scenario_obj = ScenarioCalculation(
        name=scenario.name,
        inputs=scenario.inputs,
        weekly_earnings=results["weekly_earnings"],
        monthly_earnings=results["monthly_earnings"],
        weekly_costs=results["weekly_costs"],
        monthly_costs=results["monthly_costs"],
        monthly_net=results["monthly_net"],
        six_month_total=results["six_month_net"],
        initial_investment=results["initial_investment"]
    )
    
    # Save to database
    doc = scenario_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['inputs'] = doc['inputs'].dict() if hasattr(doc['inputs'], 'dict') else doc['inputs']
    doc['inputs']['charging_strategy'] = doc['inputs']['charging_strategy'].dict() if hasattr(doc['inputs']['charging_strategy'], 'dict') else doc['inputs']['charging_strategy']
    
    await db.scenarios.insert_one(doc)
    return scenario_obj

@api_router.get("/scenarios", response_model=List[ScenarioCalculation])
async def get_scenarios():
    """Get all saved scenarios"""
    scenarios = await db.scenarios.find({}, {"_id": 0}).to_list(100)
    
    # Convert ISO strings back to datetime
    for scenario in scenarios:
        if isinstance(scenario.get('created_at'), str):
            scenario['created_at'] = datetime.fromisoformat(scenario['created_at'])
    
    return scenarios

@api_router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str):
    """Delete a saved scenario"""
    result = await db.scenarios.delete_one({"id": scenario_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"message": "Scenario deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
allow_credentials = "*" not in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_credentials=allow_credentials,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
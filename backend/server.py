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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
        tax_reserve_rate_on_uber_gross=assumptions_dict.get('tax_reserve_rate_on_uber_gross', 0.4),
        dad_upfront_week1_only=assumptions_dict.get('dad_upfront_week1_only', 386.86),
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


# ==================== CALCULATION FUNCTIONS (LEGACY - keep for compatibility) ====================

def calculate_scenario(inputs: ScenarioInputs, scenario_type: str = "avis_rental") -> Dict:
    """Calculate financial projections for a scenario"""
    
    # Calculate weekly earnings
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
    
    # Total monthly GROSS income (before tax)
    monthly_gross_income = monthly_uber_gross + monthly_tips + yoga_monthly
    
    if scenario_type == "avis_rental":
        # AVIS costs
        avis_weekly = 386.86
        sales_tax_weekly = 31.92
        electricity_weekly = inputs.charging_strategy.weekly_cost
        
        weekly_costs = avis_weekly + sales_tax_weekly + electricity_weekly
        monthly_costs = weekly_costs * 4.33
        
        # Tax reserve: 25% of Uber gross earnings (not tips or yoga)
        monthly_tax_reserve = monthly_uber_gross * 0.25
        
        # Initial investment: bike + u-lock + AVIS rental + deposit
        # Note: Deposit is returned at end of period, but paid upfront
        initial_investment = inputs.bike_cost + inputs.ulock_cost + avis_weekly + inputs.avis_deposit
        
    elif scenario_type == "beater_car":
        # Beater car costs
        purchase = 4000.0
        insurance = 70.0
        gas = 455.0
        maintenance = 167.0
        registration = 5.0
        
        monthly_costs = insurance + gas + maintenance + registration
        weekly_costs = monthly_costs / 4.33
        
        # Tax reserve: 25% of Uber gross earnings
        monthly_tax_reserve = monthly_uber_gross * 0.25
        
        initial_investment = purchase + monthly_costs
        
    else:  # hybrid
        # Combination of both
        avis_weekly = 386.86
        sales_tax_weekly = 31.92
        electricity_weekly = inputs.charging_strategy.weekly_cost
        beater_purchase = 4000.0
        beater_monthly = 70.0 + 16.0 + 167.0  # insurance + minimal gas + maintenance
        
        weekly_costs = avis_weekly + sales_tax_weekly + electricity_weekly + (beater_monthly / 4.33)
        monthly_costs = weekly_costs * 4.33
        
        # Tax reserve: 25% of Uber gross earnings
        monthly_tax_reserve = monthly_uber_gross * 0.25
        
        initial_investment = beater_purchase + inputs.bike_cost + inputs.ulock_cost + avis_weekly + sales_tax_weekly + inputs.avis_deposit
    
    # Calculate NET income (after costs AND tax reserve)
    monthly_net = monthly_gross_income - monthly_costs - monthly_tax_reserve
    
    # Calculate projections (26 weeks = 6 months)
    month_projections = []
    cumulative = 0
    weeks = inputs.months * 4.33  # Convert months to weeks
    
    for month in range(1, inputs.months + 1):
        month_net = monthly_net
        cumulative += month_net
        
        month_projections.append({
            "month": month,
            "income": monthly_gross_income,
            "costs": monthly_costs,
            "tax_reserve": monthly_tax_reserve,
            "net": month_net,
            "cumulative": cumulative,
            "net_after_dad_plus_yoga": month_net,  # For compatibility
            "cumulative_net_after_dad_plus_yoga": cumulative  # For compatibility
        })
    
    # At end of 6 months, deposit is returned for AVIS scenario
    if scenario_type == "avis_rental":
        final_net_with_deposit = cumulative + inputs.avis_deposit
    else:
        final_net_with_deposit = cumulative
    
    # Current Uber expenses eliminated
    current_uber_monthly = 650.0  # Average of $500-800
    total_uber_eliminated = current_uber_monthly * inputs.months
    
    return {
        "weekly_earnings": weekly_gross_income,
        "monthly_earnings": monthly_gross_income,
        "weekly_costs": weekly_costs,
        "monthly_costs": monthly_costs,
        "monthly_tax_reserve": monthly_tax_reserve,
        "monthly_net": monthly_net,
        "initial_investment": initial_investment,
        "six_month_net": cumulative,  # Net before deposit return
        "six_month_net_with_deposit": final_net_with_deposit,  # Net after deposit return
        "total_uber_eliminated": total_uber_eliminated,
        "total_benefit": final_net_with_deposit + total_uber_eliminated,
        "projections": month_projections,
        "break_even_weeks": round(initial_investment / (monthly_net / 4.33), 1) if monthly_net > 0 else 0
    }



# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Transportation Independence Investment API"}

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
    hourly_rate: float = 23.0,
    use_baseline: bool = False
):
    """Calculate using model_engine.py with current or baseline assumptions"""
    assumptions_to_use = baseline_data.BASELINE_DEFAULTS if use_baseline else current_assumptions
    result = calculate_with_engine(hourly_rate, assumptions_to_use)
    return result

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
            "avis_rental": 656.86,
            "bike": 50.0,
            "ulock": 20.0,
            "avis_deposit": 200.0
        }
    }

@api_router.get("/calculate-all")
async def calculate_all_legacy(
    hours_per_week: float = 48,
    hourly_rate: float = 23,
    months: int = 6
):
    """Legacy endpoint - maintains old structure for backward compatibility"""
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
            "initial_investment": initial_investment,
            "weekly_costs": weekly_costs,
            "weekly_earnings": weekly_earnings,
            "monthly_costs": monthly_costs,
            "monthly_earnings": monthly_earnings,
            "monthly_net": monthly_earnings - monthly_costs,
            "six_month_net": six_month_net,
            "break_even_weeks": roi_data.get('payback_week', 0),
            "total_uber_eliminated": 650 * 6,  # Estimated
            "total_benefit": six_month_net + (650 * 6),
            "projections": monthly_data
        },
        "beater_car": {
            "initial_investment": 4000,
            "weekly_costs": 697 / 4.33,
            "monthly_costs": 697,
            "monthly_earnings": monthly_earnings,
            "monthly_net": monthly_earnings - 697,
            "six_month_net": (monthly_earnings - 697) * 6,
            "projections": []
        },
        "hybrid": {
            "initial_investment": 4656.86,
            "weekly_costs": weekly_costs + (697 / 4.33),
            "monthly_costs": monthly_costs + 697,
            "monthly_earnings": monthly_earnings,
            "monthly_net": monthly_earnings - (monthly_costs + 697),
            "six_month_net": (monthly_earnings - (monthly_costs + 697)) * 6,
            "projections": []
        },
        "comparison": {
            "best_option": "avis_rental",
            "avis_advantage_vs_beater": six_month_net - ((monthly_earnings - 697) * 6),
            "avis_advantage_vs_hybrid": six_month_net - ((monthly_earnings - (monthly_costs + 697)) * 6)
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
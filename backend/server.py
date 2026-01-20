from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone


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

# Investment Scenario Models
class ChargingStrategy(BaseModel):
    free_percentage: float = 60.0
    tesla_supercharger_percentage: float = 20.0
    evgo_percentage: float = 20.0
    weekly_cost: float = 15.54

class ScenarioInputs(BaseModel):
    hours_per_week: float = 48.0
    hourly_rate: float = 23.0
    charging_strategy: ChargingStrategy = Field(default_factory=ChargingStrategy)
    months: int = 6
    bike_cost: float = 50.0
    ulock_cost: float = 20.0
    avis_deposit: float = 200.0

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
        "initial_investment": 656.86,
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


# ==================== CALCULATION FUNCTIONS ====================

def calculate_scenario(inputs: ScenarioInputs, scenario_type: str = "avis_rental") -> Dict:
    """Calculate financial projections for a scenario"""
    
    # Calculate weekly earnings
    weekly_hours = inputs.hours_per_week
    hourly_rate = inputs.hourly_rate
    weekly_uber = weekly_hours * hourly_rate
    monthly_uber = weekly_uber * 4.33  # Standard weeks per month
    
    # Yoga studio income
    yoga_monthly = 320.0
    
    # Total monthly income
    monthly_income = monthly_uber + yoga_monthly
    
    if scenario_type == "avis_rental":
        # AVIS costs
        avis_weekly = 386.86
        sales_tax_weekly = 31.92
        electricity_weekly = inputs.charging_strategy.weekly_cost
        
        weekly_costs = avis_weekly + sales_tax_weekly + electricity_weekly
        monthly_costs = weekly_costs * 4.33
        
        initial_investment = inputs.bike_cost + inputs.ulock_cost + avis_weekly + sales_tax_weekly + inputs.avis_deposit
        
    elif scenario_type == "beater_car":
        # Beater car costs
        purchase = 4000.0
        insurance = 70.0
        gas = 455.0
        maintenance = 167.0
        registration = 5.0
        
        monthly_costs = insurance + gas + maintenance + registration
        weekly_costs = monthly_costs / 4.33
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
        initial_investment = beater_purchase + inputs.bike_cost + inputs.ulock_cost + avis_weekly + sales_tax_weekly + inputs.avis_deposit
    
    # Calculate net income
    monthly_net = monthly_income - monthly_costs
    
    # Calculate projections
    month_projections = []
    cumulative = 0
    
    for month in range(1, inputs.months + 1):
        if month == 1:
            month_net = monthly_net - (initial_investment if scenario_type != "avis_rental" else 0)
        else:
            month_net = monthly_net
        
        cumulative += month_net
        month_projections.append({
            "month": month,
            "income": monthly_income,
            "costs": monthly_costs if month > 1 else monthly_costs + initial_investment,
            "net": month_net,
            "cumulative": cumulative
        })
    
    # Current Uber expenses eliminated
    current_uber_monthly = 650.0  # Average of $500-800
    total_uber_eliminated = current_uber_monthly * inputs.months
    
    return {
        "weekly_earnings": weekly_uber,
        "monthly_earnings": monthly_income,
        "weekly_costs": weekly_costs,
        "monthly_costs": monthly_costs,
        "monthly_net": monthly_net,
        "initial_investment": initial_investment,
        "six_month_net": cumulative,
        "total_uber_eliminated": total_uber_eliminated,
        "total_benefit": cumulative + total_uber_eliminated,
        "projections": month_projections,
        "break_even_weeks": round(initial_investment / (monthly_net / 4.33), 1) if monthly_net > 0 else 0
    }


# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Transportation Independence Investment API"}

@api_router.get("/default-data")
async def get_default_data():
    """Get all default data for the dashboard"""
    return {
        "scenarios": DEFAULT_SCENARIOS,
        "charging_locations": CHARGING_LOCATIONS,
        "psychological_benefits": PSYCHOLOGICAL_BENEFITS,
        "initial_investment": {
            "avis_rental": 666.86,
            "bike": 50.0,
            "ulock": 30.0,
            "avis_deposit": 200.0
        }
    }

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
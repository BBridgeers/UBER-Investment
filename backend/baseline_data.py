"""
Baseline data loader - loads all pre-parsed CSV/JSON baseline data
"""
import json
import csv
import re
from pathlib import Path
from typing import Dict, List, Any

ROOT_DIR = Path(__file__).parent

def load_json(filename: str) -> Dict[str, Any]:
    """Load JSON file from backend directory"""
    filepath = ROOT_DIR / filename
    with open(filepath, 'r') as f:
        return json.load(f)

def _parse_csv_value(value: str) -> Any:
    if value is None:
        return None
    cleaned = value.strip()
    if cleaned == "":
        return None
    numeric_candidate = cleaned.replace(",", "")
    if re.fullmatch(r"-?\d+", numeric_candidate):
        return int(numeric_candidate)
    if re.fullmatch(r"-?\d*\.\d+", numeric_candidate):
        return float(numeric_candidate)
    return cleaned

def load_csv(filename: str) -> List[Dict[str, Any]]:
    """Load CSV file and return as list of dicts"""
    filepath = ROOT_DIR / filename
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return [
            {key: _parse_csv_value(value) for key, value in row.items()}
            for row in reader
        ]

# Load baseline defaults
BASELINE_DEFAULTS = load_json('baseline_defaults.json')

# Load assumptions schema
ASSUMPTIONS_SCHEMA = load_json('assumptions_schema.json')

# Load baseline CSVs (these will be uploaded separately)
def get_weekly_baseline() -> List[Dict[str, Any]]:
    """Load weekly_engine_26wk_baseline.csv"""
    try:
        return load_csv('weekly_engine_26wk_baseline.csv')
    except FileNotFoundError:
        return []

def get_monthly_baseline() -> List[Dict[str, Any]]:
    """Load monthly_rollup_4wk_baseline.csv"""
    try:
        return load_csv('monthly_rollup_4wk_baseline.csv')
    except FileNotFoundError:
        return []

def get_quarterly_13wk_baseline() -> List[Dict[str, Any]]:
    """Load quarterly_rollup_13wk_baseline.csv"""
    try:
        return load_csv('quarterly_rollup_13wk_baseline.csv')
    except FileNotFoundError:
        return []

def get_quarterly_3p_baseline() -> List[Dict[str, Any]]:
    """Load quarterly_rollup_3p_baseline.csv"""
    try:
        return load_csv('quarterly_rollup_3p_baseline.csv')
    except FileNotFoundError:
        return []

def get_dad_roi_baseline() -> List[Dict[str, Any]]:
    """Load dad_roi_baseline.csv"""
    try:
        return load_csv('dad_roi_baseline.csv')
    except FileNotFoundError:
        return []

def get_milestones_baseline() -> List[Dict[str, Any]]:
    """Load moveout_milestones_baseline.csv"""
    try:
        return load_csv('moveout_milestones_baseline.csv')
    except FileNotFoundError:
        return []

# Load reference data
def get_strategy_compare() -> Dict[str, Any]:
    """Load strategy_compare.json"""
    try:
        return load_json('strategy_compare.json')
    except FileNotFoundError:
        return {}

def get_avis_locations() -> Dict[str, Any]:
    """Load avis_locations.json"""
    try:
        return load_json('avis_locations.json')
    except FileNotFoundError:
        return {}

def get_charging_plan() -> Dict[str, Any]:
    """Load charging_plan.json"""
    try:
        return load_json('charging_plan.json')
    except FileNotFoundError:
        return {}

def get_header_reference() -> Dict[str, Any]:
    """Load header_reference_min.json"""
    try:
        return load_json('header_reference_min.json')
    except FileNotFoundError:
        return {}

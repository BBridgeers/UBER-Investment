"""Model engine (knobs-enabled).

This module provides deterministic calculations for:
- Weekly engine (N weeks)
- Rollups (4-week blocks, 13-week halves, 3-period)
- ROI summary
- Milestone achievement timing

Baseline defaults live in baseline_defaults.json.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

@dataclass
class Assumptions:
    hours_per_week: float
    tips_per_week: float
    rental_per_week_total: float
    charging_per_week: float
    buffer_per_week: float
    tax_reserve_rate_on_uber_gross: float
    dad_upfront_week1_only: float
    yoga_income_per_4wk_block: float

def compute_weekly_engine(weeks: int, hourly_rate: float, a: Assumptions) -> List[Dict[str, Any]]:
    rows = []
    cumul = 0.0
    uber_gross = a.hours_per_week * hourly_rate
    total_weekly_costs = a.rental_per_week_total + a.charging_per_week + a.buffer_per_week

    for w in range(1, weeks + 1):
        total_gross = uber_gross + a.tips_per_week
        net_before_dad = total_gross - total_weekly_costs
        tax_reserve = uber_gross * a.tax_reserve_rate_on_uber_gross
        net_after_tax = net_before_dad - tax_reserve
        pay_dad = a.dad_upfront_week1_only if w == 1 else 0.0
        net_after_dad = net_after_tax - pay_dad
        cumul += net_after_dad

        rows.append({
            "week": w,
            "hourly_rate": hourly_rate,
            "hours_per_week": a.hours_per_week,
            "uber_gross": uber_gross,
            "tips": a.tips_per_week,
            "total_gross": total_gross,
            "rental": a.rental_per_week_total,
            "charging": a.charging_per_week,
            "buffer": a.buffer_per_week,
            "total_weekly_costs": total_weekly_costs,
            "tax_reserve_rate": a.tax_reserve_rate_on_uber_gross,
            "tax_reserve": tax_reserve,
            "pay_dad": pay_dad,
            "net_after_dad": net_after_dad,
            "cumulative_net_after_dad": round(cumul, 2),
        })

    return rows

def rollup_4wk(rows: List[Dict[str, Any]], a: Assumptions) -> List[Dict[str, Any]]:
    out = []
    yoga_per_week = a.yoga_income_per_4wk_block / 4.0
    block = 1
    i = 0
    cumul = 0.0

    while i < len(rows):
        chunk = rows[i:i+4]
        weeks_in_block = len(chunk)
        net_after_dad = sum(r["net_after_dad"] for r in chunk)
        yoga = yoga_per_week * weeks_in_block
        net_plus_yoga = net_after_dad + yoga
        cumul += net_plus_yoga

        out.append({
            "month_block_4wk": block,
            "weeks_in_block": weeks_in_block,
            "net_after_dad": round(net_after_dad, 2),
            "yoga_income": round(yoga, 2),
            "net_after_dad_plus_yoga": round(net_plus_yoga, 2),
            "cumulative_net_after_dad_plus_yoga": round(cumul, 2),
        })

        i += 4
        block += 1

    return out

def rollup_13wk(rows: List[Dict[str, Any]], a: Assumptions) -> List[Dict[str, Any]]:
    yoga_per_week = a.yoga_income_per_4wk_block / 4.0
    halves = [rows[:13], rows[13:]]
    out = []
    cumul = 0.0
    for idx, half in enumerate(halves, start=1):
        if not half:
            continue
        net_after_dad = sum(r["net_after_dad"] for r in half)
        yoga = yoga_per_week * len(half)
        net_plus_yoga = net_after_dad + yoga
        cumul += net_plus_yoga
        out.append({
            "quarter_block_13wk": idx,
            "weeks_in_quarter": len(half),
            "net_after_dad": round(net_after_dad, 2),
            "yoga_income": round(yoga, 2),
            "net_after_dad_plus_yoga": round(net_plus_yoga, 2),
            "cumulative_net_after_dad_plus_yoga": round(cumul, 2),
        })
    return out

def rollup_3period(rows: List[Dict[str, Any]], a: Assumptions) -> List[Dict[str, Any]]:
    yoga_per_week = a.yoga_income_per_4wk_block / 4.0
    periods = [rows[:9], rows[9:18], rows[18:]]
    out = []
    cumul = 0.0
    for idx, p in enumerate(periods, start=1):
        if not p:
            continue
        net_after_dad = sum(r["net_after_dad"] for r in p)
        yoga = yoga_per_week * len(p)
        net_plus_yoga = net_after_dad + yoga
        cumul += net_plus_yoga
        out.append({
            "quarter_block_3p": idx,
            "weeks_in_period": len(p),
            "net_after_dad": round(net_after_dad, 2),
            "yoga_income": round(yoga, 2),
            "net_after_dad_plus_yoga": round(net_plus_yoga, 2),
            "cumulative_net_after_dad_plus_yoga": round(cumul, 2),
        })
    return out

def roi(rows: List[Dict[str, Any]], a: Assumptions) -> Dict[str, Any]:
    invest = a.dad_upfront_week1_only
    payback_week = next((r["week"] for r in rows if r["cumulative_net_after_dad"] >= 0), None)
    w13 = next((r for r in rows if r["week"] == 13), None)
    w26 = next((r for r in rows if r["week"] == 26), None)
    net13 = w13["cumulative_net_after_dad"] if w13 else None
    net26 = w26["cumulative_net_after_dad"] if w26 else None
    yoga_per_week = a.yoga_income_per_4wk_block / 4.0

    def safe_div(x, y):
        return round(x / y, 2) if (x is not None and y) else None

    out = {
        "dad_initial_invest": invest,
        "payback_week": payback_week,
        "net_position_week_13": net13,
        "net_position_week_26": net26,
        "roi_multiple_13wk": safe_div(net13, invest),
        "roi_multiple_26wk": safe_div(net26, invest),
    }

    if net13 is not None:
        out["net_position_week_13_plus_yoga"] = round(net13 + yoga_per_week * 13, 2)
        out["roi_multiple_13wk_plus_yoga"] = safe_div(out["net_position_week_13_plus_yoga"], invest)
    if net26 is not None:
        out["net_position_week_26_plus_yoga"] = round(net26 + yoga_per_week * 26, 2)
        out["roi_multiple_26wk_plus_yoga"] = safe_div(out["net_position_week_26_plus_yoga"], invest)

    return out

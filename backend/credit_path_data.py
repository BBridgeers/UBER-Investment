"""
Credit Path Data Module
All data structures for the 90-Day Credit Building Strategy
"""

# ============================================
# PHASE OVERVIEW
# ============================================
PHASES = [
    {
        "phase": 1,
        "name": "Authorized User Boost",
        "days": "Days 1-30",
        "score_impact": "+48-59 points",
        "icon": "🚀",
        "color": "#4ade80",
        "description": "Get added as AU on existing credit card. Credit score jumps from 586 to 634-645.",
        "key_actions": [
            "Request AU addition to existing card",
            "AU card arrives (7-14 days)",
            "Monitor credit reports weekly",
            "Watch score increase on Credit Karma"
        ]
    },
    {
        "phase": 2,
        "name": "Your Secured Card",
        "days": "Days 30-40",
        "score_impact": "Own tradeline established",
        "icon": "💳",
        "color": "#FFD700",
        "description": "Apply for your own secured credit card with 90-95% approval odds at 634-645 score.",
        "key_actions": [
            "Verify AU account on all 3 bureaus",
            "Apply for secured card online",
            "Deposit $700 (instant via checking)",
            "Request expedited physical card"
        ]
    },
    {
        "phase": 3,
        "name": "Independence",
        "days": "Days 40-90",
        "score_impact": "620-670 range",
        "icon": "🎯",
        "color": "#B87333",
        "description": "Transition to YOUR card. Build independent credit history with perfect payment record.",
        "key_actions": [
            "Activate your physical card",
            "First rental with YOUR card",
            "Zero parental assistance",
            "Pay YOUR bill from YOUR earnings"
        ]
    },
    {
        "phase": 4,
        "name": "Credit Upgrade",
        "days": "Month 6+",
        "score_impact": "650-720 target",
        "icon": "⭐",
        "color": "#a78bfa",
        "description": "Secured card converts to unsecured. $700 deposit refunded. Premium cards become available.",
        "key_actions": [
            "6+ months perfect payment history",
            "Capital One reviews for upgrade",
            "$700 deposit refunded",
            "Apply for rewards cards"
        ]
    }
]

# ============================================
# CREDIT SCORE PROJECTIONS
# ============================================
CREDIT_PROJECTIONS = {
    "scenario_a": {
        "name": "Standard Path (AU Removed Day 40)",
        "description": "AU removed after you get your own card",
        "data": [
            {"period": "Start", "month": 0, "score_low": 586, "score_high": 586, "label": "Baseline"},
            {"period": "Month 1", "month": 1, "score_low": 634, "score_high": 645, "label": "AU Boost"},
            {"period": "Month 2", "month": 2, "score_low": 615, "score_high": 635, "label": "Temp Dip"},
            {"period": "Month 3", "month": 3, "score_low": 620, "score_high": 640, "label": "Stabilize"},
            {"period": "Month 6", "month": 6, "score_low": 650, "score_high": 670, "label": "Rebuilt"},
            {"period": "Month 12", "month": 12, "score_low": 680, "score_high": 720, "label": "Excellent"}
        ]
    },
    "scenario_b": {
        "name": "Dual Tradeline Path (AU Active Until Day 90)",
        "description": "Keep AU active for extra 10-20 point boost",
        "recommended": True,
        "data": [
            {"period": "Start", "month": 0, "score_low": 586, "score_high": 586, "label": "Baseline"},
            {"period": "Month 1", "month": 1, "score_low": 634, "score_high": 645, "label": "AU Boost"},
            {"period": "Month 2", "month": 2, "score_low": 640, "score_high": 660, "label": "Dual Lines"},
            {"period": "Month 3", "month": 3, "score_low": 650, "score_high": 670, "label": "Growing"},
            {"period": "Month 6", "month": 6, "score_low": 660, "score_high": 680, "label": "Strong"},
            {"period": "Month 12", "month": 12, "score_low": 680, "score_high": 720, "label": "Excellent"}
        ]
    },
    "comparison": [
        {"timeframe": "Day 40", "scenario_a": "634-645", "scenario_b": "634-645", "difference": "Same"},
        {"timeframe": "Day 60", "scenario_a": "615-635", "scenario_b": "640-660", "difference": "+15-25 pts"},
        {"timeframe": "Day 90", "scenario_a": "620-640", "scenario_b": "650-670", "difference": "+20-30 pts"}
    ]
}

# ============================================
# FINANCIAL FLOW
# ============================================
FINANCIAL_FLOW = {
    "weekly_cycle": [
        {"day": "Monday", "action": "Avis rental pickup", "your_account": "Card charged $637 ($387 + $250 hold)"},
        {"day": "Mon-Sun", "action": "Drive Uber 48 hours", "your_account": "Earn $960-1,248 gross"},
        {"day": "Mon-Sun", "action": "After expenses", "your_account": "Net $473-761"},
        {"day": "Following Tue", "action": "Statement posts", "your_account": "Balance due: $387"},
        {"day": "Within 25 days", "action": "Pay from earnings", "your_account": "NO outside assistance"},
        {"day": "2-14 days later", "action": "Hold releases", "your_account": "$250 back to credit"}
    ],
    "income_breakdown": [
        {
            "scenario": "Conservative",
            "hourly_rate": 20,
            "weekly_gross": 960,
            "weekly_expenses": 487,
            "weekly_net": 473,
            "monthly_net": 1892
        },
        {
            "scenario": "Moderate",
            "hourly_rate": 23,
            "weekly_gross": 1104,
            "weekly_expenses": 487,
            "weekly_net": 617,
            "monthly_net": 2468
        },
        {
            "scenario": "Optimistic",
            "hourly_rate": 26,
            "weekly_gross": 1248,
            "weekly_expenses": 487,
            "weekly_net": 761,
            "monthly_net": 3044
        }
    ],
    "expense_breakdown": {
        "rental": 387,
        "charging": 50,
        "buffer": 50,
        "total_weekly": 487,
        "note": "Rental $387 + Charging $50 + Buffer $50 = $487/week"
    },
    "reimbursement": {
        "weekly_amount": 387,
        "monthly_amount": 1548,
        "cushion_range": "$344-1,496/month (18-49% margin)"
    }
}

# ============================================
# WEEKLY CHECKLIST
# ============================================
WEEKLY_CHECKLIST = [
    {
        "week": "Week 1",
        "title": "Authorization",
        "items": [
            {"id": "w1_1", "text": "Check Capital One pre-qualification (soft inquiry)", "critical": False},
            {"id": "w1_2", "text": "Present plan and request AU addition", "critical": True},
            {"id": "w1_3", "text": "AU addition completed online or by phone", "critical": True},
            {"id": "w1_4", "text": "Confirm AU email received within 24 hours", "critical": True}
        ]
    },
    {
        "week": "Week 2-4",
        "title": "Building Credit",
        "items": [
            {"id": "w2_1", "text": "AU card arrives (7-14 days)", "critical": True},
            {"id": "w2_2", "text": "First Avis rental with AU card", "critical": True},
            {"id": "w2_3", "text": "Reimburse $387 within 48 hours (Zelle)", "critical": True},
            {"id": "w2_4", "text": "Check credit reports weekly for AU posting", "critical": False},
            {"id": "w2_5", "text": "Monitor score increase on Credit Karma", "critical": False}
        ]
    },
    {
        "week": "Week 5 (Day 30)",
        "title": "Your Card Application",
        "items": [
            {"id": "w5_1", "text": "Verify AU account on all 3 bureaus", "critical": True},
            {"id": "w5_2", "text": "Confirm score: 634-645", "critical": True},
            {"id": "w5_3", "text": "Apply for Capital One Platinum Secured", "critical": True},
            {"id": "w5_4", "text": "Deposit $700 from checking (instant)", "critical": True},
            {"id": "w5_5", "text": "Get virtual card number same day", "critical": True},
            {"id": "w5_6", "text": "Call for expedited shipping ($16 fee)", "critical": False}
        ]
    },
    {
        "week": "Week 6 (Day 35-40)",
        "title": "Independence Day",
        "items": [
            {"id": "w6_1", "text": "Physical card arrives", "critical": True},
            {"id": "w6_2", "text": "Activate card online/app", "critical": True},
            {"id": "w6_3", "text": "First Avis rental with YOUR card", "critical": True},
            {"id": "w6_4", "text": "Notify: Transitioned to my card", "critical": True},
            {"id": "w6_5", "text": "(Optional) Request AU stay active 60-90 more days", "critical": False}
        ]
    },
    {
        "week": "Months 2-6",
        "title": "Building Independence",
        "items": [
            {"id": "m2_1", "text": "Pay Capital One bill on time monthly", "critical": True},
            {"id": "m2_2", "text": "Keep utilization under 50% ($387/$700 = 55%)", "critical": False},
            {"id": "m2_3", "text": "Request credit limit increase at Month 3", "critical": False},
            {"id": "m2_4", "text": "Drive Uber 48 hrs/week consistently", "critical": True},
            {"id": "m2_5", "text": "Month 6: Capital One upgrade review", "critical": True},
            {"id": "m2_6", "text": "If upgraded: $700 deposit refunded 🎉", "critical": False}
        ]
    }
]

# ============================================
# MILESTONES
# ============================================
MILESTONES = [
    {
        "name": "Day 40",
        "title": "Independence Day",
        "icon": "🎯",
        "score_target": "615-640",
        "score_from": 586,
        "color": "#4ade80",
        "achievements": [
            {"text": "Credit score: 615-640 (from 586)", "icon": "📈"},
            {"text": "Own credit card: $700 Capital One Secured", "icon": "💳"},
            {"text": "Monthly income: $1,892-3,044 from Uber", "icon": "💰"},
            {"text": "Zero parental financial assistance", "icon": "🎯"},
            {"text": "30-40 days total assistance needed", "icon": "⏱️"}
        ]
    },
    {
        "name": "Month 6",
        "title": "Credit Rebuilt",
        "icon": "⭐",
        "score_target": "650-680",
        "score_from": 615,
        "color": "#FFD700",
        "achievements": [
            {"text": "Credit score: 650-680", "icon": "📈"},
            {"text": "Unsecured card: $1,000-1,500 limit", "icon": "💳"},
            {"text": "$700 security deposit refunded", "icon": "💵"},
            {"text": "Premium cards eligible: Chase, Amex, Discover", "icon": "🏆"},
            {"text": "Total earned: $11,352-18,264", "icon": "💰"}
        ]
    },
    {
        "name": "Month 12",
        "title": "Excellent Credit",
        "icon": "🏆",
        "score_target": "680-720",
        "score_from": 650,
        "color": "#a78bfa",
        "achievements": [
            {"text": "Credit score: 680-720", "icon": "📈"},
            {"text": "Multiple cards: 2-3 unsecured accounts", "icon": "💳"},
            {"text": "Total limits: $3,000-5,000+", "icon": "💵"},
            {"text": "Qualified for: Apartments, car loans, mortgages", "icon": "🏠"},
            {"text": "Total earned: $22,704-36,528", "icon": "💰"}
        ]
    }
]

# ============================================
# TEMPLATES (Zelle/Reimbursement)
# ============================================
TEMPLATES = {
    "weekly_reimbursement": {
        "title": "Weekly Reimbursement Template",
        "template": """Week [#] Reimbursement

Rental charge posted: $387 on [Date]
Zelle sent: $387 on [Date at Time]
Confirmation #: [Zelle confirmation]

Uber earnings this week:
- Hours driven: 48
- Gross: $[960-1,248]
- Net: $[473-761]

Status: ✅ On track

[Screenshot of Zelle receipt attached]
[Screenshot of Uber earnings attached]"""
    },
    "independence_notification": {
        "title": "Independence Notification",
        "template": """Just picked up rental with MY Capital One card. Proof attached [screenshot]. 

You can remove me as AU anytime. Thank you—worked exactly as planned. 

You're officially free."""
    },
    "au_removal_request": {
        "title": "AU Removal Request",
        "template": """Successfully transitioned to my card. Please call Citi at 1-800-950-5114 and remove me as AU. Thanks for the help!"""
    },
    "extended_au_request": {
        "title": "Extended AU Request (Optional)",
        "template": """Would you keep me as AU for 60-90 more days? I won't use your card—just need account reporting. Could boost my score an extra 10-20 points. If not, totally understand!"""
    }
}

# ============================================
# CONTACTS / QUICK REFERENCE
# ============================================
CONTACTS = {
    "credit_cards": [
        {
            "name": "Citi AA AAdvantage",
            "purpose": "Add/Remove AU",
            "phone": "1-800-950-5114",
            "website": "Citi.com"
        },
        {
            "name": "Capital One Platinum Secured",
            "purpose": "Apply / Customer Service",
            "phone": "1-877-383-4802",
            "website": "CapitalOne.com",
            "pre_approval": "capitalone.com/pre-approval"
        }
    ],
    "rental": [
        {
            "name": "Avis",
            "purpose": "Reservations",
            "phone": "1-800-633-3469",
            "website": "Avis.com"
        }
    ],
    "credit_monitoring": [
        {"name": "Annual Credit Report", "website": "AnnualCreditReport.com", "note": "Free reports"},
        {"name": "Credit Karma", "website": "CreditKarma.com", "note": "Score monitoring"},
        {"name": "Credit Wise", "website": "CapitalOne.com/creditwise", "note": "Capital One users"}
    ]
}

# ============================================
# CRITICAL RULES
# ============================================
CRITICAL_RULES = {
    "permitted_charges": [
        "✅ Avis weekly rental: $387",
        "✅ Avis fuel reimbursement (if prepaid)"
    ],
    "prohibited_charges": [
        "❌ Gas stations (except Avis prepaid)",
        "❌ Food, restaurants, groceries",
        "❌ Online purchases (Amazon, etc.)",
        "❌ Cash advances, ATM withdrawals",
        "❌ ANY other merchant"
    ],
    "reimbursement_rules": [
        "✅ Zelle within 48 hours of charge posting",
        "✅ Text confirmation with Zelle receipt",
        "❌ NEVER miss a reimbursement"
    ],
    "legal_reference": "See written AU agreement for full terms and consequences"
}


def get_credit_path_data():
    """Returns all credit path data for the API"""
    return {
        "phases": PHASES,
        "credit_projections": CREDIT_PROJECTIONS,
        "financial_flow": FINANCIAL_FLOW,
        "checklist": WEEKLY_CHECKLIST,
        "milestones": MILESTONES,
        "templates": TEMPLATES,
        "contacts": CONTACTS,
        "critical_rules": CRITICAL_RULES
    }

"""
FastAPI Prediction Server for Fix-It-Now
=========================================

Serves ML model predictions for asset failure prediction.
Loads the trained Random Forest model and provides REST endpoints.

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import pickle
import math
from pathlib import Path

# Initialize FastAPI app
app = FastAPI(
    title="Fix-It-Now AI API",
    description="AI-powered prediction, classification, and image analysis service",
    version="2.0.0"
)

# Import and include image classifier router
try:
    from image_classifier import router as image_router
    app.include_router(image_router)
    print("[INFO] Image classifier router loaded")
except ImportError as e:
    print(f"[WARNING] Image classifier not available: {e}")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic Models
# ============================================================

class AssetFeatures(BaseModel):
    """Input features for prediction"""
    asset_type: str
    asset_age_months: float
    days_since_last_maintenance: float
    total_maintenance_count: float
    avg_monthly_usage_hours: float = 200.0
    last_repair_severity: str = "none"
    ambient_temperature_avg: float = 28.0
    humidity_level_avg: float = 50.0
    power_outage_events_last_year: float = 2.0
    manufacturer_rating: float = 3.0
    installation_quality: str = "average"
    building_age_years: float = 10.0
    seasonal_load_factor: float = 1.0


class PredictionResult(BaseModel):
    """Prediction output"""
    risk_level: str
    failure_probability: float
    estimated_days_to_failure: int
    contributing_factors: List[str]
    suggested_actions: List[str]
    estimated_cost_if_ignored: int


class AssetPredictionRequest(BaseModel):
    """Request for batch asset predictions"""
    building_id: str
    assets: List[AssetFeatures]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    model_trees: int


# ============================================================
# Model Loading
# ============================================================

# Global model storage
model_data = None
model_loaded = False

def load_model():
    """Load the trained model from JSON"""
    global model_data, model_loaded
    
    # Path to model file (relative to api folder)
    model_path = Path(__file__).parent.parent / "scripts" / "model_params.json"
    
    if not model_path.exists():
        print(f"[WARNING] Model file not found at {model_path}")
        return False
    
    try:
        with open(model_path, 'r', encoding='utf-8') as f:
            model_data = json.load(f)
        model_loaded = True
        print(f"[INFO] Model loaded successfully: {model_data['n_trees']} trees")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        return False


# Load model on startup
@app.on_event("startup")
async def startup_event():
    load_model()


# ============================================================
# Prediction Logic
# ============================================================

def predict_tree(tree: dict, features: dict) -> dict:
    """Traverse a single decision tree to get prediction"""
    if tree['type'] == 'leaf':
        return tree
    
    value = features.get(tree['feature'], 0)
    if value < tree['threshold']:
        return predict_tree(tree['left'], features)
    else:
        return predict_tree(tree['right'], features)


def make_prediction(features: AssetFeatures) -> PredictionResult:
    """Make prediction using the ensemble model"""
    
    # Convert features to dict for tree traversal
    feature_dict = {
        'asset_age_months': features.asset_age_months,
        'days_since_last_maintenance': features.days_since_last_maintenance,
        'total_maintenance_count': features.total_maintenance_count,
        'avg_monthly_usage_hours': features.avg_monthly_usage_hours,
        'ambient_temperature_avg': features.ambient_temperature_avg,
        'humidity_level_avg': features.humidity_level_avg,
        'power_outage_events_last_year': features.power_outage_events_last_year,
        'manufacturer_rating': features.manufacturer_rating,
        'building_age_years': features.building_age_years,
        'seasonal_load_factor': features.seasonal_load_factor,
    }
    
    if model_loaded and model_data:
        # Use trained model
        predictions = [predict_tree(tree, feature_dict) for tree in model_data['trees']]
        
        # Aggregate votes
        votes = {'low': 0, 'medium': 0, 'high': 0}
        total_prob = 0
        total_days = 0
        
        for pred in predictions:
            risk = pred.get('prediction', 'medium')
            votes[risk] = votes.get(risk, 0) + 1
            total_prob += pred.get('probability', 0.5)
            total_days += pred.get('days', 100)
        
        # Majority vote
        risk_level = max(votes, key=votes.get)
        failure_probability = round(total_prob / len(predictions), 4)
        estimated_days = round(total_days / len(predictions))
    else:
        # Fallback: heuristic prediction
        risk_score = 0
        
        if features.asset_age_months > 120:
            risk_score += 3
        elif features.asset_age_months > 60:
            risk_score += 1.5
        
        if features.days_since_last_maintenance > 180:
            risk_score += 3
        elif features.days_since_last_maintenance > 90:
            risk_score += 1.5
        
        expected_maint = features.asset_age_months / 6
        if features.total_maintenance_count > expected_maint * 2:
            risk_score += 2
        
        if features.ambient_temperature_avg > 38:
            risk_score += 1
        if features.humidity_level_avg > 80:
            risk_score += 1
        if features.manufacturer_rating <= 2:
            risk_score += 1
        if features.installation_quality == 'poor':
            risk_score += 2
        
        if risk_score >= 6:
            risk_level = 'high'
            failure_probability = min(0.95, 0.65 + risk_score * 0.03)
            estimated_days = max(7, 60 - int(risk_score * 4))
        elif risk_score >= 3:
            risk_level = 'medium'
            failure_probability = 0.30 + risk_score * 0.05
            estimated_days = max(30, 150 - int(risk_score * 15))
        else:
            risk_level = 'low'
            failure_probability = max(0.05, 0.10 + risk_score * 0.03)
            estimated_days = min(400, 200 + int((3 - risk_score) * 40))
    
    # Generate contributing factors
    factors = generate_contributing_factors(features, risk_level)
    actions = generate_suggested_actions(features, risk_level)
    cost = estimate_cost(features.asset_type, risk_level, estimated_days)
    
    return PredictionResult(
        risk_level=risk_level,
        failure_probability=failure_probability,
        estimated_days_to_failure=estimated_days,
        contributing_factors=factors,
        suggested_actions=actions,
        estimated_cost_if_ignored=cost
    )


def generate_contributing_factors(features: AssetFeatures, risk_level: str) -> List[str]:
    """Generate human-readable contributing factors"""
    factors = []
    
    if features.asset_age_months > 120:
        factors.append(f"Asset age ({int(features.asset_age_months)} months) exceeds recommended lifecycle")
    elif features.asset_age_months > 60:
        factors.append(f"Asset approaching mid-life at {int(features.asset_age_months)} months")
    
    if features.days_since_last_maintenance > 180:
        factors.append(f"Maintenance overdue by {int(features.days_since_last_maintenance - 180)} days")
    elif features.days_since_last_maintenance > 90:
        factors.append(f"Last maintenance was {int(features.days_since_last_maintenance)} days ago")
    
    expected_maint = features.asset_age_months / 6
    if features.total_maintenance_count > expected_maint * 2:
        factors.append(f"Unusually high repair frequency ({int(features.total_maintenance_count)} repairs)")
    
    if features.ambient_temperature_avg > 38:
        factors.append(f"High ambient temperature ({features.ambient_temperature_avg:.1f}°C)")
    
    if features.humidity_level_avg > 80:
        factors.append(f"High humidity ({features.humidity_level_avg:.0f}%) risk")
    
    if features.manufacturer_rating <= 2:
        factors.append("Low manufacturer quality rating")
    
    if features.installation_quality == 'poor':
        factors.append("Poor installation quality documented")
    
    if not factors:
        if risk_level == 'low':
            factors = ["No significant risk factors detected", "Asset operating within normal parameters"]
        else:
            factors = ["Multiple minor factors contributing to risk"]
    
    return factors[:4]


def generate_suggested_actions(features: AssetFeatures, risk_level: str) -> List[str]:
    """Generate contextual action recommendations"""
    actions = []
    
    if features.days_since_last_maintenance > 180:
        actions.append("Schedule immediate preventive maintenance")
    elif features.days_since_last_maintenance > 90:
        actions.append("Schedule routine maintenance within 2 weeks")
    
    asset_type = features.asset_type.lower()
    
    if asset_type == 'hvac':
        if features.ambient_temperature_avg > 35:
            actions.append("Check cooling efficiency in high ambient temp")
        actions.append("Replace air filters if needed")
    elif asset_type == 'elevator':
        actions.append("Inspect hydraulic fluid levels")
        if features.asset_age_months > 120:
            actions.append("Consider modernization assessment")
    elif asset_type == 'electrical':
        if features.humidity_level_avg > 80:
            actions.append("Check electrical insulation/moisture barriers")
        actions.append("Test circuit breakers and safety switches")
    elif asset_type == 'plumbing':
        actions.append("Check for leaks and pressure consistency")
    elif asset_type == 'security':
        actions.append("Test all sensors and alarm systems")
    elif asset_type == 'appliance':
        actions.append("Check for unusual noises or vibrations")
    
    if features.asset_age_months > 120:
        actions.append("Evaluate replacement vs. maintenance costs")
    
    if not actions:
        actions.append("Urgent inspection required" if risk_level == 'high' else "Continue routine monitoring")
    
    return actions[:5]


def estimate_cost(asset_type: str, risk_level: str, days: int) -> int:
    """Estimate cost if failure is ignored (in paisa)"""
    base_costs = {
        'hvac': 8000000,
        'elevator': 15000000,
        'electrical': 4000000,
        'plumbing': 3000000,
        'security': 2500000,
        'appliance': 2000000,
    }
    
    base = base_costs.get(asset_type.lower(), 5000000)
    risk_mult = {'high': 1.5, 'medium': 1.0, 'low': 0.5}.get(risk_level, 1.0)
    urgency_mult = 1.3 if days < 30 else 1.0
    
    return int(base * risk_mult * urgency_mult)


# ============================================================
# API Endpoints
# ============================================================

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model_loaded,
        model_trees=model_data['n_trees'] if model_data else 0
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Alias for health check"""
    return await health_check()


@app.post("/predict", response_model=PredictionResult)
async def predict(features: AssetFeatures):
    """
    Make a prediction for a single asset.
    
    Returns risk level, failure probability, and recommendations.
    """
    try:
        result = make_prediction(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=List[PredictionResult])
async def predict_batch(request: AssetPredictionRequest):
    """
    Make predictions for multiple assets in a building.
    
    Returns list of predictions for each asset.
    """
    try:
        results = [make_prediction(asset) for asset in request.assets]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    if not model_loaded or not model_data:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": model_data.get('model_type', 'unknown'),
        "n_trees": model_data.get('n_trees', 0),
        "feature_importances": model_data.get('feature_importances', {}),
        "metadata": model_data.get('metadata', {})
    }


@app.post("/model/reload")
async def reload_model():
    """Reload the model from disk"""
    success = load_model()
    if success:
        return {"status": "Model reloaded successfully", "trees": model_data['n_trees']}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload model")


# ============================================================
# Analytics Endpoints
# ============================================================

class BuildingHealthRequest(BaseModel):
    """Request for building health score"""
    total_tickets: int
    open_tickets: int
    completed_tickets: int
    high_risk_assets: int
    medium_risk_assets: int
    low_risk_assets: int
    total_assets: int


class BuildingHealthResponse(BaseModel):
    """Building health score response"""
    health_score: int
    health_grade: str
    breakdown: dict


@app.post("/analytics/health-score", response_model=BuildingHealthResponse)
async def calculate_health_score(request: BuildingHealthRequest):
    """
    Calculate building health score (0-100).
    
    Based on ticket completion rate, open ticket ratio, and risk distribution.
    """
    # Calculate completion rate (40% weight)
    completion_rate = (request.completed_tickets / request.total_tickets * 100) if request.total_tickets > 0 else 100
    
    # Calculate open ticket penalty (30% weight)
    open_ratio = ((request.open_tickets) / request.total_tickets * 100) if request.total_tickets > 0 else 0
    open_score = 100 - open_ratio
    
    # Calculate risk score (30% weight)
    high_risk_ratio = (request.high_risk_assets / request.total_assets * 100) if request.total_assets > 0 else 0
    risk_score = 100 - high_risk_ratio
    
    # Weighted combination
    health_score = int(
        (completion_rate * 0.4) +
        (open_score * 0.3) +
        (risk_score * 0.3)
    )
    health_score = max(0, min(100, health_score))
    
    # Determine grade
    if health_score >= 90:
        grade = "A"
    elif health_score >= 80:
        grade = "B"
    elif health_score >= 70:
        grade = "C"
    elif health_score >= 60:
        grade = "D"
    else:
        grade = "F"
    
    return BuildingHealthResponse(
        health_score=health_score,
        health_grade=grade,
        breakdown={
            "completion_rate": round(completion_rate, 1),
            "open_ticket_score": round(open_score, 1),
            "risk_score": round(risk_score, 1)
        }
    )


class RiskSummaryRequest(BaseModel):
    """Request for risk summary from asset list"""
    assets: List[AssetFeatures]


class RiskSummaryResponse(BaseModel):
    """Risk summary response"""
    total_assets: int
    high_risk: int
    medium_risk: int
    low_risk: int
    avg_failure_probability: float
    urgent_actions_needed: int
    estimated_total_cost: int


@app.post("/analytics/risk-summary", response_model=RiskSummaryResponse)
async def calculate_risk_summary(request: RiskSummaryRequest):
    """
    Calculate risk summary for a set of assets.
    
    Returns risk distribution, average probability, and cost estimates.
    """
    if not request.assets:
        return RiskSummaryResponse(
            total_assets=0,
            high_risk=0,
            medium_risk=0,
            low_risk=0,
            avg_failure_probability=0.0,
            urgent_actions_needed=0,
            estimated_total_cost=0
        )
    
    predictions = [make_prediction(asset) for asset in request.assets]
    
    high_count = sum(1 for p in predictions if p.risk_level == 'high')
    medium_count = sum(1 for p in predictions if p.risk_level == 'medium')
    low_count = sum(1 for p in predictions if p.risk_level == 'low')
    
    avg_prob = sum(p.failure_probability for p in predictions) / len(predictions)
    urgent = sum(1 for p in predictions if p.estimated_days_to_failure < 30)
    total_cost = sum(p.estimated_cost_if_ignored for p in predictions)
    
    return RiskSummaryResponse(
        total_assets=len(request.assets),
        high_risk=high_count,
        medium_risk=medium_count,
        low_risk=low_count,
        avg_failure_probability=round(avg_prob, 4),
        urgent_actions_needed=urgent,
        estimated_total_cost=total_cost
    )


# ============================================================
# Ticket Classification Endpoints
# ============================================================

class TicketClassifyRequest(BaseModel):
    """Request for ticket classification"""
    title: str
    description: str
    category: Optional[str] = None


class TicketPriorityResponse(BaseModel):
    """Ticket priority classification response"""
    priority: str
    confidence: float
    reasoning: List[str]


class TicketCategoryResponse(BaseModel):
    """Ticket category classification response"""
    suggested_category: str
    confidence: float
    all_categories: dict


# Priority keywords mapping
PRIORITY_KEYWORDS = {
    'urgent': {
        'keywords': ['emergency', 'urgent', 'immediately', 'fire', 'flood', 'leak', 'gas', 'danger', 'safety', 'hazard', 'broken', 'not working', 'stopped'],
        'score': 3
    },
    'high': {
        'keywords': ['important', 'asap', 'critical', 'major', 'serious', 'elevator stuck', 'no water', 'no power', 'overflowing'],
        'score': 2
    },
    'medium': {
        'keywords': ['repair', 'fix', 'issue', 'problem', 'malfunction', 'noise', 'smell', 'slow', 'intermittent'],
        'score': 1
    },
    'low': {
        'keywords': ['minor', 'when possible', 'convenience', 'cosmetic', 'request', 'upgrade', 'suggestion'],
        'score': 0
    }
}

# Category keywords mapping
CATEGORY_KEYWORDS = {
    'hvac': ['ac', 'air conditioning', 'heating', 'cooling', 'temperature', 'thermostat', 'vent', 'hvac', 'ventilation', 'hot', 'cold', 'freezing', 'warm'],
    'electrical': ['power', 'electric', 'light', 'outlet', 'socket', 'switch', 'circuit', 'fuse', 'breaker', 'wire', 'bulb', 'flickering'],
    'plumbing': ['water', 'pipe', 'leak', 'drain', 'faucet', 'toilet', 'sink', 'shower', 'clog', 'blocked', 'overflow', 'sewage'],
    'elevator': ['elevator', 'lift', 'stuck', 'floor', 'button', 'door'],
    'security': ['lock', 'door', 'camera', 'cctv', 'alarm', 'access', 'key', 'badge', 'intercom', 'security'],
    'appliance': ['washer', 'dryer', 'refrigerator', 'fridge', 'dishwasher', 'microwave', 'oven', 'stove', 'appliance']
}


@app.post("/classify/priority", response_model=TicketPriorityResponse)
async def classify_ticket_priority(request: TicketClassifyRequest):
    """
    Classify ticket priority based on title and description.
    
    Returns priority level (urgent/high/medium/low), confidence, and reasoning.
    """
    text = f"{request.title} {request.description}".lower()
    
    scores = {'urgent': 0, 'high': 0, 'medium': 0, 'low': 0}
    reasons = []
    
    for priority, data in PRIORITY_KEYWORDS.items():
        for keyword in data['keywords']:
            if keyword in text:
                scores[priority] += data['score']
                reasons.append(f"Contains '{keyword}' (suggests {priority} priority)")
    
    # Determine final priority
    max_score = max(scores.values())
    if max_score == 0:
        priority = 'medium'
        confidence = 0.5
        reasons = ["No specific priority keywords found", "Defaulting to medium priority"]
    else:
        priority = max(scores, key=scores.get)
        confidence = min(0.95, 0.5 + (max_score * 0.15))
    
    return TicketPriorityResponse(
        priority=priority,
        confidence=round(confidence, 2),
        reasoning=reasons[:5]
    )


@app.post("/classify/category", response_model=TicketCategoryResponse)
async def classify_ticket_category(request: TicketClassifyRequest):
    """
    Classify ticket category based on title and description.
    
    Returns suggested category, confidence, and scores for all categories.
    """
    text = f"{request.title} {request.description}".lower()
    
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS.keys()}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += 1
    
    # Normalize scores
    total = sum(scores.values())
    if total == 0:
        suggested = 'other'
        confidence = 0.3
        normalized = {k: 0.0 for k in scores.keys()}
    else:
        normalized = {k: round(v / total, 2) for k, v in scores.items()}
        suggested = max(scores, key=scores.get)
        confidence = min(0.95, normalized[suggested] + 0.3)
    
    return TicketCategoryResponse(
        suggested_category=suggested,
        confidence=round(confidence, 2),
        all_categories=normalized
    )


# ============================================================
# Maintenance Scheduling Endpoint
# ============================================================

class MaintenanceScheduleRequest(BaseModel):
    """Request for maintenance scheduling optimization"""
    assets: List[AssetFeatures]
    available_technicians: int = 3
    work_hours_per_day: int = 8


class MaintenanceTask(BaseModel):
    """Individual maintenance task"""
    asset_type: str
    priority: int
    estimated_hours: float
    suggested_day: int
    risk_level: str


class MaintenanceScheduleResponse(BaseModel):
    """Maintenance schedule response"""
    total_tasks: int
    estimated_days: int
    tasks_by_priority: dict
    schedule: List[MaintenanceTask]


@app.post("/schedule/maintenance", response_model=MaintenanceScheduleResponse)
async def optimize_maintenance_schedule(request: MaintenanceScheduleRequest):
    """
    Optimize maintenance schedule based on risk predictions.
    
    Returns prioritized task list and estimated schedule.
    """
    if not request.assets:
        return MaintenanceScheduleResponse(
            total_tasks=0,
            estimated_days=0,
            tasks_by_priority={},
            schedule=[]
        )
    
    # Get predictions and sort by risk
    predictions = [(asset, make_prediction(asset)) for asset in request.assets]
    
    # Sort by risk level and days to failure
    risk_priority = {'high': 0, 'medium': 1, 'low': 2}
    predictions.sort(key=lambda x: (risk_priority[x[1].risk_level], x[1].estimated_days_to_failure))
    
    # Estimate hours per task
    hours_by_type = {
        'hvac': 4.0, 'elevator': 6.0, 'electrical': 2.5,
        'plumbing': 3.0, 'security': 2.0, 'appliance': 1.5
    }
    
    schedule = []
    total_hours = 0
    daily_capacity = request.available_technicians * request.work_hours_per_day
    
    for idx, (asset, pred) in enumerate(predictions):
        hours = hours_by_type.get(asset.asset_type.lower(), 3.0)
        day = int(total_hours / daily_capacity) + 1
        
        schedule.append(MaintenanceTask(
            asset_type=asset.asset_type,
            priority=idx + 1,
            estimated_hours=hours,
            suggested_day=day,
            risk_level=pred.risk_level
        ))
        
        total_hours += hours
    
    estimated_days = int(total_hours / daily_capacity) + 1
    
    tasks_by_priority = {
        'high': sum(1 for t in schedule if t.risk_level == 'high'),
        'medium': sum(1 for t in schedule if t.risk_level == 'medium'),
        'low': sum(1 for t in schedule if t.risk_level == 'low')
    }
    
    return MaintenanceScheduleResponse(
        total_tasks=len(schedule),
        estimated_days=estimated_days,
        tasks_by_priority=tasks_by_priority,
        schedule=schedule
    )


# Run with: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

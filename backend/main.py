import os
import json
import sqlite3
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Data is now inside the backend folder for easier deployment
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "pillars.db")

@app.get("/map-data")
def get_map_data():
    path = os.path.join(DATA_DIR, "pillars.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Pillars GeoJSON not found")
    with open(path, "r") as f:
        return json.load(f)

@app.get("/polyline-data")
def get_polyline_data():
    path = os.path.join(DATA_DIR, "polylines.geojson")
    if not os.path.exists(path):
        return {"type": "FeatureCollection", "features": []}
    with open(path, "r") as f:
        return json.load(f)

def calculate_safety_score(row):
    """
    Pillar Reclamation Safety Index (0.0 - 1.0)
    
    Uses available geotechnical and spatial data from the Mimosa Mine survey:
    - B_Depth: Borehole depth (162-243m). Shallower = less overburden stress = safer
    - Borehole_E: Borehole elevation proxy (~1065-1110). Higher = less stress
    - area: Pillar cross-sectional area (m²). Larger = more structural support = safer
    - elevation: Pillar elevation (m). Higher elevation = shallower = safer
    - lithology: Rock type. Dolerite (dl) and gabbro (gb) are strongest units
    
    Weights based on rock mechanics principles (Bieniawski 1989, Wagner 1980):
    - Pillar geometry (area) dominates stability: 30%
    - Depth/stress environment: 25%  
    - Elevation (stress proxy): 20%
    - Lithology (rock strength class): 15%
    - Borehole data quality bonus: 10%
    """
    
    # --- 1. Pillar Area Factor (30%) ---
    # Larger pillars provide more support. Range: 0.2 - 300+ m²
    # Typical safe pillar at Mimosa: > 25 m²
    area_val = float(row.get('area', 0) or 0)
    if area_val > 0:
        area_score = min(area_val / 60.0, 1.0)  # 60m² = fully safe
    else:
        area_score = 0.5  # Unknown = neutral assumption
    
    # --- 2. Depth Factor (25%) - Inverted: shallower = safer ---
    # Range at Mimosa: 162m - 243m. Shallower mining = less virgin stress
    depth_val = float(row.get('B_Depth', 0) or 0)
    if depth_val > 0:
        # Normalize within Mimosa's actual range (160-250m)
        depth_score = 1.0 - ((depth_val - 160.0) / 90.0)  # 160m=1.0, 250m=0.0
        depth_score = max(0.0, min(depth_score, 1.0))
    else:
        depth_score = 0.5  # No depth data = neutral
    
    # --- 3. Elevation Factor (20%) ---
    # Higher elevation pillars experience less overburden pressure
    elev_val = float(row.get('elevation', 0) or 0)
    if elev_val > 0:
        # Normalize: Mimosa range roughly 880-920m
        elev_score = min((elev_val - 870.0) / 50.0, 1.0)
        elev_score = max(0.0, elev_score)
    else:
        elev_score = 0.5
    
    # --- 4. Lithology Factor (15%) ---
    # Rock type significantly affects pillar strength
    lith = str(row.get('lithology', '') or '').lower().strip()
    lithology_scores = {
        'dl': 0.85,      # Dolerite - very strong intrusive
        'gb': 0.80,      # Gabbro - strong mafic
        'gb,pg': 0.75,   # Mixed gabbro/pyroxenite 
        'pg': 0.65,      # Pyroxenite - moderately strong
        'br': 0.55,      # Breccia - fractured, moderate
        'wb': 0.50,      # Weathered - weakened
        'wb,br': 0.45,   # Weathered breccia - weakest
    }
    lith_score = lithology_scores.get(lith, 0.60)  # Default moderate
    
    # --- 5. Data Confidence Bonus (10%) ---
    # Pillars with more measured data get a reliability bonus
    data_fields = ['B_Depth', 'Borehole_E', 'area', 'elevation']
    filled = sum(1 for f in data_fields if float(row.get(f, 0) or 0) > 0)
    confidence_score = filled / len(data_fields)
    
    # --- Weighted Composite ---
    score = (
        (area_score * 0.30) +
        (depth_score * 0.25) +
        (elev_score * 0.20) +
        (lith_score * 0.15) +
        (confidence_score * 0.10)
    )
    
    return round(score, 2)

@app.get("/pillars")
def get_pillars():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM pillars", conn)
    conn.close()
    
    # Calculate real-time predictions
    records = df.to_dict(orient="records")
    for r in records:
        r['safety_score'] = calculate_safety_score(r)
    return records

@app.post("/pillars")
def create_pillar(data: dict):
    # Ensure ID is unique or provided
    if "pillar_id" not in data:
        raise HTTPException(status_code=400, detail="Missing pillar_id")
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    keys = data.keys()
    columns = ", ".join(keys)
    placeholders = ", ".join(["?" for _ in keys])
    values = list(data.values())
    
    query = f"INSERT OR REPLACE INTO pillars ({columns}) VALUES ({placeholders})"
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return {"message": "Survey record created/updated", "id": data["pillar_id"]}

@app.get("/model/importance")
def get_importance():
    return {
        "pillar_area": 0.30,
        "borehole_depth": 0.25,
        "elevation": 0.20,
        "lithology": 0.15,
        "data_confidence": 0.10
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

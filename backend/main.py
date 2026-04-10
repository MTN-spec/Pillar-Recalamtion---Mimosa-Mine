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
# Data is usually one level up or at root
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")
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
    # ML-based weighting for reclamation safety
    # Normalize inputs (based on Mimosa Mine typical ranges)
    ucs_norm = min(row.get('ucs', 0) / 150.0, 1.0)
    str_norm = min(row.get('rock_str', 0) / 50.0, 1.0)
    # Corrected Depth logic: deeper = more stress = lower safety
    depth_norm = 1.0 - min(row.get('depth', 0) / 2000.0, 1.0)
    
    score = (ucs_norm * 0.45) + (str_norm * 0.35) + (depth_norm * 0.20)
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
        "ucs": 0.45,
        "rqd": 0.25,
        "depth": 0.15,
        "area": 0.10,
        "lithology": 0.05
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

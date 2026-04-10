import geopandas as gpd
import pandas as pd
import sqlite3
import json
import os
from shapely.affinity import translate

# Mimosa Mine Spatial Shift (Calculated from ArcGIS Ground Truth)
DX = 556730 
DY = 8102225
INPUT_DIR = r"C:\Users\MTN\OneDrive\Desktop\MTN\External Projects\Staline _Pillar Reclamation -  MSU\MSU - Staline Pillar Reclamation\Scratch - Workspace"
OUTPUT_DIR = os.path.join(INPUT_DIR, "data")
DB_PATH = os.path.join(OUTPUT_DIR, "pillars.db")

def migrate():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    # 1. PROCESS POLYGONS (Pillars)
    poly_path = os.path.join(INPUT_DIR, "Polygons_NT_SB_to_be_used_in_colab_101_with_unique_ids.shp")
    print(f"Reading Polygons from {poly_path}...")
    gdf_poly = gpd.read_file(poly_path)
    
    # Apply Shift
    print("Applying Mimosa Mine spatial shift to Polygons...")
    gdf_poly.geometry = gdf_poly.geometry.apply(lambda g: translate(g, xoff=DX, yoff=DY))
    gdf_poly.crs = "EPSG:32735" # UTM 35S
    
    # Reproject to WGS84
    gdf_poly_wgs84 = gdf_poly.to_crs(epsg=4326)
    
    # Save to SQLite
    print(f"Migrating attributes to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    # Drop geometry for DB and clean NaN values (JSON doesn't like NaN)
    df = pd.DataFrame(gdf_poly.drop(columns='geometry'))
    df = df.fillna(0) # Replace NaN with 0 for geotechnical stability
    df.to_sql('pillars', conn, if_exists='replace', index=False)
    conn.close()
    
    # Save to GeoJSON (Cleaned)
    gdf_poly_wgs84 = gdf_poly_wgs84.fillna(0)
    gdf_poly_wgs84.to_file(os.path.join(OUTPUT_DIR, "pillars.geojson"), driver='GeoJSON')
    print("Pillar migration complete.")
    
    # 2. PROCESS POLYLINES (Faults/Layouts)
    line_path = os.path.join(INPUT_DIR, "Polylines_-_NT.shp")
    if os.path.exists(line_path):
        print(f"Reading Polylines from {line_path}...")
        gdf_line = gpd.read_file(line_path)
        
        # Apply Shift
        gdf_line.geometry = gdf_line.geometry.apply(lambda g: translate(g, xoff=DX, yoff=DY))
        gdf_line.crs = "EPSG:32735"
        
        # Reproject to WGS84
        gdf_line_wgs84 = gdf_line.to_crs(epsg=4326)
        # Save polylines to GeoJSON (Cleaned)
        gdf_line_wgs84 = gdf_line_wgs84.fillna(0)
        gdf_line_wgs84.to_file(os.path.join(OUTPUT_DIR, "polylines.geojson"), driver='GeoJSON')
        print("Polyline migration complete.")

    print("--- ALL MIGRATIONS FINISHED ---")

if __name__ == "__main__":
    migrate()

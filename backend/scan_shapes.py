import geopandas as gpd
import glob
import os

print("Scanning for shapefiles...")
files = glob.glob(r'C:\Users\MTN\OneDrive\Desktop\MTN\External Projects\Staline _Pillar Reclamation -  MSU\**\*.shp', recursive=True)

for f in files:
    try:
        gdf = gpd.read_file(f)
        bounds = gdf.total_bounds
        print(f"{os.path.basename(f)}: {bounds}")
    except Exception as e:
        print(f"Error reading {os.path.basename(f)}: {e}")

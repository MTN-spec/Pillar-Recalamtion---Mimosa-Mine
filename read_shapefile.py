import sys
import os

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False

try:
    import shapefile
    HAS_PYSHP = True
except ImportError:
    HAS_PYSHP = False

shapefile_path = r"C:\Users\MTN\OneDrive\Desktop\MTN\External Projects\Staline _Pillar Reclamation -  MSU\MSU - Staline Pillar Reclamation\Scratch - Workspace\Polygons_NT_SB_to_be_used_in_colab_101_with_unique_ids.shp"

if not os.path.exists(shapefile_path):
    print(f"Error: File not found at {shapefile_path}")
    sys.exit(1)

print(f"Reading shapefile: {shapefile_path}")

if HAS_GEOPANDAS:
    print("Using geopandas...")
    gdf = gpd.read_file(shapefile_path)
    print("\n--- SHAPEFILE INFO ---")
    print(gdf.info())
    print("\n--- ATTRIBUTE TABLE (HEAD) ---")
    print(gdf.head())
    print("\n--- COLUMNS ---")
    print(gdf.columns.tolist())
elif HAS_PYSHP:
    print("Using pyshp...")
    sf = shapefile.Reader(shapefile_path)
    print("\n--- FIELDS ---")
    print([f[0] for f in sf.fields if f[0] != 'DeletionFlag'])
    print("\n--- RECORDS (HEAD) ---")
    for i, record in enumerate(sf.records()[:5]):
        print(f"Record {i}: {record}")
else:
    print("Neither geopandas nor pyshp is installed. Please install one of them to read the shapefile.")
    print("You can run: pip install geopandas")

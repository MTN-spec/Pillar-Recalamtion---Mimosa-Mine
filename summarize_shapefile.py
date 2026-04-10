import geopandas as gpd
import json
import os

shapefile_path = r"C:\Users\MTN\OneDrive\Desktop\MTN\External Projects\Staline _Pillar Reclamation -  MSU\MSU - Staline Pillar Reclamation\Scratch - Workspace\Polygons_NT_SB_to_be_used_in_colab_101_with_unique_ids.shp"
output_json = r"C:\Users\MTN\OneDrive\Desktop\MTN\External Projects\Staline _Pillar Reclamation -  MSU\MSU - Staline Pillar Reclamation\Scratch - Workspace\shapefile_summary.json"

def summarize_shapefile(path):
    gdf = gpd.read_file(path)
    
    summary = {
        "num_rows": len(gdf),
        "num_columns": len(gdf.columns),
        "columns": gdf.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in gdf.dtypes.items()},
        "sample_data": gdf.head(10).drop(columns='geometry', errors='ignore').to_dict(orient='records'),
        "crs": str(gdf.crs)
    }
    
    with open(output_json, 'w') as f:
        json.dump(summary, f, indent=4)
    print(f"Summary written to {output_json}")

if __name__ == "__main__":
    summarize_shapefile(shapefile_path)

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, LayerGroup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to handle map centering/zooming
const MapController = ({ selectedPillarId, geoJsonData }: { selectedPillarId: string | null, geoJsonData: any }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedPillarId || !geoJsonData) return;

    const feature = geoJsonData.features.find(
      (f: any) => f.properties.pillar_id === selectedPillarId
    );

    if (feature && feature.geometry) {
      // Find center of the polygon
      const bounds = L.geoJSON(feature).getBounds();
      map.flyToBounds(bounds, { 
        padding: [100, 100], 
        maxZoom: 20,
        duration: 1.5 
      });
    }
  }, [selectedPillarId, geoJsonData, map]);

  return null;
};

const { BaseLayer } = LayersControl;

interface Props {
  geoJsonData: any;
  onPillarClick: (pillar: any) => void;
  selectedPillarId: string | null;
  shiftSelection: string[]; // Added: tracking pillars selected for the current shift
  onToggleShiftPillar: (id: string) => void; // Added: toggle logic
}

const MapComponent: React.FC<Props> = ({
  geoJsonData,
  onPillarClick,
  selectedPillarId,
  shiftSelection,
  onToggleShiftPillar
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [polylineData, setPolylineData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/polyline-data')
      .then(res => {
        if (!res.ok) throw new Error("Polyline fetch failed");
        return res.json();
      })
      .then(data => setPolylineData(data))
      .catch(err => {
        console.error("Layout layers failed to load:", err);
        setPolylineData({ type: "FeatureCollection", features: [] });
      });
  }, []);

  useEffect(() => {
    if (map && geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      console.log("Fitting map bounds to data...");
      const geoJsonLayer = L.geoJSON(geoJsonData);
      map.fitBounds(geoJsonLayer.getBounds());
    }
  }, [map, geoJsonData]);

  const style = (feature: any) => {
    const isSelected = selectedPillarId === feature.properties.pillar_id;
    const isShiftSelected = shiftSelection.includes(feature.properties.pillar_id);
    const layerType = (feature.properties.Layer || "").toLowerCase();

    // ArcGIS Color & Pattern Matching (Case-insensitive & Partial)
    const status = (feature.properties.status || "").toLowerCase();
    const safety = feature.properties.safety_score || 0;
    
    let color = '#3b82f6'; // Default Blue
    let className = "";

    // ALWAYS use the standard categorical blue for 19Pillars as requested
    if (layerType.includes('19pillar')) {
        color = '#3b82f6'; 
        className = "hatched-pattern";
    } else if (layerType.includes('1457peg')) {
        color = '#4338ca'; 
    } else if (layerType.includes('1473peg')) {
        color = '#06b6d4';
    } else if (layerType.includes('dyke') || layerType.includes('dolerite')) {
        color = '#22c55e';
    }

    if (status === 'reclaimed') {
        color = '#ef4444'; // RECLAIMED IS NOW RED
        className = "hatched-pattern";
    }

    if (isShiftSelected) {
        className += " target-crosshair";
    }

    return {
      fillColor: color,
      weight: isSelected || isShiftSelected ? 3 : 1.5,
      opacity: 1,
      color: isShiftSelected ? '#fbbf24' : 'black', // ArcGIS typically uses thin black borders
      fillOpacity: 0.8,
      className: className
    };
  };

  const lineStyle = (feature: any) => {
    const layer = (feature.properties.Layer || "").toLowerCase();
    if (layer.includes('layout')) return { color: '#2563eb', weight: 4, opacity: 0.8 }; // 19Pillar Layout -> Blue
    if (layer.includes('fault')) return { color: '#000000', weight: 2, dashArray: '5, 5' }; // Fault
    return { color: 'white', weight: 1, opacity: 0.5 };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: (e) => {
        // Prevent event propagation if needed, but here we handle selection
        onPillarClick(feature.properties);
      },
      contextmenu: (e) => {
        // Right click to toggle shift selection
        L.DomEvent.stopPropagation(e);
        onToggleShiftPillar(feature.properties.pillar_id);
      }
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[-20.35, 30.05]} // Default to Mimosa Mine area
        zoom={16}
        style={{ height: '100%', width: '100%', backgroundColor: '#0c0d0f' }}
        ref={setMap}
        attributionControl={false}
        maxZoom={22} // Allow deep zoom for pillar details
      >
        <MapController selectedPillarId={selectedPillarId} geoJsonData={geoJsonData} />
        <LayersControl position="topright" collapsed={false}>
          <BaseLayer checked name="PILLARS ONLY (No Basemap)">
            <LayerGroup />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={22}
            />
          </BaseLayer>
          <BaseLayer name="Topographic">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxNativeZoom={17}
              maxZoom={22}
            />
          </BaseLayer>
        </LayersControl>

        {polylineData && (
          <GeoJSON
            data={polylineData}
            style={lineStyle}
          />
        )}

        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={style}
            onEachFeature={(feature, layer) => {
              onEachFeature(feature, layer);
              const seqIndex = shiftSelection.indexOf(feature.properties.pillar_id);
              const label = seqIndex !== -1 
                ? `#${seqIndex + 1} - ${feature.properties.pillar_id}`
                : feature.properties.pillar_id;

              layer.bindTooltip(label.toString(), {
                permanent: true,
                direction: 'center',
                className: 'pillar-label',
                opacity: 0.9
              });
            }}
          />
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] glass-panel p-3 rounded-lg text-[10px] space-y-2">
          <p className="font-bold border-b border-white/10 pb-1 mb-2 uppercase tracking-widest text-[#94a3b8]">ArcGIS Representation</p>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#312e81]" /> <span>-1457Peg LP</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#22d3ee]" /> <span>-1473Peg</span></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#3b82f6] relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_75%,transparent_75%,transparent)] bg-[length:4px_4px]" />
            </div> 
            <span>19Pillar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#22c55e] relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.2)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_75%,transparent_75%,transparent)] bg-[length:4px_4px]" />
            </div> 
            <span>4DoleriteDyke</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
             <div className="w-4 h-0.5 bg-[#2563eb]" /> <span className="text-[8px]">19Pillar Layout</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t border-dashed border-white/40" /> <span className="text-[8px]">Major Faults</span>
          </div>
        </div>
      </MapContainer>

      {/* SVG Definitions for Patterns */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          </pattern>
          <pattern id="crosshair" patternUnits="userSpaceOnUse" width="10" height="10">
            <path d="M 5 0 V 10 M 0 5 H 10" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
            <circle cx="5" cy="5" r="3" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="0.5" />
          </pattern>
        </defs>
      </svg>
      <style>{`
        .hatched-pattern {
          fill-opacity: 0.8 !important;
        }
        .hatched-pattern path {
          stroke: rgba(0,0,0,0.3) !important;
          stroke-width: 1.5px !important;
        }
        .target-crosshair {
          fill: url(#crosshair) !important;
          fill-opacity: 1 !important;
          stroke: #ef4444 !important;
          stroke-width: 2px !important;
        }
        .pillar-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: rgba(0,0,0,0.7) !important;
          font-weight: 900 !important;
          font-size: 8px !important;
          pointer-events: none !important;
          text-shadow: 1px 1px 2px white, -1px -1px 2px white !important;
          user-select: none !important;
        }
        @media print {
          .pillar-label {
            font-size: 10px !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MapComponent;

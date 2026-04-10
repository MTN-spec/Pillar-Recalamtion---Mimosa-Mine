import { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedPillar, setSelectedPillar] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [shiftPillars, setShiftPillars] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'planner' | 'database'>('map');
  const [allPillars, setAllPillars] = useState<any[]>([]);
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrintMode(true);
    const handleAfterPrint = () => setIsPrintMode(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const [mapRes, importanceRes, pillarsRes] = await Promise.all([
        axios.get(`${API_BASE}/map-data`),
        axios.get(`${API_BASE}/model/importance`),
        axios.get(`${API_BASE}/pillars`)
      ]);
      
      const pillars = pillarsRes.data;
      const geoData = mapRes.data;

      // Merge safety scores into GeoJSON properties for heatmap visualization
      if (geoData.features) {
        geoData.features = geoData.features.map((f: any) => {
          const pillar = pillars.find((p: any) => p.pillar_id === f.properties.pillar_id);
          return {
            ...f,
            properties: {
              ...f.properties,
              safety_score: pillar ? pillar.safety_score : 0,
              status: pillar ? pillar.status : 'active'
            }
          };
        });
      }

      setGeoJsonData(geoData);
      setFeatureImportance(importanceRes.data);
      setAllPillars(pillars);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };


  const handlePillarClick = (properties: any) => {
    setSelectedPillar(properties);
  };

  const handleToggleShift = (id: string) => {
    setShiftPillars(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleUpdatePillar = async (id: string, updates: any) => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // POST handles both update and create in our new backend logic
      await axios.post(`${API_BASE}/pillars`, { pillar_id: id, ...updates });
      await fetchData();
      // Update selected pillar state as well
      if (selectedPillar?.pillar_id === id) {
        setSelectedPillar({ ...selectedPillar, ...updates });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReclaim = async (id: string) => {
    setLoading(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      await axios.post(`${API_BASE}/reclaim/${id}`);
      await fetchData();
      setSelectedPillar(null);
    } catch (err) {
      console.error("Reclamation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShift = async (name: string) => {
    if (shiftPillars.length === 0) return;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      await axios.post(`${API_BASE}/shifts`, {
        shift_name: name,
        pillars: shiftPillars
      });
      setShiftPillars([]);
      alert("Shift plan saved successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isPrintMode ? 'bg-white text-black' : 'bg-[#0a0a0c] text-slate-200'}`}>
      <style>{`
        @media print {
          .sidebar { width: 350px !important; border: 1px solid #ddd !important; }
          .tabs-header, .search-container, .db-controls { display: none !important; }
          .glass-panel { background: white !important; color: black !important; border: 1px solid #eee !important; }
          main { overflow: visible !important; }
          .map-container { border: 1px solid #ddd !important; }
        }
      `}</style>
      <Sidebar 
        selectedPillar={selectedPillar} 
        featureImportance={featureImportance}
        onReclaim={handleReclaim}
        onUpdatePillar={handleUpdatePillar}
        onSaveShift={handleSaveShift}
        shiftPillars={shiftPillars}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allPillars={allPillars}
        onSelectPillar={handlePillarClick}
      />
      
      <main className="flex-1 relative">
        <MapComponent 
          geoJsonData={geoJsonData} 
          onPillarClick={handlePillarClick}
          selectedPillarId={selectedPillar?.pillar_id}
          shiftSelection={shiftPillars}
          onToggleShiftPillar={handleToggleShift}
        />
        
        {/* Top Overlay Legend */}
        <div className="absolute top-4 left-4 z-[1000] glass-panel p-3 rounded-lg flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span>Safe (&gt;70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span>Warning (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span>Critical (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span>Reclaimed</span>
          </div>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <div className="text-white/40">Panel: 19 North Top</div>
        </div>
      </main>
    </div>
  );
}

export default App;

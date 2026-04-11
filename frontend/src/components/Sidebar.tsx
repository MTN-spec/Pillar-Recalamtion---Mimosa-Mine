import React, { useState } from 'react';
import { Database, Zap, Loader, Calendar, Printer, Edit3, Save, Search } from 'lucide-react';
import { Pillar, AppTab } from '../types/pillar';

interface Props {
  selectedPillar: Pillar | null;
  featureImportance: Record<string, number>;
  onReclaim: (id: string) => void;
  onUpdatePillar: (id: string, data: Partial<Pillar>) => void;
  onSaveShift: (name: string) => void;
  shiftPillars: string[];
  loading: boolean;
  allPillars: Pillar[];
  onSelectPillar: (pillar: any) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Sidebar: React.FC<Props> = ({ 
  selectedPillar, 
  featureImportance, 
  onReclaim, 
  onUpdatePillar,
  onSaveShift,
  shiftPillars,
  loading,
  allPillars,
  onSelectPillar,
  activeTab, 
  setActiveTab 
}) => {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<any>({});
  const [shiftName, setShiftName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newRecord, setNewRecord] = useState({ pillar_id: '', ucs: 0, rock_str: 0, depth: 0, Layer: '19Pillar' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const filteredPillars = allPillars.filter(p => 
    (p.pillar_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.Layer || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = () => {
    if (!selectedPillar) return;
    setEditValues({
      confine: selectedPillar.confine,
      ucs: selectedPillar.ucs,
      rock_str: selectedPillar.rock_str,
      depth: selectedPillar.depth
    });
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPillar) return;
    onUpdatePillar(selectedPillar.pillar_id, editValues);
    setEditing(false);
  };

  const handleCreateRecord = () => {
    onUpdatePillar(newRecord.pillar_id, newRecord);
    setAddingNew(false);
    setNewRecord({ pillar_id: '', ucs: 0, rock_str: 0, depth: 0, Layer: '19Pillar' });
  };

  const handleRowClick = (pillar: any) => {
    onSelectPillar(pillar);
    setActiveTab('map'); // Auto-switch to Monitor view
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const selectedData = allPillars.filter(p => shiftPillars.includes(p.pillar_id));
      // Sort by the sequence in shiftPillars
      const manifest = shiftPillars.map((id, idx) => {
        const p = selectedData.find(item => item.pillar_id === id);
        return { ...p, sequence: idx + 1 };
      });

      const avgUcs = selectedData.reduce((acc, p) => acc + (p.ucs || 0), 0) / (selectedData.length || 1);
      const avgSafety = selectedData.reduce((acc, p) => acc + (p.safety_score || 0), 0) / (selectedData.length || 1);
      
      setAnalysisResults({
        avgUcs,
        avgSafety,
        riskLevel: avgSafety > 0.7 ? 'OPTIMAL' : avgSafety > 0.4 ? 'CAUTION' : 'DANGER',
        confidence: 0.94,
        manifest
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="sidebar glass-panel border-r border-slate-200 p-4 flex flex-col h-full overflow-hidden text-slate-800">
      <div className="flex items-center gap-2 mb-8 text-blue-600">
        <Database size={24} />
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase italic">Pillar Intel</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-lg mb-6 gap-1 border border-slate-200">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          MONITOR
        </button>
        <button 
          onClick={() => setActiveTab('planner')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'planner' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          PLANNER
        </button>
        <button 
          onClick={() => setActiveTab('database')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'database' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          DATABASE
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
        >
          ANALYTICS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar flex flex-col">
        {activeTab === 'map' ? (
          <>
            {/* Selected Pillar Stats / Input Panel */}
            <section className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Pillar Insight</p>
                {selectedPillar && !editing && (
                  <button onClick={startEdit} className="text-slate-400 hover:text-slate-900"><Edit3 size={14} /></button>
                )}
              </div>

              {selectedPillar ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{selectedPillar.pillar_id}</h2>
                    <span className="text-[10px] text-slate-500">{selectedPillar.Layer}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <p className="text-slate-400 text-[9px] uppercase font-bold">UCS (MPa)</p>
                      {editing ? (
                        <input 
                          type="number" 
                          value={editValues.ucs} 
                          onChange={e => setEditValues({...editValues, ucs: parseFloat(e.target.value)})}
                          className="bg-transparent text-sm font-mono w-full outline-none border-b border-blue-500/50 text-slate-900"
                        />
                      ) : (
                        <p className="font-mono text-slate-900 text-sm">{(selectedPillar.ucs || 0).toFixed(2)}</p>
                      )}
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <p className="text-slate-400 text-[9px] uppercase font-bold">Str (MPa)</p>
                      {editing ? (
                        <input 
                          type="number" 
                          value={editValues.rock_str} 
                          onChange={e => setEditValues({...editValues, rock_str: parseFloat(e.target.value)})}
                          className="bg-transparent text-sm font-mono w-full outline-none border-b border-blue-500/50 text-slate-900"
                        />
                      ) : (
                        <p className="font-mono text-slate-900 text-sm">{(selectedPillar.rock_str || 0).toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {editing ? (
                    <button 
                      onClick={handleSaveEdit}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-[10px]"
                    >
                      <Save size={14} /> SAVE CHANGES
                    </button>
                  ) : (
                    <button 
                      onClick={() => onReclaim(selectedPillar.pillar_id)}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg font-black text-[10px] transition-all"
                    >
                      {loading ? <Loader className="animate-spin" size={16} /> : <Zap size={14} />}
                      BLAST & RECLAIM
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-300 italic text-[10px] bg-white rounded-lg border border-dashed border-slate-200 uppercase tracking-widest font-bold">
                  No Pillar Selected
                </div>
              )}
            </section>

            {/* Feature Importance */}
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ML Geotech Weights</p>
              <div className="space-y-4">
                {Object.entries(featureImportance).map(([key, value]: [any, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[9px] mb-1.5">
                      <span className="capitalize font-bold text-slate-600">{key}</span>
                      <span className="text-blue-600 font-bold">{(value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : activeTab === 'database' ? (
          <section className="h-full flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={14} />
                <input 
                  placeholder="Search Database..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-[10px] text-slate-900 outline-none focus:border-blue-500/50"
                />
              </div>
              <button 
                onClick={() => setAddingNew(!addingNew)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all font-bold"
              >
                {addingNew ? '×' : '+'}
              </button>
            </div>

            {addingNew && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-3 animate-in fade-in duration-300">
                <p className="text-[9px] font-black text-blue-600 uppercase">New Survey Entry</p>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-bold uppercase">Pillar ID</label>
                      <input 
                        value={newRecord.pillar_id} 
                        onChange={e => setNewRecord({...newRecord, pillar_id: e.target.value})}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-[9px] outline-none"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] text-slate-400 font-bold uppercase">UCS (MPa)</label>
                      <input 
                        type="number"
                        value={newRecord.ucs} 
                        onChange={e => setNewRecord({...newRecord, ucs: parseFloat(e.target.value)})}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-[9px] outline-none"
                      />
                   </div>
                </div>
                <button 
                  onClick={handleCreateRecord}
                  className="w-full py-1.5 bg-blue-600 text-white text-[9px] font-black rounded"
                >
                  SAVE RECORD
                </button>
              </div>
            )}

            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner custom-scrollbar">
              <table className="w-full text-[9px] border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-black">
                  <tr>
                    <th className="p-2 text-left">Pillar ID</th>
                    <th className="p-2 text-right">UCS</th>
                    <th className="p-2 text-right">ML Safety</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPillars.map(p => (
                    <tr 
                      key={p.pillar_id} 
                      onClick={() => handleRowClick(p)}
                      className={`group cursor-pointer transition-all hover:bg-blue-50/50 ${selectedPillar?.pillar_id === p.pillar_id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2 font-bold text-slate-700 group-hover:text-blue-600">{p.pillar_id}</td>
                      <td className="p-2 text-right font-mono text-slate-400">{(p.ucs || 0).toFixed(1)}</td>
                      <td className="p-2 text-right font-mono text-blue-600 font-bold">{( (p.safety_score || 0) * 100).toFixed(0)}%</td>
                      <td className="p-2 text-center uppercase font-black text-[7px] tracking-tighter">
                         <span className={p.status === 'reclaimed' ? 'text-green-600 bg-green-50 px-1 py-0.5 rounded border border-green-100' : 'text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100'}>
                           {p.status || 'Active'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-[8px] text-center text-slate-400 uppercase tracking-widest">{filteredPillars.length} Records found</p>
          </section>
        ) : activeTab === 'analytics' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Zap className="text-blue-500 mb-4" size={40} />
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Advanced Analytics</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-wider font-medium">
              Geotechnical statistics and safety score distributions are being visualized in the main view.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase">Active Shift (10h)</span>
              </div>
              <input 
                placeholder="Shift Description..."
                value={shiftName}
                onChange={e => setShiftName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500/50 mb-4"
              />
              
              <div className="space-y-2 mb-4">
                <p className="text-[9px] text-slate-400 uppercase font-black">Selection Queue ({shiftPillars.length}/6)</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {shiftPillars.map(p => (
                    <span key={p} className="text-[9px] bg-blue-100 px-2 py-1 rounded border border-blue-200 text-blue-700 font-bold">{p}</span>
                  ))}
                  {shiftPillars.length === 0 && <p className="text-[8px] text-slate-300 italic">Right-click pillars on map to plan shift</p>}
                </div>
              </div>

              <div className="flex gap-2">
                 <button 
                  onClick={runAnalysis}
                  disabled={shiftPillars.length === 0 || isAnalyzing}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                 >
                   {isAnalyzing ? <Loader className="animate-spin" size={12} /> : <Zap size={12} />}
                   RUN ML CHECK
                 </button>
                 <button 
                  onClick={() => onSaveShift(shiftName)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] rounded-lg disabled:opacity-50 transition-all shadow-md active:scale-95"
                  disabled={shiftPillars.length === 0 || !shiftName || !analysisResults}
                 >
                   SAVE PLAN
                 </button>
                 <button 
                  onClick={() => window.print()}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                 >
                   <Printer size={16} />
                 </button>
              </div>
            </div>

            {analysisResults && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/30">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-3 tracking-widest">AI Analysis Report</p>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between"><span>Avg UCS</span> <span className="font-mono">{analysisResults.avgUcs.toFixed(1)} MPa</span></div>
                    <div className="flex justify-between"><span>Safety Confidence</span> <span className="text-blue-600 font-bold">{(analysisResults.avgSafety * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between font-bold"><span>Risk Assessment</span> <span className={analysisResults.riskLevel === 'OPTIMAL' ? 'text-green-600' : 'text-red-600'}>{analysisResults.riskLevel}</span></div>
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                  <p className="p-3 text-[9px] font-black text-slate-400 uppercase bg-slate-50 border-b border-slate-200">Shift Geotech Manifest</p>
                  <table className="w-full text-[8px] text-left">
                    <thead className="bg-slate-50 text-[7px] font-black uppercase text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Pillar</th>
                        <th className="p-2">UCS</th>
                        <th className="p-2">Depth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysisResults.manifest.map((p: any) => (
                        <tr key={p.pillar_id}>
                          <td className="p-2 font-black text-blue-600">{p.sequence}</td>
                          <td className="p-2 font-bold">{p.pillar_id}</td>
                          <td className="p-2 font-mono">{(p.ucs || 0).toFixed(0)}</td>
                          <td className="p-2 font-mono">{(p.depth || 0).toFixed(0)}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Shift Constraints</p>
              <div className="space-y-2 text-[10px]">
                 <div className="flex justify-between"><span>Max Load</span> <span className="text-blue-600 font-bold">6 Pillars</span></div>
                 <div className="flex justify-between"><span>Duration</span> <span className="text-slate-400">10 Hours</span></div>
                 <div className="flex justify-between font-bold"><span>Safety Status</span> <span className="text-green-600">OPTIMAL</span></div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

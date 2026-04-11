import React from 'react';
import { Pillar } from '../types/pillar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsDashboardProps {
  pillars: Pillar[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ pillars }) => {
  // Calculate Stats
  const totalPillars = pillars.length;
  const reclaimedPillars = pillars.filter(p => p.status === 'reclaimed').length;
  const avgSafetyScore = pillars.reduce((acc, p) => acc + (p.safety_score || 0), 0) / (totalPillars || 1);
  
  // Categorize for Chart
  const categories = {
    'Critical (<40%)': pillars.filter(p => (p.safety_score || 0) < 0.4).length,
    'Warning (40-70%)': pillars.filter(p => (p.safety_score || 0) >= 0.4 && (p.safety_score || 0) < 0.7).length,
    'Safe (>70%)': pillars.filter(p => (p.safety_score || 0) >= 0.7).length,
  };

  const chartData = Object.entries(categories).map(([name, value]) => ({ name, value }));
  
  const statusData = [
    { name: 'Active', value: totalPillars - reclaimedPillars },
    { name: 'Reclaimed', value: reclaimedPillars },
  ];

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 border border-white/5 rounded-xl">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Pillars</p>
          <p className="text-3xl font-bold text-white">{totalPillars}</p>
        </div>
        <div className="glass-panel p-4 border border-white/5 rounded-xl">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Reclaimed</p>
          <p className="text-3xl font-bold text-blue-500">{reclaimedPillars}</p>
        </div>
        <div className="glass-panel p-4 border border-white/5 rounded-xl">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Avg safety score</p>
          <p className="text-3xl font-bold text-orange-500">{Math.round(avgSafetyScore * 100)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border border-white/5 rounded-xl h-[350px]">
          <h3 className="text-sm font-bold text-white/60 mb-6 uppercase tracking-widest">Safety Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 border border-white/5 rounded-xl h-[350px] flex flex-col">
          <h3 className="text-sm font-bold text-white/60 mb-6 uppercase tracking-widest">Reclamation Status</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-[10px] uppercase text-white/40">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border border-white/5 rounded-xl">
        <h3 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-widest text-center">Executive Summary</h3>
        <p className="text-white/70 text-sm leading-relaxed text-center max-w-2xl mx-auto">
          Panel 19 North Top current reclamation status is at 
          <span className="text-blue-500 font-bold mx-1">{Math.round((reclaimedPillars / (totalPillars || 1)) * 100)}%</span> 
          of total unmined pillars. The average panel stability index remains within nominal thresholds at 
          <span className="text-orange-500 font-bold mx-1">{Math.round(avgSafetyScore * 100)}%</span>.
          Current geotechnical monitoring indicates that 
          <span className="text-red-500 font-bold mx-1">{categories['Critical (<40%)']}</span> 
          pillars require high-priority surveillance or immediate extraction sequencing.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

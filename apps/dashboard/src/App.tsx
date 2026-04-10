import React, { useEffect, useMemo, memo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { RootState, AppDispatch } from './store';
import { addEvent, setTab } from './store/costsSlice';
import { BurnChart } from './components/AnalyticsChart';
import Login from './components/Login';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  TrendingUp, 
  Zap, 
  Upload, 
  LogOut,
  Activity
} from 'lucide-react';

const socket = io('http://localhost:3000');

const StatCard = memo(({ title, value, limit, delta, active }: any) => {
  const percentage = Math.min(((value || 0) / limit) * 100, 100);
  const isCritical = percentage >= 90 || Math.abs(delta) > 30;

  return (
    <div className={`relative overflow-hidden bg-[#1e293b] p-7 rounded-[2rem] border transition-all duration-500 ${
      isCritical ? 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.1)]' : 'border-slate-800'
    } ${active ? 'ring-2 ring-emerald-500/20' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">{title}</p>
        {delta !== 0 && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
            delta > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {delta > 0 ? <TrendingUp size={10}/> : <TrendingUp size={10} className="rotate-180"/>}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-mono font-bold tracking-tighter ${isCritical ? 'text-red-400' : 'text-white'}`}>
          ${value?.toLocaleString() || '0'}
        </span>
      </div>
      <div className="w-full bg-slate-900/50 h-2 mt-8 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { history, activeTab } = useSelector((state: RootState) => (state as any).budget);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    socket.on('ai_update', (envelope) => {
      const data = envelope.data || envelope;
      dispatch(addEvent(data));
    });
    return () => { socket.off('ai_update'); };
  }, [dispatch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://localhost:3000/costs/upload-csv', {
        method: 'POST',
        headers: { 
          'x-api-key': 'garavi-sokak-2026',
          'Authorization': `Bearer ${token}`
        }, 
        body: formData,
      });
      if (!response.ok) throw new Error("Unauthorized Access");
      alert("CSV Injected Successfully");
    } catch (err) {
      alert("Upload Failed: Identity Rejected.");
    } finally {
      setIsUploading(false);
    }
  };

  const latest = useMemo(() => 
    history[0] || { stats: { company: 0, dept: 0, emp: 0 }, delta: 0, user: 'System', amount: 0, dept: 'N/A' }, 
  [history]);

  const chartData = useMemo(() => 
    [...history].reverse().map((h, i) => ({ 
      timestamp: i, 
      amount: Number(h.amount) || 0 
    })).slice(-15), 
  [history]);

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-[#1e293b]/50 backdrop-blur-xl p-8 border-r border-slate-800/50 flex flex-col">
        <div className="flex items-center gap-4 mb-14">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Zap size={24} className="text-slate-900 fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Budget.AI</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'company', label: 'Global Burn', icon: <Building2 size={18}/> },
            { id: 'dept', label: 'Sector Analytics', icon: <LayoutDashboard size={18}/> },
            { id: 'emp', label: 'Unit Tracking', icon: <Users size={18}/> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => dispatch(setTab(tab.id as any))}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 group ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/40 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-emerald-400'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
          <button onClick={() => { localStorage.removeItem('access_token'); setIsAuthenticated(false); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 transition-all mt-4">
            <LogOut size={18}/> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <header className="flex justify-between items-end mb-14">
          <div>
            <div className="flex items-center gap-3 text-emerald-500 mb-2">
              <div className="h-px w-8 bg-emerald-500/30"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Real-Time Stream</span>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tight capitalize">
              {activeTab}<span className="text-emerald-500">.</span>
            </h2>
          </div>
          
          <label className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold cursor-pointer transition-all ${
            isUploading ? 'bg-slate-800 text-slate-500' : 'bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-700'
          }`}>
            <Upload size={18} className={isUploading ? 'animate-bounce' : ''} />
            <span className="text-xs uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Inject CSV'}</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" disabled={isUploading} />
          </label>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <StatCard title="Total Portfolio" value={latest.stats.company} limit={100000} delta={latest.delta} active={activeTab === 'company'} />
          <StatCard title="Sector Load" value={latest.stats.dept} limit={20000} delta={latest.delta} active={activeTab === 'dept'} />
          <StatCard title="Unit Intensity" value={latest.stats.emp} limit={5000} delta={latest.delta} active={activeTab === 'emp'} />
        </div>

        {/* Chart & Live Telemetry Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2">
            <div className="bg-[#1e293b] rounded-[3rem] p-10 border border-slate-800 shadow-2xl h-[500px] relative">
              <div className="h-[320px] w-full">
                {chartData.length > 1 ? (
                  <BurnChart data={chartData} color={latest.delta > 20 ? "#ef4444" : "#10b981"} />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center">
                    <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Awaiting Pulse...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: LIVE TELEMETRY FEED */}
          <div className="bg-[#1e293b]/30 rounded-[3rem] p-8 border border-slate-800/50 flex flex-col h-[500px]">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={16} className="text-emerald-500 animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live AI Telemetry</h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {history.length > 0 ? (
                history.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-mono text-emerald-500/70">PROCESSED_DATA</span>
                      <span className="text-[9px] font-mono text-slate-600">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <p className="text-white text-sm font-bold truncate">{item.user}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-emerald-400 font-mono text-xs font-bold">${item.amount?.toLocaleString()}</span>
                      <span className="text-slate-500 text-[10px] uppercase font-black tracking-tighter">{item.dept}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-xs italic font-mono">Standby for data injection...</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
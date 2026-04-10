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
  Activity,
  Menu,
  X
} from 'lucide-react';

const socket = io('http://localhost:3000');

// --- SHARED COMPONENTS ---

const StatCard = memo(({ title, value, limit, delta, active }: any) => {
  const percentage = Math.min(((value || 0) / limit) * 100, 100);
  const isCritical = percentage >= 90 || Math.abs(delta) > 30;

  return (
    <div className={`relative overflow-hidden bg-[#1e293b] p-6 rounded-[2rem] border transition-all duration-500 ${
      isCritical ? 'border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.1)]' : 'border-slate-800'
    } ${active ? 'ring-2 ring-emerald-500/20' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
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
        <span className={`text-3xl md:text-4xl font-mono font-bold tracking-tighter ${isCritical ? 'text-red-400' : 'text-white'}`}>
          ${value?.toLocaleString() || '0'}
        </span>
      </div>
      <div className="w-full bg-slate-900/50 h-1.5 mt-6 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

// --- MAIN APP COMPONENT ---

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { history, activeTab } = useSelector((state: RootState) => (state as any).budget);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // 1. Socket Listener
  useEffect(() => {
    socket.on('ai_update', (envelope) => {
      const data = envelope.data || envelope;
      dispatch(addEvent(data));
    });
    return () => { socket.off('ai_update'); };
  }, [dispatch]);

  // 2. Logic: Group Data by Dept and Employee for Breakdown Tabs
  const aggregates = useMemo(() => {
    const depts: Record<string, { total: number; count: number; items: any[] }> = {};
    const emps: Record<string, { total: number; dept: string; items: any[] }> = {};

    history.forEach((item: any) => {
      const userName = item.user || `${item.firstName} ${item.lastName}`;
      if (!depts[item.dept]) depts[item.dept] = { total: 0, count: 0, items: [] };
      if (!emps[userName]) emps[userName] = { total: 0, dept: item.dept, items: [] };

      depts[item.dept].total += item.amount;
      depts[item.dept].count++;
      depts[item.dept].items.push(item);
      
      emps[userName].total += item.amount;
      emps[userName].items.push(item);
    });

    return { depts, emps };
  }, [history]);

  // 3. File Upload Handler
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
      if (!response.ok) throw new Error("Unauthorized");
      alert("CSV Injection Successful");
    } catch (err) {
      alert("Identity Rejected.");
    } finally {
      setIsUploading(false);
    }
  };

  const latest = useMemo(() => 
    history[0] || { stats: { company: 0, dept: 0, emp: 0 }, delta: 0 }, 
  [history]);

  const chartData = useMemo(() => 
    [...history].reverse().map((h, i) => ({ 
      timestamp: i, 
      amount: Number(h.amount) || 0 
    })).slice(-15), 
  [history]);

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-6 bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-emerald-500 fill-current" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">BUDGET.AI</h1>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR (Responsive) */}
      <aside className={`
        fixed inset-0 z-50 md:relative md:z-auto md:translate-x-0 transition-transform duration-300
        w-full md:w-80 bg-[#1e293b] md:bg-[#1e293b]/50 backdrop-blur-xl p-8 border-r border-slate-800/50 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-4 mb-14">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl">
            <Zap size={24} className="text-slate-900 fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Budget.AI</h1>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-4">Navigation</p>
          {[
            { id: 'company', label: 'Global Burn', icon: <Building2 size={18}/> },
            { id: 'dept', label: 'Sector Analytics', icon: <LayoutDashboard size={18}/> },
            { id: 'emp', label: 'Unit Tracking', icon: <Users size={18}/> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { dispatch(setTab(tab.id as any)); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}

          {/* DYNAMIC SECTORS LIST */}
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-8 mb-4 px-4">Active Sectors</p>
          {Object.entries(aggregates.depts).map(([name, data]) => (
            <button
              key={name}
              onClick={() => { dispatch(setTab(`dept:${name}`)); setSidebarOpen(false); }}
              className={`w-full text-left px-6 py-3 rounded-xl text-xs font-bold truncate transition-all ${
                activeTab === `dept:${name}` ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {name} <span className="opacity-40 float-right">${data.total.toLocaleString()}</span>
            </button>
          ))}
        </nav>

        <button onClick={() => { localStorage.removeItem('access_token'); window.location.reload(); }} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 mt-4">
          <LogOut size={18}/> Logout
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 md:mb-14">
          <div>
            <div className="flex items-center gap-3 text-emerald-500 mb-2">
              <div className="h-px w-8 bg-emerald-500/30"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase italic">
              {activeTab.includes(':') ? activeTab.split(':')[1] : activeTab}<span className="text-emerald-500">.</span>
            </h2>
          </div>
          
          <label className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold cursor-pointer transition-all ${
            isUploading ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20'
          }`}>
            <Upload size={18} className={isUploading ? 'animate-bounce' : ''} />
            <span className="text-xs uppercase tracking-widest font-black">{isUploading ? 'Injecting...' : 'Upload CSV'}</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" disabled={isUploading} />
          </label>
        </header>

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard title="Total Portfolio" value={latest.stats?.company} limit={100000} delta={latest.delta} active={activeTab === 'company'} />
          <StatCard title="Sector Load" value={latest.stats?.dept} limit={20000} delta={latest.delta} active={activeTab === 'dept'} />
          <StatCard title="Unit Intensity" value={latest.stats?.emp} limit={5000} delta={latest.delta} active={activeTab === 'emp'} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* CENTER PANEL: CHART OR BREAKDOWN TABLE */}
          <div className="xl:col-span-2">
            <div className="bg-[#1e293b] rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-800 shadow-2xl min-h-[450px]">
              
              {!activeTab.includes(':') ? (
                // CHART VIEW
                <div className="h-full w-full">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Burn Analytics</p>
                  <div className="h-[300px]">
                    {chartData.length > 1 ? (
                      <BurnChart data={chartData} color={latest.delta > 20 ? "#ef4444" : "#10b981"} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center italic text-slate-600 text-xs">Waiting for data stream...</div>
                    )}
                  </div>
                </div>
              ) : (
                // GRANULAR BREAKDOWN VIEW
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Unit Breakdown</p>
                    <span className="text-[10px] font-mono text-slate-500">{history.filter((h:any) => h.dept === activeTab.split(':')[1]).length} Records Found</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-mono">
                      <thead className="text-slate-600 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="pb-4">Member</th>
                          <th className="pb-4">Description</th>
                          <th className="pb-4 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {history
                          .filter((h: any) => h.dept === activeTab.split(':')[1] || `${h.firstName} ${h.lastName}` === activeTab.split(':')[1])
                          .map((row: any, i: number) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                              <td className="py-4 text-white font-bold">{row.user || row.firstName}</td>
                              <td className="py-4 text-slate-500 text-xs">{row.description}</td>
                              <td className="py-4 text-right text-emerald-400 font-bold">${row.amount}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: TELEMETRY FEED (Responsive - Hides on Small Mobiles) */}
          <div className="hidden lg:flex bg-[#1e293b]/30 rounded-[3rem] p-8 border border-slate-800/50 flex-col h-[500px] xl:h-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-emerald-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Pulse</h3>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {history.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-white text-xs font-bold truncate">{item.user || item.firstName}</p>
                  <div className="flex justify-between mt-2 items-center">
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">${item.amount}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[8px] font-black text-slate-400 uppercase">{item.dept}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
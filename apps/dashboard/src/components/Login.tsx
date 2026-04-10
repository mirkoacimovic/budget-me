import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [credentials] = useState({ username: 'admin', password: 'budget2026' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        
        // SYNC POINT: We save 'access_token' so getHeaders() finds it
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          onLoginSuccess();
        } else {
          console.error("Payload missing access_token");
        }
      } else {
        alert("Gatekeeper rejected entry. Verify Backend Auth Service.");
      }
    } catch (err) {
      console.error("Connection failed", err);
      alert("Cannot reach API Gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <div className="bg-[#1e293b] p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Gatekeeper</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">Neural Identity Verification</p>
        
        <div className="space-y-4 mb-8">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">Identity</p>
            <p className="text-emerald-400 font-mono text-sm">{credentials.username}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">Access Key</p>
            <p className="text-white font-mono tracking-[0.5em]">••••••••</p>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-emerald-900/40 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
        </button>
      </div>
    </div>
  );
};

export default Login;
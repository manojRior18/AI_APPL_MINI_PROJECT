import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../App';
import api from '../api';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { showToast } = useToast();
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Invalid email or password', "error");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* ── LEFT PANEL (Hidden on mobile) ────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-[#0A1628] relative overflow-hidden px-16 xl:px-24">
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="font-serif italic text-6xl text-white leading-tight mb-12">
            Compliance, <br/>Simplified.
          </h1>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
              <p className="text-lg">AI-powered OCR for any invoice format</p>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
              <p className="text-lg">Real-time GST portal reconciliation</p>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
              <p className="text-lg">GSTR-1 ready export in one click</p>
            </div>
          </div>
        </div>

        {/* Abstract India Map outline placeholder */}
        <div className="absolute -bottom-24 -right-24 opacity-[0.03] pointer-events-none">
          <svg width="600" height="600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ───────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-8 sm:px-16 lg:px-24">
        <div className={`w-full max-w-md mx-auto transition-transform ${shake ? 'animate-shake' : ''}`}>
          
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-[#1A56DB] p-1.5 rounded-lg">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-[#0A1628] tracking-tight">GST Helper<span className="text-[#1A56DB]">.AI</span></h2>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h3>
          <p className="text-slate-500 mb-8 font-medium">Please enter your details to sign in.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Floating Label Input for Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white transition-all"
                placeholder="Email"
              />
              <label 
                htmlFor="email"
                className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#1A56DB]"
              >
                Email Address
              </label>
            </div>

            {/* Floating Label Input for Password */}
            <div className="relative">
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white transition-all"
                placeholder="Password"
              />
              <label 
                htmlFor="password"
                className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#1A56DB]"
              >
                Password
              </label>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white group-hover:border-[#1A56DB] transition-colors">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="absolute inset-0 bg-[#1A56DB] rounded scale-0 peer-checked:scale-100 transition-transform flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium select-none">Remember me</span>
              </label>
              
              <a href="#" className="text-sm font-bold text-[#1A56DB] hover:underline">Forgot password?</a>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-200 text-center">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full mt-4" loading={loading}>
              Sign In →
            </Button>
            
            <p className="text-center text-sm font-medium text-slate-500 mt-6">
              Don't have an account? <Link to="/signup" className="text-[#1A56DB] font-bold hover:underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
      
      {/* Add shake keyframes dynamically for this component if not global */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}
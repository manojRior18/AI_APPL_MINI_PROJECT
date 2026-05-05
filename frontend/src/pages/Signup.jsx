import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../App';
import api from '../api';
import { useToast } from '../hooks/useToast';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  // Step 1
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [gstin, setGstin] = useState('');
  const [stateReg, setStateReg] = useState('Maharashtra');
  const [turnover, setTurnover] = useState('< 5 Cr');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleNext = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "warning");
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/signup', {
        business_name: businessName,
        email,
        password,
        gstin: gstin || 'Not Provided',
      });
      // Auto-login after signup
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Signup failed', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-[#0A1628] relative overflow-hidden px-16 xl:px-24">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        <div className="relative z-10 max-w-lg">
          <h1 className="font-serif italic text-6xl text-white leading-tight mb-12">
            Join 10,000+ MSMEs filing smarter.
          </h1>

          <div className="space-y-8 mt-16 border-t border-slate-700/50 pt-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Trusted By Partners</p>
            <div className="flex items-center gap-8 opacity-60 grayscale brightness-200">
              <div className="flex items-center gap-2 font-bold text-white text-xl"><Building /> GST Portal</div>
              <div className="flex items-center gap-2 font-bold text-white text-xl"><ShieldCheck /> CA Partner</div>
              <div className="font-bold text-white text-xl">Startup India</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ───────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="bg-[#1A56DB] p-1.5 rounded-lg">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-[#0A1628] tracking-tight">GST Helper<span className="text-[#1A56DB]">.AI</span></h2>
            </div>
            <div className="flex gap-1.5">
              <div className={`h-1.5 w-6 rounded-full ${step >= 1 ? 'bg-[#1A56DB]' : 'bg-slate-200'}`} />
              <div className={`h-1.5 w-6 rounded-full transition-colors ${step >= 2 ? 'bg-[#1A56DB]' : 'bg-slate-200'}`} />
            </div>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h3>
          <p className="text-slate-500 mb-8 font-medium">Step {step} of 2 — {step === 1 ? 'Basic Information' : 'Business Details'}</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-200 text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <input required value={businessName} onChange={e => setBusinessName(e.target.value)} id="bname" placeholder=" " className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white" />
                <label htmlFor="bname" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1A56DB]">Business Name</label>
              </div>

              <div className="relative">
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} id="email" placeholder=" " className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white" />
                <label htmlFor="email" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1A56DB]">Email Address</label>
              </div>

              <div className="relative">
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} id="pass" placeholder=" " className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white" />
                <label htmlFor="pass" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1A56DB]">Password</label>
              </div>

              <div className="relative">
                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} id="cpass" placeholder=" " className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white" />
                <label htmlFor="cpass" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1A56DB]">Confirm Password</label>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-6" icon={<ArrowRight size={18} />}>
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <input value={gstin} onChange={e => setGstin(e.target.value)} id="gstin" placeholder=" " className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white uppercase" />
                <label htmlFor="gstin" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1A56DB]">GSTIN (Optional)</label>
              </div>

              <div className="relative">
                <select value={stateReg} onChange={e => setStateReg(e.target.value)} id="state" className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white font-medium appearance-none">
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                  <option>Gujarat</option>
                  <option>Tamil Nadu</option>
                </select>
                <label htmlFor="state" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-[#1A56DB]">State of Registration</label>
              </div>

              <div className="relative">
                <select value={turnover} onChange={e => setTurnover(e.target.value)} id="turnover" className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white font-medium appearance-none">
                  <option>&lt; 5 Cr</option>
                  <option>5 Cr - 50 Cr</option>
                  <option>&gt; 50 Cr</option>
                </select>
                <label htmlFor="turnover" className="absolute left-4 top-2 text-[10px] font-bold uppercase tracking-wider text-[#1A56DB]">Annual Turnover</label>
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" size="lg" className="flex-[2]" loading={loading} icon={<CheckCircle2 size={18} />}>
                  Create Account
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm font-medium text-slate-500 mt-8">
            Already have an account? <Link to="/login" className="text-[#1A56DB] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
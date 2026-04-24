import { useState } from 'react';
import { ShieldCheck, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

function Field({ label, icon: Icon, type, placeholder, value, onChange, required, show, onToggleShow }) {
  const isPassword = type === 'password' || (type === 'text' && show !== undefined);
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type={show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full p-4 pl-11 pr-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {show !== undefined && (
          <button type="button" onClick={onToggleShow} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Signup() {
  const [form, setForm] = useState({ business_name: '', email: '', gstin: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();
  const { login }             = useAuth();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/signup', {
        business_name: form.business_name,
        email: form.email,
        gstin: form.gstin || null,
        password: form.password,
      });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-10">

          {/* Brand */}
          <div className="flex flex-col items-center mb-9">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Business Account</h1>
            <p className="text-slate-500 text-sm mt-1.5">Join MSMEs simplifying their GST compliance</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-5 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Business Name" icon={Building2} type="text" placeholder="e.g. Khanna Manufacturing Ltd" value={form.business_name} onChange={set('business_name')} required />
            </div>
            <Field label="Email Address" icon={Mail} type="email" placeholder="owner@business.com" value={form.email} onChange={set('email')} required />
            <Field label="GSTIN (Optional)" icon={ShieldCheck} type="text" placeholder="27AAAAA0000A1Z5" value={form.gstin} onChange={set('gstin')} />
            <Field label="Password" icon={Lock} type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required show={showPw} onToggleShow={() => setShowPw(v => !v)} />
            <Field label="Confirm Password" icon={Lock} type="password" placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} required show={showPw} onToggleShow={() => setShowPw(v => !v)} />

            <div className="sm:col-span-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-300 disabled:opacity-60 group"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                  : <><span>Get Started for Free</span><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
                }
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign in here</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by end-to-end encryption · GST Helper.AI
        </p>
      </div>
    </div>
  );
}
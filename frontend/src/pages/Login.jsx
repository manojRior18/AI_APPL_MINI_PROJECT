import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();
  const { login }             = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-10">

          {/* Brand */}
          <div className="flex flex-col items-center mb-9">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-blue-200 mb-4">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your GST compliance dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-5 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="owner@msme.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-300 disabled:opacity-60 group"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <><span>Sign In</span><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to the platform?{' '}
            <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by end-to-end encryption · GST Helper.AI
        </p>
      </div>
    </div>
  );
}
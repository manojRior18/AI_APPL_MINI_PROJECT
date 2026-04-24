import { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, FileWarning, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_COLORS = {
  Matched:            { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  Mismatch:           { bar: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700' },
  'Missing in Portal':{ bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  'Missing in Books': { bar: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  Pending:            { bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600' },
};

function StatCard({ title, value, sub, icon: Icon, accent, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${accent.bg}`}>
          <Icon size={20} className={accent.text} />
        </div>
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${accent.badge}`}>{sub}</span>
      </div>
      {loading ? (
        <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg mt-1" />
      ) : (
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      )}
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
    </div>
  );
}

function MiniBar({ label, value, total, colorClass }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-36 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-600 w-8 text-right">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Could not reach backend. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const s = stats || {};
  const total = s.total_invoices || 0;

  const cards = [
    {
      title: 'Total Invoices',
      value: total,
      sub: `+${s.pending || 0} pending`,
      icon: TrendingUp,
      accent: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    },
    {
      title: 'Verified Matches',
      value: s.matched || 0,
      sub: `${s.compliance_score || 0}% accuracy`,
      icon: CheckCircle2,
      accent: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    },
    {
      title: 'Mismatches',
      value: s.mismatches || 0,
      sub: 'Action required',
      icon: AlertCircle,
      accent: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
    },
    {
      title: 'Pending Review',
      value: s.pending || 0,
      sub: 'Awaiting reconcile',
      icon: Clock,
      accent: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Compliance Overview</h2>
          <p className="text-slate-500 mt-1 text-sm">
            AI-driven reconciliation dashboard
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                — last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-blue-300 transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Two Column Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Compliance Score Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Compliance Score</p>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={
                    (s.compliance_score || 0) >= 80 ? '#10B981'
                    : (s.compliance_score || 0) >= 50 ? '#F59E0B'
                    : '#EF4444'
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (s.compliance_score || 0) / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900">{loading ? '–' : `${s.compliance_score || 0}%`}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500 text-center">
              {(s.compliance_score || 0) >= 90 ? '✅ Excellent compliance' :
               (s.compliance_score || 0) >= 70 ? '⚠️ Needs attention' :
               '❌ Action required'}
            </p>
          </div>
        </div>

        {/* Breakdown Bars */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-5">Status Breakdown</p>
          <div className="space-y-3.5">
            <MiniBar label="Matched"             value={s.matched || 0}            total={total} colorClass="bg-emerald-500" />
            <MiniBar label="Mismatch"            value={s.mismatches || 0}         total={total} colorClass="bg-rose-500" />
            <MiniBar label="Missing in Portal"   value={s.missing_in_portal || 0}  total={total} colorClass="bg-amber-400" />
            <MiniBar label="Missing in Books"    value={s.missing_in_books || 0}   total={total} colorClass="bg-violet-500" />
            <MiniBar label="Pending"             value={s.pending || 0}            total={total} colorClass="bg-slate-400" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-400">Total Tax Exposure</p>
            <p className="text-sm font-extrabold text-slate-800">
              ₹{loading ? '—' : (s.total_tax_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Action Banner ────────────────────────────────────────── */}
      {(s.mismatches > 0 || s.missing_in_portal > 0) && !loading && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-7 text-white shadow-xl flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white/10 p-3.5 rounded-full shrink-0">
              <FileWarning size={28} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">
                {(s.mismatches || 0) + (s.missing_in_portal || 0)} invoice{((s.mismatches || 0) + (s.missing_in_portal || 0)) !== 1 ? 's' : ''} require attention
              </h3>
              <p className="text-slate-400 mt-0.5 max-w-lg text-sm">
                Our AI detected discrepancies between your uploaded invoices and the GST portal data.
                Resolve these to maximise your Input Tax Credit.
              </p>
            </div>
          </div>
          <Link
            to="/reports"
            className="shrink-0 flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 text-sm"
          >
            Review Now <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
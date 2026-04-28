import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, FileText, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../api';
import { Card, Badge, Skeleton, EmptyState, Button } from '../components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, analRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/analytics')
        ]);
        setData(dashRes.data);
        setAnalytics(analRes.data);
        localStorage.setItem('gst_compliance_score', dashRes.data.compliance_score);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height="140px" rounded="lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-4"><Skeleton height="320px" rounded="lg" /></div>
          <div className="col-span-8"><Skeleton height="320px" rounded="lg" /></div>
        </div>
      </div>
    );
  }

  // Fallback defaults
  const d = data || { total_invoices: 0, matched: 0, mismatches: 0, pending: 0, compliance_score: 0 };
  const a = analytics || { monthly_uploads: [], status_pie: [], top_vendors: [], tax_trend: [] };

  const gaugeColor = d.compliance_score > 80 ? '#10B981' : d.compliance_score > 50 ? '#F59E0B' : '#EF4444';
  const gaugeDashOffset = 502 - (502 * d.compliance_score) / 100;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Welcome back. Here is your GST compliance summary.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload"><Button variant="primary">Upload Invoice</Button></Link>
        </div>
      </div>

      {/* ── KPI ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover padding="none" className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20}/></div>
            <Badge variant="success"><ArrowUpRight size={14} className="mr-1"/> 12%</Badge>
          </div>
          <div className="mt-4">
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 count-animate">{d.total_invoices}</p>
          </div>
        </Card>

        <Card hover padding="none" className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20}/></div>
            <Badge variant="success"><ArrowUpRight size={14} className="mr-1"/> 8%</Badge>
          </div>
          <div className="mt-4">
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Verified Matches</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 count-animate">{d.matched}</p>
          </div>
        </Card>

        <Card hover padding="none" className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle size={20}/></div>
            <Badge variant="danger"><ArrowDownRight size={14} className="mr-1"/> -2%</Badge>
          </div>
          <div className="mt-4">
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Tax Discrepancies</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 count-animate">{d.mismatches}</p>
          </div>
        </Card>

        <Card hover padding="none" className="p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20}/></div>
            <Badge variant="neutral">—</Badge>
          </div>
          <div className="mt-4">
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 count-animate">{d.pending}</p>
          </div>
        </Card>
      </div>

      {/* ── CHARTS ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gauge Chart (Left 4/12) */}
        <Card className="col-span-1 lg:col-span-4 flex flex-col items-center justify-center text-center relative" padding="lg">
          <h3 className="absolute top-6 left-6 text-sm font-bold text-slate-800">Compliance Score</h3>
          <div className="relative mt-8">
            <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#F1F5F9" strokeWidth="16" />
              <circle 
                cx="100" cy="100" r="80" 
                fill="none" 
                stroke={gaugeColor} 
                strokeWidth="16" 
                strokeLinecap="round"
                strokeDasharray="502"
                strokeDashoffset={gaugeDashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
              <span className="text-5xl font-extrabold text-slate-800 tracking-tighter count-animate">{d.compliance_score}%</span>
            </div>
          </div>
          <Badge variant="neutral" className="mt-6 mb-4">FY 2024-25 · Q4</Badge>
          <Link to="/reports"><Button variant="secondary" size="sm">Run Reconciliation</Button></Link>
        </Card>

        {/* Bar Chart (Right 8/12) */}
        <Card className="col-span-1 lg:col-span-8 flex flex-col justify-between" padding="lg">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-slate-800">Monthly Filing Activity</h3>
            <Badge variant="neutral">Last 6 Months</Badge>
          </div>
          
          {a.monthly_uploads.length > 0 ? (
            <div className="flex-1 flex items-end justify-between gap-4 pt-10 px-4 h-48 border-b border-slate-100 pb-2">
              {a.monthly_uploads.slice(-6).map((monthData, idx) => {
                const maxCount = Math.max(...a.monthly_uploads.map(m => m.count));
                const heightPct = Math.max((monthData.count / maxCount) * 100, 5);
                return (
                  <div key={idx} className="flex flex-col items-center w-full group">
                    <div className="tooltip" data-tip={`${monthData.count} Invoices | ₹${monthData.tax_amount?.toFixed(0) || 0} Tax`}>
                      <div 
                        className="w-12 bg-blue-100 rounded-t-md group-hover:bg-[#1A56DB] transition-all duration-300 relative overflow-hidden" 
                        style={{ height: `${heightPct}%`, minHeight: '20px' }}
                      >
                        <div className="absolute bottom-0 w-full bg-[#1A56DB] transition-all duration-500" style={{ height: '0%' }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-3">{monthData.month.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No activity data" description="Upload invoices to generate monthly insights." className="h-48 border-none" />
          )}
        </Card>
      </div>

      {/* ── WARNING BANNER ────────────────────────────────────────────────── */}
      {d.mismatches > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-[#0A1628] rounded-2xl p-6 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="text-rose-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Action Required: {d.mismatches} Mismatches Detected</h3>
              <p className="text-slate-400 text-sm mt-1">Resolve these discrepancies to ensure accurate GSTR-2B matching.</p>
            </div>
          </div>
          <Link to="/reports"><Button variant="danger" className="shadow-rose-900/50">Review Now →</Button></Link>
        </div>
      )}

    </div>
  );
}
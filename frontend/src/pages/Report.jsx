import { useState, useEffect } from 'react';
import { Download, RefreshCw, Filter, ChevronDown, AlertTriangle, CheckCircle2, AlertCircle, HelpCircle, Clock } from 'lucide-react';
import api from '../api';

const STATUS_META = {
  'Matched':             { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2,  dot: 'bg-emerald-500' },
  'Mismatch':            { color: 'bg-rose-100 text-rose-700',       icon: AlertTriangle, dot: 'bg-rose-500' },
  'Missing in Portal':   { color: 'bg-amber-100 text-amber-700',     icon: AlertCircle,   dot: 'bg-amber-400' },
  'Missing in Books':    { color: 'bg-violet-100 text-violet-700',   icon: HelpCircle,    dot: 'bg-violet-500' },
  'Pending':             { color: 'bg-slate-100 text-slate-600',     icon: Clock,         dot: 'bg-slate-400' },
};

const FILTERS = ['All', 'Matched', 'Mismatch', 'Missing in Portal', 'Missing in Books', 'Pending'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

export default function Report() {
  const [results, setResults]     = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter]       = useState('All');
  const [error, setError]         = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reconcile');
      setResults(res.data.results || []);
      setSummary(res.data.summary || null);
      setHasLoaded(true);
    } catch (e) {
      setError('Could not run reconciliation. Ensure the API server is running and invoices have been uploaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = 'GST_Reconciliation_Report.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed. Make sure there are uploaded invoices.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { runReconciliation(); }, []);

  const filtered = filter === 'All' ? results : results.filter(r => r.status === filter);

  const fmt = (val) =>
    val != null
      ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reconciliation Report</h2>
          <p className="text-slate-500 text-sm mt-1">Compare your uploaded invoices against GST portal records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runReconciliation}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Reconcile
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || results.length === 0}
            className="flex items-center gap-2 text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Summary Chips ───────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total',             val: summary.total,             dot: 'bg-slate-400' },
            { label: 'Matched',           val: summary.matched,           dot: 'bg-emerald-500' },
            { label: 'Mismatch',          val: summary.mismatch,          dot: 'bg-rose-500' },
            { label: 'Missing Portal',    val: summary.missing_in_portal, dot: 'bg-amber-400' },
            { label: 'Missing Books',     val: summary.missing_in_books,  dot: 'bg-violet-500' },
            { label: 'Score',             val: `${summary.compliance_score}%`, dot: 'bg-blue-500' },
          ].map(({ label, val, dot }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">{val ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Invoice No.', 'GSTIN', 'Type', 'Taxable Value', 'Tax Amount', 'Status', 'Remarks'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 animate-pulse rounded-md" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-400 font-medium">
                    {hasLoaded
                      ? 'No records match the current filter.'
                      : 'Upload invoices and click Reconcile to see results.'}
                  </td>
                </tr>
              )}
              {!loading && filtered.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs">{row.invoice_number}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{row.gstin}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      row.invoice_type === 'sales' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'
                    }`}>{row.invoice_type || 'purchase'}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-semibold">{fmt(row.taxable_value)}</td>
                  <td className="px-5 py-4 text-slate-700 font-semibold">{fmt(row.tax_amount)}</td>
                  <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">{row.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Filing CTA ──────────────────────────────────────────── */}
      {summary && summary.compliance_score >= 80 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-7 text-white flex items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold">Ready for Tax Filing?</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">
              Compliance score is {summary.compliance_score}%. 
              {summary.mismatch > 0 || summary.missing_in_portal > 0
                ? ` Resolve the remaining ${(summary.mismatch || 0) + (summary.missing_in_portal || 0)} issue(s) to reach 100%.`
                : ' All invoices are reconciled — you are ready to file GSTR-1.'}
            </p>
          </div>
          <button className="shrink-0 bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/30">
            Finalise GSTR-1 Draft
          </button>
        </div>
      )}
    </div>
  );
}
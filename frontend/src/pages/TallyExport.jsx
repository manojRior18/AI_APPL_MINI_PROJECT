import React, { useState, useEffect } from 'react';
import { Plug, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Download, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { Card, Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { useToast } from '../hooks/useToast';

export default function TallyExport() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const { showToast } = useToast();
  
  // Tally Connection State
  const [tallyUrl, setTallyUrl] = useState(localStorage.getItem('gst_tally_url') || 'http://localhost:9000');
  const [companyName, setCompanyName] = useState(localStorage.getItem('gst_tally_company') || '');
  const [companies, setCompanies] = useState([]);
  const [connStatus, setConnStatus] = useState('idle'); // idle, testing, connected, error
  const [connError, setConnError] = useState('');
  
  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterTally, setFilterTally] = useState('All');
  
  // Export Progress
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportResults, setExportResults] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchInvoices();
    if (tallyUrl) handleTestConnection();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', { params: { page_size: 100 } });
      setInvoices(res.data.items || []);
    } catch (err) {
      setError("Failed to load invoices.");
      showToast("Error fetching invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    setConnError('');
    try {
      const res = await api.get('/tally/test', { params: { tally_url: tallyUrl } });
      if (res.data.connected) {
        setConnStatus('connected');
        setCompanies(res.data.companies || []);
        localStorage.setItem('gst_tally_url', tallyUrl);
        localStorage.setItem('gst_tally_connected', 'true');
        if (res.data.companies?.length > 0 && !companyName) {
          setCompanyName(res.data.companies[0]);
        }
      } else {
        setConnStatus('error');
        setConnError(res.data.error || 'Failed to connect to TallyPrime');
        localStorage.setItem('gst_tally_connected', 'false');
      }
    } catch (err) {
      setConnStatus('error');
      setConnError('Could not reach backend or Tally service.');
      localStorage.setItem('gst_tally_connected', 'false');
    }
  };

  const handlePushBatch = async (oneByOne = false) => {
    if (!companyName) {
      showToast("Please select a Tally company first.", "warning");
      return;
    }
    
    setExporting(true);
    setExportResults(null);
    setExportProgress({ current: 0, total: selectedIds.length });
    
    try {
      if (oneByOne) {
        let results = [];
        let successCount = 0;
        for (let i = 0; i < selectedIds.length; i++) {
          const id = selectedIds[i];
          setExportProgress(prev => ({ ...prev, current: i + 1 }));
          try {
            const res = await api.post(`/tally/push/${id}`, { company_name: companyName });
            results.push({ ...res.data, invoice_id: id });
            successCount++;
          } catch (err) {
            results.push({ 
              success: false, 
              invoice_id: id, 
              message: err.response?.data?.detail || "Export failed",
              invoice_number: invoices.find(inv => inv.id === id)?.invoice_number || 'Unknown'
            });
          }
        }
        setExportResults({
          success_count: successCount,
          failed_count: selectedIds.length - successCount,
          results: results
        });
      } else {
        const res = await api.post('/tally/push-batch', {
          invoice_ids: selectedIds,
          company_name: companyName
        });
        setExportResults(res.data);
      }
      fetchInvoices(); // Refresh to show new statuses
      showToast(`Batch export completed: ${res?.data?.success_count || 0} success`, "success");
    } catch (err) {
      showToast("Batch export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const downloadErrorLog = () => {
    if (!exportResults) return;
    const failed = exportResults.results.filter(r => !r.success);
    const csvContent = "Invoice No,Message\n" + failed.map(r => `${r.invoice_number},"${r.message}"`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally_errors_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  let filteredInvoices = invoices;
  if (filterType !== 'All') filteredInvoices = filteredInvoices.filter(i => i.invoice_type === filterType.toLowerCase());
  if (filterTally !== 'All') {
    const status = filterTally === 'Not Exported' ? 'Not Exported' : filterTally === 'Failed' ? 'Failed' : 'Exported';
    filteredInvoices = filteredInvoices.filter(i => (i.tally_status || 'Not Exported') === status);
  }

  const TallyStatusBadge = ({ status }) => {
    const s = status || 'Not Exported';
    if (s === 'Exported') return <Badge variant="success" dot>Exported</Badge>;
    if (s === 'Failed') return <Badge variant="danger" dot>Failed</Badge>;
    return <Badge variant="neutral" dot>Not Exported</Badge>;
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">TallyPrime Export</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Sync your reconciled invoices directly to TallyPrime.</p>
        </div>
        <Badge variant={connStatus === 'connected' ? 'success' : 'danger'}>
          {connStatus === 'connected' ? 'Tally Connected' : 'Tally Disconnected'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── SECTION A: Connection Panel ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="lg" className="shadow-sm border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Plug size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">TallyPrime Connection</h3>
                <p className="text-xs text-slate-500 font-medium">Configure local XML API</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tally URL</label>
                  <div className="group relative">
                    <Info size={12} className="text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      TallyPrime must be open with XML API enabled in F12 &gt; Configure &gt; Advanced Config &gt; Enable ODBC Server: Yes
                    </div>
                  </div>
                </div>
                <input 
                  type="text" 
                  value={tallyUrl}
                  onChange={(e) => setTallyUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A56DB] outline-none"
                  placeholder="http://localhost:9000"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Company Name</label>
                {companies.length > 0 ? (
                  <select 
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      localStorage.setItem('gst_tally_company', e.target.value);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A56DB] outline-none appearance-none"
                  >
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A56DB] outline-none"
                    placeholder="Auto-fills after connection"
                  />
                )}
              </div>

              <Button 
                variant="primary" 
                className="w-full py-3" 
                onClick={handleTestConnection}
                loading={connStatus === 'testing'}
                icon={<RefreshCw size={16} />}
              >
                Test Connection
              </Button>
            </div>

            {/* Status Strip */}
            <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
              connStatus === 'connected' ? 'bg-emerald-50 border-emerald-100' :
              connStatus === 'error' ? 'bg-rose-50 border-rose-100' :
              connStatus === 'testing' ? 'bg-blue-50 border-blue-100' :
              'bg-slate-50 border-slate-100'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                connStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connStatus === 'error' ? 'bg-rose-500' :
                connStatus === 'testing' ? 'bg-blue-500 animate-bounce' :
                'bg-slate-300'
              }`} />
              <span className={`text-xs font-bold ${
                connStatus === 'connected' ? 'text-emerald-700' :
                connStatus === 'error' ? 'text-rose-700' :
                connStatus === 'testing' ? 'text-blue-700' :
                'text-slate-500'
              }`}>
                {connStatus === 'connected' ? `Connected · ${companies.length} companies found` :
                 connStatus === 'error' ? 'Connection Failed' :
                 connStatus === 'testing' ? 'Testing connection…' :
                 'Not connected'}
              </span>
            </div>

            {connStatus === 'error' && (
              <div className="mt-4 space-y-2">
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center justify-between w-full text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  Troubleshooting Steps {showHelp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                {showHelp && (
                  <div className="p-3 bg-white border border-rose-100 rounded-xl space-y-2 text-[11px] text-slate-600 font-medium animate-in slide-in-from-top-2">
                    <p>1. Open TallyPrime on this computer</p>
                    <p>2. Go to F12 &gt; Configure &gt; Advanced Configuration</p>
                    <p>3. Set 'Enable ODBC Server' to Yes</p>
                    <p>4. Note the port (default: 9000)</p>
                    <p>5. Ensure your firewall isn't blocking port 9000</p>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {exportResults && (
            <Card padding="lg" className="border-slate-200 animate-in zoom-in-95">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                Export Results 
                <Badge variant={exportResults.failed_count > 0 ? 'warning' : 'success'}>
                  {exportResults.success_count} OK / {exportResults.failed_count} Failed
                </Badge>
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {exportResults.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[11px]">
                    <span className="font-bold text-slate-700">#{r.invoice_number}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 truncate max-w-[100px]">{r.message}</span>
                      {r.success ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-rose-500" />}
                    </div>
                  </div>
                ))}
              </div>
              {exportResults.failed_count > 0 && (
                <Button variant="secondary" size="sm" className="w-full mt-4" onClick={downloadErrorLog} icon={<Download size={14}/>}>
                  Download Error Log
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* ── SECTION B: Invoice Selection Table ─────────────────────────── */}
        <div className="lg:col-span-8">
          <Card padding="none" className="shadow-sm border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['All', 'Not Exported', 'Failed', 'Exported'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setFilterTally(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTally === tab ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                >
                  <option>All Types</option>
                  <option>Purchase</option>
                  <option>Sales</option>
                </select>
                <span className="text-xs font-bold text-slate-400">
                  {selectedIds.length} of {filteredInvoices.length} selected
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-[#1A56DB] focus:ring-[#1A56DB]"
                      />
                    </th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Invoice No.</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Party / Vendor</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tally Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}><td colSpan="6" className="p-4"><Skeleton height="32px" rounded="lg" /></td></tr>
                    ))
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(inv.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(inv.id)}
                            onChange={() => toggleSelect(inv.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#1A56DB] focus:ring-[#1A56DB]"
                          />
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800">{inv.invoice_number}</td>
                        <td className="p-4 text-sm font-medium text-slate-600 truncate max-w-[180px]">{inv.vendor_name || inv.gstin || 'Unknown'}</td>
                        <td className="p-4">
                          <Badge variant={inv.invoice_type === 'purchase' ? 'info' : 'warning'}>
                            {inv.invoice_type?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-900">₹{inv.total_amount?.toLocaleString() || '0'}</td>
                        <td className="p-4"><TallyStatusBadge status={inv.tally_status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <EmptyState 
                          icon={<Plug />} 
                          title="No invoices to sync" 
                          description="Try changing the filters or upload more invoices." 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* ── SECTION C: Export Actions Bar (Sticky) ─────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[1000px] px-6 z-50">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center gap-4 ml-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold">{selectedIds.length} invoices selected</p>
                <p className="text-[11px] text-slate-400 font-medium">Ready to push to TallyPrime · {companyName || 'No company selected'}</p>
              </div>
            </div>

            {exporting ? (
              <div className="flex flex-col items-end gap-2 px-4 w-64">
                <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Exporting...</span>
                  <span>{exportProgress.current} / {exportProgress.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-slate-800 border-white/5 hover:bg-slate-700 text-white"
                  onClick={() => handlePushBatch(true)}
                  disabled={connStatus !== 'connected'}
                >
                  Push One-by-One
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-500 px-6"
                  onClick={() => handlePushBatch(false)}
                  disabled={connStatus !== 'connected'}
                  icon={<ArrowRight size={16}/>}
                >
                  Push to Tally
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, RefreshCw, UploadCloud, Eye, Pencil, FileText, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../api';
import { Card, Badge, Button, Modal, EmptyState, Skeleton } from '../components/ui';

export default function Report() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Sorting
  const [sortCol, setSortCol] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [portalFile, setPortalFile] = useState(null);
  const [uploadingPortal, setUploadingPortal] = useState(false);
  
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reconcile');
      setInvoices(res.data.results || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const handlePortalUpload = async () => {
    if (!portalFile) return;
    setUploadingPortal(true);
    try {
      const formData = new FormData();
      formData.append('file', portalFile);
      await api.post('/reconcile/upload-portal-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadModalOpen(false);
      setPortalFile(null);
      fetchReconciliation();
    } catch (error) {
      alert(error.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingPortal(false);
    }
  };

  const handleExport = () => {
    window.location.href = 'http://localhost:8000/export';
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  // Filtering & Sorting Logic
  let filtered = invoices;
  if (activeTab !== 'All') {
    filtered = filtered.filter(i => i.status === activeTab);
  }
  if (searchQ) {
    const q = searchQ.toLowerCase();
    filtered = filtered.filter(i => 
      (i.invoice_number?.toLowerCase() || '').includes(q) || 
      (i.gstin?.toLowerCase() || '').includes(q) ||
      (i.vendor_name?.toLowerCase() || '').includes(q)
    );
  }
  filtered.sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalResults = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const StatusBadge = ({ status }) => {
    if (status === 'Matched') return <Badge variant="success" dot>Matched</Badge>;
    if (status === 'Mismatch') return <Badge variant="danger" dot>Mismatch</Badge>;
    if (status === 'Missing in Portal') return <Badge variant="warning" dot>Missing in Portal</Badge>;
    if (status === 'Missing in Books') return <Badge variant="info" dot>Missing in Books</Badge>;
    return <Badge variant="neutral" dot>{status || 'Pending'}</Badge>;
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reconciliation Report</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Compare internal books against GST portal data.</p>
      </div>

      {/* ── SUMMARY MINI CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Matched', val: summary.matched || 0, color: 'text-emerald-600' },
          { label: 'Mismatches', val: summary.mismatches || 0, color: 'text-rose-600' },
          { label: 'Missing (Portal)', val: summary.missing_in_portal || 0, color: 'text-amber-600' },
          { label: 'Missing (Books)', val: summary.missing_in_books || 0, color: 'text-sky-600' },
          { label: 'Score', val: `${summary.compliance_score || 0}%`, color: 'text-[#1A56DB]' },
        ].map((s, i) => (
          <Card key={i} padding="sm" className="flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            <span className={`text-xl font-extrabold ${s.color}`}>{loading ? '-' : s.val}</span>
          </Card>
        ))}
      </div>

      {/* ── FILTER & ACTIONS BAR ──────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-none w-full lg:w-auto p-1">
          {['All', 'Matched', 'Mismatch', 'Missing in Portal', 'Missing in Books'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto px-2 pb-2 lg:p-0">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search invoice or GSTIN..." 
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1A56DB] outline-none"
            />
          </div>
          
          <Button variant="secondary" onClick={() => setUploadModalOpen(true)} icon={<UploadCloud size={16}/>}>Upload CSV</Button>
          <Button variant="secondary" onClick={handleExport} icon={<Download size={16}/>}>Export</Button>
          <Button variant="primary" onClick={fetchReconciliation} loading={loading} icon={<RefreshCw size={16}/>}>Run Recon</Button>
        </div>
      </div>

      {/* ── DATA TABLE ────────────────────────────────────────────────────── */}
      <Card padding="none" className="overflow-hidden flex flex-col border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">#</th>
                {[
                  { key: 'invoice_number', label: 'Invoice No.' },
                  { key: 'vendor_name', label: 'Vendor' },
                  { key: 'gstin', label: 'GSTIN' },
                  { key: 'taxable_value', label: 'Taxable' },
                  { key: 'tax_amount', label: 'Tax' },
                  { key: 'status', label: 'Status' }
                ].map(col => (
                  <th 
                    key={col.key} 
                    className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                    onClick={() => toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <span className="text-slate-300 group-hover:text-slate-500">
                        {sortCol === col.key ? (sortAsc ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : <span className="w-[14px]"></span>}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                    <td className="p-4"><Skeleton height="20px" rounded="sm" /></td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 text-sm text-slate-400 font-mono text-center">{(page-1)*pageSize + idx + 1}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{inv.invoice_number || '—'}</td>
                    <td className="p-4 text-sm font-medium text-slate-600 truncate max-w-[150px]">{inv.vendor_name || '—'}</td>
                    <td className="p-4 text-sm font-mono text-slate-500">{inv.gstin || '—'}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">₹{inv.taxable_value?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">₹{inv.tax_amount?.toFixed(2) || '0.00'}</td>
                    <td className="p-4"><StatusBadge status={inv.status} /></td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => { setSelectedInvoice(inv); setDetailModalOpen(true); }} className="p-2 text-slate-400 hover:text-[#1A56DB] hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-0">
                    <EmptyState 
                      icon={<FileText />} 
                      title="No invoices found" 
                      description={searchQ ? `No results match "${searchQ}"` : "Upload invoices or portal CSV to see reconciliation data."} 
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalResults > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50">
            <span className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{(page-1)*pageSize + 1}</span> to <span className="font-bold text-slate-800">{Math.min(page*pageSize, totalResults)}</span> of <span className="font-bold text-slate-800">{totalResults}</span> results
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalResults}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── PORTAL UPLOAD MODAL ───────────────────────────────────────────── */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload GST Portal Data">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Download the GSTR-2B CSV from the official GST portal and upload it here to reconcile against your books.</p>
          
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50">
            <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={(e) => setPortalFile(e.target.files[0])} />
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-[#1A56DB]">
              <UploadCloud size={24} />
            </div>
            {portalFile ? (
              <div className="text-center">
                <p className="font-bold text-slate-800">{portalFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(portalFile.size/1024).toFixed(1)} KB</p>
                <label htmlFor="csv-upload" className="text-sm text-[#1A56DB] font-bold cursor-pointer hover:underline mt-2 inline-block">Change file</label>
              </div>
            ) : (
              <>
                <label htmlFor="csv-upload" className="text-sm font-bold text-slate-800 cursor-pointer hover:text-[#1A56DB]">Click to browse</label>
                <p className="text-xs text-slate-500 mt-1">CSV files only</p>
              </>
            )}
          </div>

          <Button variant="primary" className="w-full" onClick={handlePortalUpload} disabled={!portalFile} loading={uploadingPortal}>
            Upload and Reconcile
          </Button>
        </div>
      </Modal>

      {/* ── DETAIL MODAL ──────────────────────────────────────────────────── */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Reconciliation Details">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
                <p className="text-xl font-extrabold text-slate-800">{selectedInvoice.invoice_number}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            {selectedInvoice.status === 'Mismatch' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={20} className="text-rose-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-800">Tax Amount Mismatch Detected</p>
                  <p className="text-xs text-rose-600 mt-1">The tax amount in your books does not match the GSTR-2B portal data.</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <div className="grid grid-cols-3 bg-slate-100/80 p-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Books</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Portal Data</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-3 p-3 text-sm">
                  <span className="font-semibold text-slate-600">GSTIN</span>
                  <span className="font-mono text-slate-800">{selectedInvoice.gstin || '—'}</span>
                  <span className="font-mono text-slate-800">{selectedInvoice.gstin || '—'}</span>
                </div>
                <div className="grid grid-cols-3 p-3 text-sm">
                  <span className="font-semibold text-slate-600">Taxable Value</span>
                  <span className="font-bold text-slate-800">₹{selectedInvoice.taxable_value?.toFixed(2) || '0.00'}</span>
                  <span className="font-bold text-slate-800">₹{selectedInvoice.external_taxable?.toFixed(2) || '0.00'}</span>
                </div>
                <div className={`grid grid-cols-3 p-3 text-sm ${selectedInvoice.status === 'Mismatch' ? 'bg-rose-50/50' : ''}`}>
                  <span className="font-semibold text-slate-600">Tax Amount</span>
                  <span className={`font-bold ${selectedInvoice.status === 'Mismatch' ? 'text-rose-600' : 'text-slate-800'}`}>₹{selectedInvoice.tax_amount?.toFixed(2) || '0.00'}</span>
                  <span className="font-bold text-slate-800">₹{selectedInvoice.external_tax?.toFixed(2) || '0.00'}</span>
                </div>

              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Badge variant="neutral">OCR Engine: PaddleOCR</Badge>
              <Button variant="secondary" size="sm" onClick={() => setDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
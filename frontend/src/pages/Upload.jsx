import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File as FileIcon, CheckCircle2, ChevronRight, Check, X, ShieldCheck, Eye, List, Search, Pencil, Save, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import api from '../api';
import { useToast } from '../hooks/useToast';

export default function Upload() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]); // Array of { file, status }
  const [invoiceType, setInvoiceType] = useState('purchase');
  const [batchResults, setBatchResults] = useState([]);
  
  // Processing state
  const [processStep, setProcessStep] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [rawText, setRawText] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  
  // Edit state
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

   const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleFileDrop = (e) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    setStep(2);
    setProcessStep(0);
    
    const timers = [];
    timers.push(setTimeout(() => setProcessStep(1), 1000));
    timers.push(setTimeout(() => setProcessStep(2), 2500));
    timers.push(setTimeout(() => setProcessStep(3), 4000));
    
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      
      const res = await api.post(`/upload?invoice_type=${invoiceType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      timers.push(setTimeout(() => {
        setProcessStep(4);
        setBatchResults(res.data.results);
        setTimeout(() => setStep(3), 800);
      }, 5500));
    } catch (error) {
      timers.forEach(clearTimeout);
      showToast(error.response?.data?.detail || "Upload failed", "error");
      setStep(1);
    }
  };

  const handleSaveEdit = async (field) => {
    if (editValues[field] === extractedData[field]) {
      setEditingField(null);
      return;
    }
    setSavingEdit(true);
    try {
      await api.patch(`/invoices/${invoiceId}`, { [field]: editValues[field] });
      setExtractedData(prev => ({ ...prev, [field]: editValues[field] }));
      setEditingField(null);
    } catch (err) {
      showToast("Failed to update field", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setBatchResults([]);
    setStep(1);
    setProcessStep(0);
  };

  // Processing UI Steps Config
  const stepsConfig = [
    { id: 1, label: 'Uploading document...', icon: UploadCloud },
    { id: 2, label: 'Running OCR engine...', icon: Eye },
    { id: 3, label: 'Extracting fields...', icon: List },
    { id: 4, label: 'Validating GST rules...', icon: ShieldCheck },
  ];

  const EditableRow = ({ label, field, isNumeric }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 group">
      <span className="text-sm font-semibold text-slate-500 w-1/3">{label}</span>
      {editingField === field ? (
        <div className="flex items-center gap-2 w-2/3 justify-end">
          <input 
            type={isNumeric ? 'number' : 'text'}
            value={editValues[field] || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, [field]: isNumeric ? parseFloat(e.target.value) : e.target.value }))}
            className="w-full text-sm font-bold text-slate-800 bg-blue-50 border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            autoFocus
          />
          <button onClick={() => handleSaveEdit(field)} disabled={savingEdit} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors">
            {savingEdit ? <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
          </button>
          <button onClick={() => { setEditingField(null); setEditValues(prev => ({...prev, [field]: extractedData[field]})); }} className="p-1.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 w-2/3 justify-end">
          <span className="text-sm font-bold text-slate-800 text-right truncate">
            {isNumeric ? `₹${extractedData[field]?.toFixed(2) || '0.00'}` : (extractedData[field] || '—')}
          </span>
          <button onClick={() => setEditingField(field)} className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
            <Pencil size={14} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Invoice</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Extract data and validate GST compliance instantly.</p>
      </div>

      <Card className="relative overflow-hidden min-h-[500px] flex flex-col" padding="none">
        
        {/* ── STEP 1: SELECT FILE ────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            
            {/* Invoice Type Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-full mb-8">
              <button onClick={() => setInvoiceType('purchase')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${invoiceType === 'purchase' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Purchase</button>
              <button onClick={() => setInvoiceType('sales')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${invoiceType === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sales</button>
            </div>

            {files.length === 0 ? (
              <>
                <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleFileDrop}
                  className="w-full max-w-2xl border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.png,.jpg,.jpeg" multiple />
                  
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 shadow-inner">
                    <UploadCloud size={36} className="text-[#1A56DB]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Click or drag files to upload</h3>
                  <p className="text-slate-500 font-medium text-sm text-center">Support for multiple PDFs, PNGs, JPGs up to 20MB each</p>
                </div>
              </>
            ) : (
              <div className="w-full max-w-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-full max-h-[300px] overflow-y-auto space-y-3 mb-8 pr-2 scrollbar-thin">
                  {files.map((f, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <FileIcon size={20} className="text-[#1A56DB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={18}/></button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4 w-full max-w-md">
                   <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()}>Add More</Button>
                   <Button variant="primary" className="flex-2" onClick={startProcessing} icon={<Search size={18}/>}>
                    Process {files.length} {files.length === 1 ? 'Invoice' : 'Invoices'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PROCESSING OVERLAY ─────────────────────────────── */}
        {step === 2 && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-sm">
              <div className="flex justify-center mb-10">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-[#1A56DB] rounded-full animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">Analyzing Document</h3>
              
              <div className="space-y-4">
                {stepsConfig.map((s, i) => {
                  const isDone = processStep > i;
                  const isCurrent = processStep === i;
                  return (
                    <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${isDone ? 'bg-emerald-50 border-emerald-200' : isCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-50'}`}>
                      {isDone ? (
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0 animate-in zoom-in" />
                      ) : (
                        <s.icon size={20} className={`shrink-0 ${isCurrent ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                      )}
                      <span className={`text-sm font-bold ${isDone ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center animate-in fade-in delay-1000">
                <Badge variant="neutral" dot>Powered by PaddleOCR</Badge>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ────────────────────────────────────────── */}
        {step === 3 && batchResults.length > 0 && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Batch Processing Complete</h2>
                  <p className="text-xs text-slate-500 font-medium">{batchResults.filter(r => r.success).length} of {batchResults.length} invoices processed successfully</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reset}>New Batch</Button>
                <Button variant="primary" onClick={() => navigate('/reports')}>View in Reports →</Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {batchResults.map((res, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className={`p-4 flex items-center justify-between ${res.success ? 'bg-emerald-50/30' : 'bg-rose-50/30'}`}>
                    <div className="flex items-center gap-3">
                      {res.success ? <CheckCircle2 className="text-emerald-500" size={20} /> : <X className="text-rose-500" size={20} />}
                      <div>
                        <p className="text-sm font-bold text-slate-800">{res.filename}</p>
                        {res.success ? (
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Inv: {res.data.invoice_number} • {res.data.vendor_name}</p>
                        ) : (
                          <p className="text-[10px] font-bold text-rose-500 uppercase">Error: {res.error}</p>
                        )}
                      </div>
                    </div>
                    {res.success && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Value</p>
                          <p className="text-sm font-extrabold text-slate-800">₹{res.data.total_amount?.toFixed(2)}</p>
                        </div>
                        <div className="w-24 text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>
                          <p className={`text-sm font-extrabold ${res.validation.confidence_score > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{res.validation.confidence_score}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {res.success && res.validation.errors.length > 0 && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      {res.validation.errors.map((err, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-100 text-rose-700 text-[9px] font-bold rounded-lg">{err}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
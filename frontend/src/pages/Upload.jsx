import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File as FileIcon, CheckCircle2, ChevronRight, Check, X, ShieldCheck, Eye, List, Search, Pencil, Save, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import api from '../api';

export default function Upload() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [invoiceType, setInvoiceType] = useState('purchase');
  
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

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const startProcessing = async () => {
    if (!file) return;
    setStep(2);
    setProcessStep(0);
    
    // Simulate animated steps
    const timers = [];
    timers.push(setTimeout(() => setProcessStep(1), 800));
    timers.push(setTimeout(() => setProcessStep(2), 1600));
    timers.push(setTimeout(() => setProcessStep(3), 2400));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/upload?invoice_type=${invoiceType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      timers.push(setTimeout(() => {
        setProcessStep(4);
        setExtractedData(res.data.data);
        setEditValues(res.data.data); // Initialize editable values
        setValidation(res.data.validation);
        setRawText(res.data.raw_text_preview);
        setInvoiceId(res.data.invoice_id);
        setTimeout(() => setStep(3), 600);
      }, 3200));
    } catch (error) {
      timers.forEach(clearTimeout);
      alert(error.response?.data?.detail || "Upload failed");
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
      alert("Failed to update field");
    } finally {
      setSavingEdit(false);
    }
  };

  const reset = () => {
    setFile(null);
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

            {!file ? (
              <>
                <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleFileDrop}
                  className="w-full max-w-2xl border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                  
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 shadow-inner">
                    <UploadCloud size={36} className="text-[#1A56DB]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Click or drag file to upload</h3>
                  <p className="text-slate-500 font-medium text-sm text-center">Support for PDF, PNG, JPG up to 20MB</p>
                </div>
                <button className="mt-6 text-sm font-bold text-[#1A56DB] hover:underline flex items-center gap-1">Or try a sample invoice <ChevronRight size={16}/></button>
              </>
            ) : (
              <div className="w-full max-w-lg flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                    <FileIcon size={24} className="text-[#1A56DB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><X size={20}/></button>
                </div>
                <Button variant="primary" size="lg" className="w-full max-w-xs" onClick={startProcessing} icon={<Search size={18}/>}>
                  Process with AI →
                </Button>
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
        {step === 3 && extractedData && (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Extraction Complete</h2>
                  <p className="text-xs text-slate-500 font-medium">Invoice processed in 3.2s</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reset}>Upload Another</Button>
                <Button variant="primary" onClick={() => navigate('/reports')}>Go to Reports →</Button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
              
              {/* Extracted Data Form */}
              <div className="p-6 border-r border-slate-100 overflow-y-auto max-h-[600px] scrollbar-none">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Extracted Data</h3>
                  <Badge variant="info">Editable</Badge>
                </div>
                <div className="space-y-1">
                  <EditableRow label="Invoice Number" field="invoice_number" />
                  <EditableRow label="Vendor Name" field="vendor_name" />
                  <EditableRow label="Supplier GSTIN" field="supplier_gstin" />
                  <EditableRow label="Buyer GSTIN" field="buyer_gstin" />
                  <EditableRow label="HSN Code" field="hsn_code" />
                  <EditableRow label="Invoice Date" field="date" />
                  <EditableRow label="Taxable Value" field="taxable_value" isNumeric />
                  <EditableRow label="CGST Amount" field="cgst_amount" isNumeric />
                  <EditableRow label="SGST Amount" field="sgst_amount" isNumeric />
                  <EditableRow label="IGST Amount" field="igst_amount" isNumeric />
                  <EditableRow label="Total Amount" field="total_amount" isNumeric />
                </div>
              </div>

              {/* Validation Report */}
              <div className="p-6 bg-slate-50/30 overflow-y-auto max-h-[600px] scrollbar-none">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-6">Validation Report</h3>
                
                {/* Confidence Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-600">AI Confidence</span>
                    <span className="text-sm font-extrabold text-[#1A56DB]">{validation?.confidence_score}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-[#1A56DB] rounded-full transition-all duration-1000" style={{ width: `${validation?.confidence_score}%` }} />
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {validation?.errors?.map((err, idx) => (
                    <div key={`err-${idx}`} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl shadow-sm">
                      <X size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-rose-700">{err}</p>
                    </div>
                  ))}
                  {validation?.warnings?.map((warn, idx) => (
                    <div key={`warn-${idx}`} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl shadow-sm">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-amber-700">{warn}</p>
                    </div>
                  ))}
                  {validation?.is_valid && validation?.errors?.length === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-emerald-700">All GST compliance checks passed!</p>
                    </div>
                  )}
                </div>

                {/* Raw Text Accordion */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button onClick={() => setShowRaw(!showRaw)} className="flex items-center justify-between w-full p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700">View Raw OCR Text</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
                  </button>
                  {showRaw && (
                    <div className="p-4 border-t border-slate-100 bg-slate-900">
                      <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed h-48 overflow-y-auto scrollbar-none">
                        {rawText || "No raw text available."}
                      </pre>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
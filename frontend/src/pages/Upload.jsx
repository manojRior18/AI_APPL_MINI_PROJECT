import { useState, useRef, useCallback } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X, Loader2, Eye } from 'lucide-react';
import api from '../api';

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];
const ALLOWED_EXT = '.pdf, .png, .jpg, .jpeg, .tiff, .bmp';

function ConfidenceBadge({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-emerald-700 bg-emerald-100' : pct >= 50 ? 'text-amber-700 bg-amber-100' : 'text-rose-700 bg-rose-100';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>
      {pct}% confidence
    </span>
  );
}

function DataRow({ label, value, mono }) {
  if (!value || value === 'UNKNOWN' || value === 'NOT_FOUND') return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function ValidationBadge({ items, type }) {
  if (!items?.length) return null;
  const styles = {
    error:   'bg-rose-50 border-rose-200 text-rose-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-3 mt-3 ${styles[type]}`}>
      {items.map((msg, i) => (
        <p key={i} className="text-xs flex items-start gap-2">
          <span className="mt-0.5 shrink-0">{type === 'error' ? '✗' : '⚠'}</span>
          {msg}
        </p>
      ))}
    </div>
  );
}

export default function Upload() {
  const [file, setFile]           = useState(null);
  const [isDragging, setDragging] = useState(false);
  const [invoiceType, setType]    = useState('purchase');
  const [processing, setProcessing] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [showRaw, setShowRaw]     = useState(false);
  const inputRef = useRef(null);

  const selectFile = (f) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type) && !f.name.match(/\.(pdf|png|jpe?g|tiff?|bmp)$/i)) {
      setError('Unsupported file type. Please upload a PDF or image.');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/upload?invoice_type=${invoiceType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please check the server is running.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(null); };

  return (
    <div className="max-w-3xl mx-auto space-y-7">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upload Invoice</h2>
        <p className="text-slate-500 mt-1 text-sm">Upload a GST invoice (PDF or image) for AI-powered OCR extraction and compliance validation.</p>
      </div>

      {/* ── Invoice Type Toggle ─────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['purchase', 'sales'].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
              invoiceType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Dropzone ────────────────────────────────────────────── */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`bg-white border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group ${
            isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/60'
          }`}
        >
          <div className={`p-4 rounded-2xl mb-4 transition-all ${isDragging ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'}`}>
            <UploadCloud size={36} className={`transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
          </div>
          <p className="text-base font-bold text-slate-700">Drag & drop or <span className="text-blue-600">browse</span></p>
          <p className="text-sm text-slate-400 mt-1">Supports: {ALLOWED_EXT}</p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXT}
            className="hidden"
            onChange={e => selectFile(e.target.files[0])}
          />
        </div>
      ) : (
        /* ── File Preview ───────────────────────────────────────── */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-xl">
            <FileText size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · {invoiceType} invoice</p>
          </div>
          <button onClick={reset} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Action Button ───────────────────────────────────────── */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={processing}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 active:scale-[0.99] transition-all shadow-lg disabled:opacity-60"
        >
          {processing ? (
            <><Loader2 size={18} className="animate-spin" /> AI is processing…</>
          ) : (
            <><UploadCloud size={18} /> Process with AI</>
          )}
        </button>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Result Card ─────────────────────────────────────────── */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center gap-3 border-b border-slate-100 ${result.validation?.is_valid ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {result.validation?.is_valid
              ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              : <AlertCircle  size={20} className="text-rose-600 shrink-0" />}
            <div className="flex-1">
              <p className={`font-extrabold text-sm ${result.validation?.is_valid ? 'text-emerald-800' : 'text-rose-800'}`}>
                {result.validation?.is_valid ? 'Extraction successful — Invoice is valid' : 'Extracted with validation issues'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Invoice ID: #{result.invoice_id}</p>
            </div>
            <ConfidenceBadge score={result.data?.confidence_score || 0} />
          </div>

          {/* Extracted Data */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Extracted Fields</p>
            <DataRow label="GSTIN"          value={result.data?.gstin}            mono />
            <DataRow label="Invoice No."    value={result.data?.invoice_number}   mono />
            <DataRow label="Date"           value={result.data?.date} />
            <DataRow label="Taxable Value"  value={result.data?.taxable_value != null ? `₹${Number(result.data.taxable_value).toLocaleString('en-IN')}` : null} />
            <DataRow label="Tax Amount"     value={result.data?.tax_amount != null ? `₹${Number(result.data.tax_amount).toLocaleString('en-IN')}` : null} />
            <DataRow label="Total Amount"   value={result.data?.total_amount != null ? `₹${Number(result.data.total_amount).toLocaleString('en-IN')}` : null} />
            {result.validation?.tax_rate_detected != null && (
              <DataRow label="GST Rate Detected" value={`${result.validation.tax_rate_detected}%`} />
            )}
          </div>

          {/* Validation Messages */}
          {(result.validation?.errors?.length > 0 || result.validation?.warnings?.length > 0) && (
            <div className="px-6 pb-5">
              <ValidationBadge items={result.validation?.errors}   type="error" />
              <ValidationBadge items={result.validation?.warnings} type="warning" />
            </div>
          )}

          {/* Raw Text Toggle */}
          {result.raw_text_preview && (
            <div className="px-6 pb-5 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Eye size={14} /> {showRaw ? 'Hide' : 'Show'} raw OCR text
              </button>
              {showRaw && (
                <pre className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                  {result.raw_text_preview}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-all"
            >
              Upload Another
            </button>
            <a
              href="/reports"
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold text-center hover:bg-slate-800 transition-all"
            >
              View in Reports →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
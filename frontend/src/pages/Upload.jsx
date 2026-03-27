import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate processing [cite: 30]
    setTimeout(() => {
      setIsUploading(false);
      setResult({ gstin: "27AAAAA0000A1Z5", status: "Success" });
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4 hover:border-blue-400 transition-colors cursor-pointer group">
        <div className="bg-blue-50 p-4 rounded-full group-hover:scale-110 transition-transform">
          <UploadIcon className="text-blue-600 w-10 h-10" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800">Upload Invoice</h3>
          <p className="text-slate-400 text-sm">Drag and drop or click to browse (PDF, PNG, JPG) [cite: 17]</p>
        </div>
        <button 
          onClick={handleUpload}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
        >
          {isUploading ? "AI Processing..." : "Process with AI"}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4"
          >
            <CheckCircle className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-900">Extracted Successfully [cite: 18]</h4>
              <p className="text-emerald-700 text-sm mt-1">Found GSTIN: {result.gstin}. Field validation complete[cite: 19].</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
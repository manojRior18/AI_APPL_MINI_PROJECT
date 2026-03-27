// import { motion } from 'framer-motion';
// import { Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
// import * as XLSX from 'xlsx';

// const exportToExcel = () => {
//   const data = [
//     { InvoiceID: "INV-001", GSTIN: "27AAAAA0000A1Z5", Status: "Matched", Tax: 500 },
//     { InvoiceID: "INV-002", GSTIN: "27BBBBB0000B1Z5", Status: "Mismatched", Tax: 1200 },
//   ];
//   const worksheet = XLSX.utils.json_to_sheet(data);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "GST_Report");
//   XLSX.writeFile(workbook, "GST_Reconciliation_March.xlsx");
// };

// export default function Report() {
//   const mockData = [
//     { id: 1, inv: "INV-99", gstin: "27BKZPM...", status: "Mismatch", diff: "₹450.00" },
//     { id: 2, inv: "INV-102", gstin: "07AAGCM...", status: "Missing in Portal", diff: "₹12,400.00" },
//   ];

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }} 
//       animate={{ opacity: 1 }}
//       className="max-w-6xl mx-auto"
//     >
//       <div className="flex justify-between items-end mb-8">
//         <div>
//           <h2 className="text-3xl font-bold text-slate-900">Compliance Reports</h2>
//           <p className="text-slate-500">Generate and export GSTR-2B reconciliation summaries[cite: 20, 36].</p>
//         </div>
//         <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md">
//           <FileSpreadsheet size={20} /> Export to Excel (.xlsx)
//         </button>
//       </div>

//       <div className="grid grid-cols-1 gap-4">
//         {mockData.map((item) => (
//           <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-rose-50 rounded-full text-rose-600">
//                 <AlertTriangle size={24} />
//               </div>
//               <div>
//                 <h4 className="font-bold text-slate-800">{item.inv}</h4>
//                 <p className="text-sm text-slate-400">Vendor: {item.gstin}</p>
//               </div>
//             </div>
            
//             <div className="text-right">
//               <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-md">
//                 {item.status}
//               </span>
//               <p className="text-lg font-mono font-bold text-slate-900 mt-1">{item.diff}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
//         <div className="relative z-10">
//           <h3 className="text-xl font-bold mb-2">Ready for Tax Filing?</h3>
//           <p className="text-slate-400 mb-6 max-w-md">Your reconciliation for March 2026 is 85% complete. Resolve the 2 flagged mismatches to achieve 100% compliance.</p>
//           <button className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-semibold transition-colors">
//             Finalize GSTR-1 Draft
//           </button>
//         </div>
//         {/* Background Decorative Element */}
//         <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
//       </div>
//     </motion.div>
//   );
// }


import { Download, Table as TableIcon, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Report() {
  const exportToExcel = () => {
  const data = [
    { InvoiceID: "INV-001", GSTIN: "27AAAAA0000A1Z5", Status: "Matched", Tax: 500 },
    { InvoiceID: "INV-002", GSTIN: "27BBBBB0000B1Z5", Status: "Mismatched", Tax: 1200 },
  ];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "GST_Report");
  XLSX.writeFile(workbook, "GST_Reconciliation_March.xlsx");
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reconciliation Report</h2>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all"
        >
          <Download size={18} /> Export to Excel
        </button>
      </div>
      
      {/* Table goes here - connect to backend data */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Invoice ID</th>
              <th className="px-6 py-4">Vendor GSTIN</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-6 py-4 font-medium">INV-2024-001</td>
              <td className="px-6 py-4">27AAAAA0000A1Z5</td>
              <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Matched</span></td>
              <td className="px-6 py-4"><button className="text-blue-600 text-sm font-bold">View Details</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
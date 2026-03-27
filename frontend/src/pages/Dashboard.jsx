import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, CheckCircle2, FileWarning } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: "Total Invoices", value: "128", trend: "+12 this week", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Verified Matches", value: "112", trend: "87.5% Accuracy", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Mismatches Flagged", value: "16", trend: "Action Required", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-slate-900">Compliance Overview</h2>
        <p className="text-slate-500 mt-1">AI-driven reconciliation status for March 2026</p>
      </motion.div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className={`text-sm mt-4 font-medium ${stat.color}`}>{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Action Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-6">
          <div className="bg-white/10 p-4 rounded-full backdrop-blur-md">
            <FileWarning size={32} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">16 Mismatches Require Attention</h3>
            <p className="text-slate-400 mt-1 max-w-lg text-sm">Our AI detected discrepancies between your uploaded purchases and the GSTR-2B portal data. Resolve these to maximize your Input Tax Credit.</p>
          </div>
        </div>
        <button className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">
          Review Mismatches
        </button>
      </motion.div>
    </div>
  );
}
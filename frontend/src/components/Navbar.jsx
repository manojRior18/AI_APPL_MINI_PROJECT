import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, ShieldCheck, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../App';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard',        section: 'main' },
  { to: '/upload',  icon: UploadCloud,     label: 'Upload Invoices',  section: 'main' },
  { to: '/reports', icon: FileText,        label: 'Reconciliation',   section: 'main' },
  { to: '/settings',icon: Settings,        label: 'Settings',         section: 'bottom' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    const score = parseFloat(localStorage.getItem('gst_compliance_score')) || 0;
    setComplianceScore(score);
  }, [location.pathname]); // Refresh on route change

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainItems  = NAV_ITEMS.filter(n => n.section === 'main');
  const bottomItems = NAV_ITEMS.filter(n => n.section === 'bottom');

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm relative ${
          isActive
            ? 'bg-blue-600/10 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-[#1A56DB] rounded-r-full" />}
        <Icon size={18} className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
        {label}
        <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
      </Link>
    );
  };

  const initials = user?.business_name?.charAt(0)?.toUpperCase() || 'G';

  let healthColor = 'bg-rose-500';
  if (complianceScore > 50) healthColor = 'bg-amber-500';
  if (complianceScore > 80) healthColor = 'bg-emerald-500';

  return (
    <nav className="fixed left-0 top-0 h-screen w-[260px] bg-[#0A1628] border-r border-slate-800/80 flex flex-col z-50 select-none">

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-7 border-b border-slate-800">
        <div className="relative">
          <div className="bg-gradient-to-br from-[#1A56DB] to-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A1628] animate-pulse" />
        </div>
        <div>
          <h1 className="text-[15px] font-extrabold text-white tracking-tight leading-none">GST Helper<span className="text-blue-400">.AI</span></h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Compliance Suite</p>
        </div>
      </div>

      {/* ── Main Nav ───────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-5 space-y-1 overflow-y-auto scrollbar-none">
        <p className="px-4 text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">Main Menu</p>
        {mainItems.map(item => <NavItem key={item.to} {...item} />)}

        {/* ── Health Widget ──────────────────────────────────────── */}
        <div className="mt-6 px-4 py-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-slate-400">Filing Health</p>
            <p className="text-xs font-bold text-white">{complianceScore}%</p>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${healthColor} transition-all duration-1000 ease-out`} style={{ width: `${complianceScore}%` }} />
          </div>
        </div>

        {/* Divider */}
        <div className="pt-5 mt-5 border-t border-slate-800/70">
          <p className="px-4 text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">Account</p>
          {bottomItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>
      </div>

      {/* ── User Profile Card ──────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 mb-3 relative">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-extrabold text-sm shadow-inner shrink-0 border border-slate-600/50">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate">{user?.business_name || 'Business'}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold tracking-wider uppercase">Pro</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-sm font-bold"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, ShieldCheck, Settings, LogOut } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col z-50">
      <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-800">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">GST Helper<span className="text-blue-500">.AI</span></h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">Main Menu</p>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/upload" icon={UploadCloud} label="Upload Invoices" />
        <NavItem to="/reports" icon={FileText} label="Reconciliation" />
      </div>

      <div className="px-4 py-6 border-t border-slate-800 space-y-2">
        <NavItem to="/settings" icon={Settings} label="Settings" />
        <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
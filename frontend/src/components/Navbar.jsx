// import { Link, useLocation } from 'react-router-dom';
// import { 
//   LayoutDashboard, 
//   UploadCloud, 
//   FileText, 
//   ShieldCheck, 
//   Settings, 
//   LogOut, 
//   LogIn,    // Added
//   UserPlus  // Added
// } from 'lucide-react';

// export default function Navbar() {
//   const location = useLocation();

//   const NavItem = ({ to, icon: Icon, label }) => {
//     const isActive = location.pathname === to;
//     return (
//       <Link 
//         to={to} 
//         className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
//           isActive 
//             ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
//             : 'text-slate-400 hover:bg-slate-800 hover:text-white'
//         }`}
//       >
//         <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
//         {label}
//       </Link>
//     );
//   };

//   return (
//     <nav className="fixed left-0 top-0 h-screen w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col z-50">
//       <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-800">
//         <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
//           <ShieldCheck className="text-white w-6 h-6" />
//         </div>
//         <h1 className="text-xl font-bold text-white tracking-tight">GST Helper<span className="text-blue-500">.AI</span></h1>
//       </div>

//       <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
//         <p className="px-4 text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">Main Menu</p>
//         <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
//         <NavItem to="/upload" icon={UploadCloud} label="Upload Invoices" />
//         <NavItem to="/reports" icon={FileText} label="Reconciliation" />
        
//         {/* Added Login and Signup here */}
//         <div className="pt-4 mt-4 border-t border-slate-800/50">
//           <p className="px-4 text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">Auth</p>
//           <NavItem to="/login" icon={LogIn} label="Login" />
//           <NavItem to="/signup" icon={UserPlus} label="Signup" />
//         </div>
//       </div>

//       <div className="px-4 py-6 border-t border-slate-800 space-y-2">
//         <NavItem to="/settings" icon={Settings} label="Settings" />
//         <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium">
//           <LogOut size={20} />
//           Sign Out
//         </button>
//       </div>
//     </nav>
//   );
// }


import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, ShieldCheck, Settings, LogOut } from 'lucide-react';
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
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-800/40'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={18} className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
        {label}
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300" />}
      </Link>
    );
  };

  const initials = user?.business_name?.charAt(0)?.toUpperCase() || 'G';

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-[#0B1120] border-r border-slate-800/80 flex flex-col z-50 select-none">

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-7 border-b border-slate-800">
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B1120]" />
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

        {/* Divider */}
        <div className="pt-5 mt-2 border-t border-slate-800/70">
          <p className="px-4 text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">Account</p>
          {bottomItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>
      </div>

      {/* ── User Profile Card ──────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-inner shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.business_name || 'Business'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-sm font-bold"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
// import { Bell, Search, ChevronDown } from 'lucide-react';

// export default function Header() {
//   return (
//     <header className="h-20 border-b border-slate-200 bg-white/70 backdrop-blur-lg sticky top-0 z-40 flex items-center justify-between px-10">
//       <div className="relative w-[400px]">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//         <input 
//           type="text" 
//           placeholder="Search GSTINs, Invoices, or Vendors..." 
//           className="w-full bg-slate-100/50 border border-slate-200 rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
//         />
//       </div>
      
//       <div className="flex items-center gap-6">
//         <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
//           <Bell size={22} />
//           <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
//         </button>
        
//         <div className="h-8 w-[1px] bg-slate-200"></div>
        
//         <div className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-slate-200">
//           <img src="https://ui-avatars.com/api/?name=Acme+Corp&background=0D8ABC&color=fff" alt="Profile" className="w-9 h-9 rounded-full shadow-sm" />
//           <div className="text-left hidden md:block">
//             <p className="text-sm font-bold text-slate-700 leading-tight">Acme Corp</p>
//             <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Premium Plan</p>
//           </div>
//           <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
//         </div>
//       </div>
//     </header>
//   );
// }


import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, User, Settings as SettingsIcon, LogOut, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

const MOCK_ALERTS = [
  { id: 1, type: 'error',   text: '3 invoices have tax rate mismatches',      time: '2m ago' },
  { id: 2, type: 'warning', text: 'INV-2024-007 is missing from GST portal',  time: '18m ago' },
  { id: 3, type: 'success', text: 'Reconciliation completed — 87% matched',   time: '1h ago' },
];

const DOT = { error: 'bg-rose-500', warning: 'bg-amber-400', success: 'bg-emerald-500' };

export default function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [query, setQuery]             = useState('');
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.business_name?.charAt(0)?.toUpperCase() || 'G';

  return (
    <header className="h-[68px] border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8 gap-6">

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="relative w-[380px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search GSTINs, invoices, vendors…"
          className="w-full bg-slate-100 border border-transparent rounded-full py-2.5 pl-11 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
        {query && (
          <div className="absolute top-[calc(100%+8px)] w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Search Results</p>
            <p className="text-sm text-slate-500 italic">No matching invoices or GSTINs found for "{query}".</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {/* ── Notifications ──────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
            className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>

          {showNotifs && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-extrabold text-slate-800">Alerts</p>
                <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">{MOCK_ALERTS.length} new</span>
              </div>
              <div className="divide-y divide-slate-100">
                {MOCK_ALERTS.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[alert.type]}`} />
                    <div>
                      <p className="text-sm text-slate-700 leading-snug">{alert.text}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <button className="text-xs text-blue-600 font-bold hover:underline">View all alerts →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="h-6 w-px bg-slate-200" />

        {/* ── Profile ────────────────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-slate-700 leading-tight">{user?.business_name || 'Business'}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">GSTIN Active</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.business_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1.5">
                <Link to="/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium">
                  <SettingsIcon size={15} /> Settings
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium border-t border-slate-100 mt-1">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
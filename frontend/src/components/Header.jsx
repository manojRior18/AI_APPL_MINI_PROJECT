import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, Settings as SettingsIcon, LogOut, X, UploadCloud, FileText, Download, LayoutDashboard, Calendar, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

const MOCK_ALERTS = [
  { id: 1, type: 'error',   text: '3 invoices have tax rate mismatches',      time: '2m ago' },
  { id: 2, type: 'warning', text: 'INV-2024-007 is missing from GST portal',  time: '18m ago' },
  { id: 3, type: 'success', text: 'Reconciliation completed — 87% matched',   time: '1h ago' },
];

const DOT = { error: 'bg-rose-500', warning: 'bg-amber-400', success: 'bg-emerald-500' };

const QUICK_ACTIONS = [
  { id: 'upload', icon: UploadCloud, label: 'Upload Invoice', to: '/upload' },
  { id: 'reconcile', icon: FileText, label: 'Run Reconciliation', to: '/reports' },
  { id: 'export', icon: Download, label: 'Export Report', href: 'http://localhost:8000/export' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'View Dashboard', to: '/' },
];

export default function Header({ onMenuClick }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [fyOpen, setFyOpen] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (searchFocused) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSearchIndex(prev => (prev < QUICK_ACTIONS.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSearchIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && searchIndex >= 0) {
          e.preventDefault();
          const action = QUICK_ACTIONS[searchIndex];
          if (action.to) navigate(action.to);
          else if (action.href) window.location.href = action.href;
          setSearchFocused(false);
          inputRef.current?.blur();
        } else if (e.key === 'Escape') {
          setSearchFocused(false);
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchFocused, searchIndex, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.business_name?.charAt(0)?.toUpperCase() || 'G';

  return (
    <>
      <header className="h-[68px] border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 gap-4 ml-0 lg:ml-[260px]">
        
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu size={22} />
        </button>

        {/* ── Search ──────────────────────────────────────────────── */}
        <div className="relative w-full max-w-[400px]" ref={searchRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or jump to..."
            className="w-full bg-slate-100 border border-transparent rounded-full py-2 pl-11 pr-16 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white transition-all font-medium"
            onFocus={() => { setSearchFocused(true); setSearchIndex(-1); }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 opacity-60">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-200 rounded text-slate-500">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-200 rounded text-slate-500">K</kbd>
          </div>

          {searchFocused && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="px-3 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Actions</p>
              <div className="flex flex-col gap-1">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={action.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      searchIndex === idx ? 'bg-blue-50 text-[#1A56DB]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setSearchIndex(idx)}
                    onClick={() => {
                      if (action.to) navigate(action.to);
                      else if (action.href) window.location.href = action.href;
                      setSearchFocused(false);
                    }}
                  >
                    <action.icon size={16} className={searchIndex === idx ? 'text-[#1A56DB]' : 'text-slate-400'} />
                    {action.label}
                    {searchIndex === idx && <span className="ml-auto text-[10px] text-[#1A56DB]">↵ Enter</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">

          {/* ── FY Selector ──────────────────────────────────────── */}
          <div className="relative">
            <button 
              onClick={() => setFyOpen(!fyOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-all"
            >
              <Calendar size={14} className="text-slate-400" />
              FY 2024-25
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {fyOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-40 bg-white border border-slate-200 shadow-xl rounded-xl py-1 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold bg-blue-50/50 text-[#1A56DB]">FY 2024-25</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-medium">FY 2023-24</button>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* ── Notifications ──────────────────────────────────────── */}
          <button
            onClick={() => setShowNotifs(true)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* ── Profile ────────────────────────────────────────────── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1A56DB] to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
                {initials}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {showProfile && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.business_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
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

      {/* ── Slide-in Notification Panel ───────────────────────── */}
      {showNotifs && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowNotifs(false)} />
          <div className="relative w-96 bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
                <p className="text-sm text-slate-500 mt-1">You have {MOCK_ALERTS.length} unread alerts</p>
              </div>
              <button onClick={() => setShowNotifs(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {MOCK_ALERTS.map(alert => (
                <div key={alert.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'error' ? 'bg-rose-100 text-rose-600' : alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">{alert.text}</p>
                    <p className="text-xs text-slate-400">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button className="w-full py-3 text-sm font-bold text-[#1A56DB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
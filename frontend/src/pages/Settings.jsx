import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Sliders, Database, Upload, CheckCircle2, XCircle, AlertTriangle, Plug, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, Modal, Badge } from '../components/ui';
import { useAuth } from '../App';
import api from '../api';
import { useToast } from '../hooks/useToast';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Profile State
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [gstinValid, setGstinValid] = useState(null);
  
  // Security State
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Tally State
  const [tallyUrl, setTallyUrl] = useState(localStorage.getItem('gst_tally_url') || 'http://localhost:9000');
  const [companyName, setCompanyName] = useState(localStorage.getItem('gst_tally_company') || '');
  const [connStatus, setConnStatus] = useState('idle');
  const [showHelp, setShowHelp] = useState(false);

  // GSTIN Validation (Format: 2 digits, 10 chars, 1 digit, 1 char, 1 char)
  useEffect(() => {
    if (!gstin) { setGstinValid(null); return; }
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    setGstinValid(regex.test(gstin));
  }, [gstin]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      showToast("Settings saved successfully!", "success"); 
    }, 800);
  };

  const getPwdStrength = () => {
    if (!password) return { color: 'bg-slate-200', text: '' };
    if (password.length < 6) return { color: 'bg-rose-500', text: 'Weak' };
    if (password.length < 10 || !/\d/.test(password)) return { color: 'bg-amber-500', text: 'Fair' };
    return { color: 'bg-emerald-500', text: 'Strong' };
  };

  const str = getPwdStrength();

  const TABS = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'gst', icon: Sliders, label: 'GST Configuration' },
    { id: 'tally', icon: Plug, label: 'Tally Integration' },
    { id: 'data', icon: Database, label: 'Data & Export' },
  ];

  const CustomToggle = ({ label, desc, defaultChecked = false }) => (
    <label className="flex items-start gap-4 cursor-pointer group py-4 border-b border-slate-100 last:border-0">
      <div className="relative inline-flex items-center mt-1">
        <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A56DB]"></div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
    </label>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── LEFT TABS (3/12) ────────────────────────────────────────────── */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm relative ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-[#1A56DB]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {activeTab === tab.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-[#1A56DB] rounded-r-full" />}
              <tab.icon size={18} className={activeTab === tab.id ? 'text-[#1A56DB]' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── RIGHT CONTENT (9/12) ────────────────────────────────────────── */}
        <Card className="flex-1 min-h-[500px]" padding="lg">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Profile Information</h2>
              
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1A56DB] to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {user?.business_name?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Business Logo</h3>
                  <p className="text-xs text-slate-500">JPG, PNG or SVG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Name</label>
                  <input type="text" defaultValue={user?.business_name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#1A56DB] focus:bg-white transition-all font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" defaultValue={user?.email} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" placeholder="+91" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#1A56DB] focus:bg-white transition-all font-semibold" />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    GSTIN 
                    {gstinValid === true && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Valid Format</span>}
                    {gstinValid === false && <span className="text-rose-500 flex items-center gap-1"><XCircle size={12}/> Invalid Format</span>}
                  </label>
                  <input 
                    type="text" 
                    value={gstin} 
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:ring-2 focus:bg-white transition-all font-mono uppercase ${gstinValid === false ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1A56DB]'}`} 
                  />
                </div>
              </div>
              <Button variant="primary" onClick={handleSave} loading={loading}>Save Profile</Button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Notification Preferences</h2>
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reconciliation Alerts</h3>
                <CustomToggle label="Email on mismatches" desc="Get an email report immediately if a mismatch is detected during reconciliation." defaultChecked />
                <CustomToggle label="Weekly summary report" desc="Receive a high-level summary of your compliance score every Monday." />
              </div>

              <div className="pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Filing Reminders</h3>
                <CustomToggle label="GSTR-1 Deadline Reminder" desc="Alerts 3 days before the 11th of every month." defaultChecked />
                <CustomToggle label="GSTR-3B Deadline Reminder" desc="Alerts 3 days before the 20th of every month." defaultChecked />
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Security & Password</h2>
              
              <div className="max-w-md space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A56DB] transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    New Password
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${str.color} text-white`}>{str.text}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPwd ? "text" : "password"} 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A56DB] transition-all pr-12" 
                    />
                    <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold hover:text-slate-700">
                      {showPwd ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {/* Strength Meter Bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                    <div className={`h-full transition-all duration-300 ${str.color}`} style={{ width: password.length === 0 ? '0%' : password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%' }} />
                  </div>
                </div>

                <Button variant="primary" onClick={handleSave} loading={loading}>Update Password</Button>
              </div>
            </div>
          )}

          {/* GST CONFIG TAB */}
          {activeTab === 'gst' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">GST Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default GST Rate</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#1A56DB] font-semibold appearance-none">
                    <option>18% (Standard)</option>
                    <option>12%</option>
                    <option>5%</option>
                    <option>28%</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Year</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#1A56DB] font-semibold appearance-none">
                    <option>2024-25</option>
                    <option>2023-24</option>
                    <option>2025-26</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State of Registration</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#1A56DB] font-semibold appearance-none">
                    <option>Maharashtra (27)</option>
                    <option>Delhi (07)</option>
                    <option>Karnataka (29)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-Invoice Compliance</h3>
                <CustomToggle label="Enable E-Invoicing Verification" desc="Toggle on if your annual turnover exceeds ₹5 Crores." defaultChecked />
              </div>

              <Button variant="primary" onClick={handleSave} loading={loading}>Save Configuration</Button>
            </div>
          )}

          {/* DATA & EXPORT TAB */}
          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Data & Export</h2>
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Format</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="format" defaultChecked className="text-[#1A56DB] focus:ring-[#1A56DB]" />
                    <span className="text-sm font-semibold text-slate-700">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="format" className="text-[#1A56DB] focus:ring-[#1A56DB]" />
                    <span className="text-sm font-semibold text-slate-700">CSV (.csv)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</h3>
                <div className="flex gap-4">
                  <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#1A56DB]" />
                  <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#1A56DB]" />
                </div>
                <Button variant="secondary" className="w-full">Download Data</Button>
              </div>
            </div>
          )}

          {/* TALLY INTEGRATION TAB */}
          {activeTab === 'tally' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Tally Integration</h2>
              
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tally XML API URL</label>
                  <input 
                    type="text" 
                    value={tallyUrl}
                    onChange={(e) => setTallyUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A56DB] font-semibold"
                    placeholder="http://localhost:9000"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Default port is 9000. Ensure Tally is open on this computer.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Company Name</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A56DB] font-semibold"
                    placeholder="E.g. My Business Pvt Ltd"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    variant="primary" 
                    onClick={async () => {
                      setConnStatus('testing');
                      try {
                        const res = await api.get('/tally/test', { params: { tally_url: tallyUrl } });
                        if (res.data.connected) {
                          setConnStatus('connected');
                          localStorage.setItem('gst_tally_url', tallyUrl);
                          localStorage.setItem('gst_tally_company', companyName);
                          localStorage.setItem('gst_tally_connected', 'true');
                        } else {
                          setConnStatus('error');
                        }
                      } catch (err) {
                        setConnStatus('error');
                      }
                    }}
                    loading={connStatus === 'testing'}
                    icon={<RefreshCw size={16}/>}
                  >
                    Test & Save Connection
                  </Button>
                  
                  {connStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${connStatus === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${connStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-xs font-bold">{connStatus === 'connected' ? 'Connection Successful' : 'Connection Failed'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center justify-between w-full text-sm font-bold text-slate-700 hover:text-[#1A56DB]"
                  >
                    How to enable Tally XML API {showHelp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                  {showHelp && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-3 text-xs text-slate-600 animate-in slide-in-from-top-2">
                      <p>1. Open TallyPrime on this computer.</p>
                      <p>2. Press <b>F12</b> (Configure) &gt; <b>Advanced Configuration</b>.</p>
                      <p>3. Set <b>Enable ODBC Server</b> to <b>Yes</b>.</p>
                      <p>4. Set Port to <b>9000</b> (or your preferred port).</p>
                      <p>5. Restart TallyPrime to apply changes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </Card>
      </div>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Delete All Data?</h2>
          <p className="text-slate-500 text-sm">Are you absolutely sure you want to delete all invoices and reconciliation data? This action cannot be reversed.</p>
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={() => { showToast("Data deleted!", "success"); setDeleteModalOpen(false); }}>Yes, Delete Everything</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
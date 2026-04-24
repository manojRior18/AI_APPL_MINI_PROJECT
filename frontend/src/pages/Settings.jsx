import { useState } from 'react';
import { User, Bell, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../App';

function Section({ icon: Icon, title, desc, children, accent = 'blue' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-5 p-6 text-left hover:bg-slate-50/70 transition-colors group"
      >
        <div className={`p-3 rounded-xl bg-${accent}-50 text-${accent}-600 shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
        </div>
        <span className={`text-xs font-bold text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function InputRow({ label, type = 'text', defaultValue, placeholder }) {
  return (
    <div className="mt-4">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>
  );
}

function SaveButton({ label = 'Save Changes' }) {
  const [saved, setSaved] = useState(false);
  const handle = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <button
      onClick={handle}
      className={`mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
        saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {saved ? <><CheckCircle2 size={15} /> Saved!</> : label}
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your business profile, preferences, and security settings.</p>
      </div>

      <Section icon={User} title="Profile & Business" desc="Update your business name, GSTIN, and contact details" accent="blue">
        <InputRow label="Business Name" defaultValue={user?.business_name} />
        <InputRow label="Email Address" type="email" defaultValue={user?.email} />
        <InputRow label="GSTIN" defaultValue={user?.gstin} placeholder="27AAAAA0000A1Z5" />
        <InputRow label="PAN Number" placeholder="AAAAA0000A" />
        <SaveButton label="Update Profile" />
      </Section>

      <Section icon={Bell} title="Notifications" desc="Configure mismatch alerts and reconciliation emails" accent="amber">
        <div className="mt-4 space-y-3">
          {[
            { label: 'Email alerts for new mismatches',        default: true },
            { label: 'Weekly compliance summary report',       default: true },
            { label: 'Notify on successful reconciliation',    default: false },
            { label: 'System maintenance & updates',           default: false },
          ].map(({ label, default: checked }) => (
            <label key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 cursor-pointer group">
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
              <div className="relative">
                <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors cursor-pointer" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          ))}
        </div>
        <SaveButton label="Save Preferences" />
      </Section>

      <Section icon={Lock} title="Security" desc="Update your password and manage session security" accent="rose">
        <InputRow label="Current Password"  type="password" placeholder="••••••••" />
        <InputRow label="New Password"      type="password" placeholder="Min. 6 characters" />
        <InputRow label="Confirm Password"  type="password" placeholder="Re-enter new password" />
        <SaveButton label="Change Password" />
      </Section>

      <Section icon={ShieldCheck} title="GST Configuration" desc="Set default GST rate assumptions for extraction fallback" accent="emerald">
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Default GST Rate</label>
          <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="18">18% (Most common)</option>
            <option value="12">12%</option>
            <option value="5">5%</option>
            <option value="28">28%</option>
            <option value="0">0% (Exempt)</option>
          </select>
        </div>
        <InputRow label="State of Registration" placeholder="e.g. Maharashtra (27)" />
        <SaveButton label="Save GST Config" />
      </Section>
    </div>
  );
}
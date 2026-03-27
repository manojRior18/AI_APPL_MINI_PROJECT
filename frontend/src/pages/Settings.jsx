import React from 'react';
import { User, Bell, Lock, Globe } from 'lucide-react';

export default function Settings() {
  const sections = [
    { icon: User, label: 'Profile Settings', desc: 'Manage your business details and GSTIN' },
    { icon: Bell, label: 'Notifications', desc: 'Configure mismatch alerts and email reports' },
    { icon: Lock, label: 'Security', desc: 'Update password and 2FA settings' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
      <div className="grid gap-4">
        {sections.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-6 hover:border-blue-300 transition-all cursor-pointer group">
            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
              <s.icon className="text-slate-400 group-hover:text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{s.label}</h4>
              <p className="text-slate-500 text-sm">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
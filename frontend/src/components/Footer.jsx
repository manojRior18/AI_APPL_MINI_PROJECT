import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-8 px-10 border-t border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-slate-500 text-sm font-medium">
          © {currentYear} <span className="text-blue-600 font-bold">GST Helper.AI</span>. All Rights Reserved.
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs text-slate-400 hover:text-blue-600 font-semibold transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-slate-400 hover:text-blue-600 font-semibold transition-colors">Terms of Service</a>
          <a href="#" className="text-xs text-slate-400 hover:text-blue-600 font-semibold transition-colors">Help Center</a>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
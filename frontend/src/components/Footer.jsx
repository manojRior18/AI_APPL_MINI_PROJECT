export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-8 border-t border-slate-200/80 bg-transparent">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-slate-400 text-xs font-medium">
          © {new Date().getFullYear()} <span className="text-blue-600 font-bold">GST Helper.AI</span>
          <span className="text-slate-300 mx-2">·</span>
          All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {['Privacy Policy', 'Terms', 'Help Center'].map(link => (
            <a key={link} href="#" className="text-xs text-slate-400 hover:text-blue-600 font-semibold transition-colors">{link}</a>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
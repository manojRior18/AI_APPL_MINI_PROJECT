export default function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-slate-200 text-center">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; 2026 Compliance Helper AI • Built for AI Application Development Elective
      </p>
      <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-400">
        <a href="#" className="hover:text-blue-500">Privacy Policy</a>
        <span>•</span>
        <a href="#" className="hover:text-blue-500">Terms of Service</a>
        <span>•</span>
        <span className="text-slate-300 italic">v1.0.0-PoC-Beta</span>
      </div>
    </footer>
  );
}
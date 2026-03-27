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


import { useState } from 'react';
import { Bell, Search, ChevronDown, User, Settings as SettingsIcon, LogOut } from 'lucide-react';

export default function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-20 border-b border-slate-200 bg-white/70 backdrop-blur-lg sticky top-0 z-40 flex items-center justify-between px-10">
      <div className="relative w-[400px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search GSTINs..." 
          className="w-full bg-slate-100/50 border border-slate-200 rounded-full py-2.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <div className="absolute top-12 w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50">
            <p className="text-xs text-slate-400 font-bold uppercase">Results for "{searchQuery}"</p>
            <div className="mt-2 text-sm text-slate-600 italic">No exact matches found in current ledger.</div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 relative">
        <div 
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-slate-50 transition-all border border-transparent"
        >
          <img src="https://ui-avatars.com/api/?name=Acme+Corp&background=0D8ABC&color=fff" alt="Profile" className="w-9 h-9 rounded-full shadow-sm" />
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
        </div>

        {showProfile && (
          <div className="absolute top-14 right-0 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-2 border-b border-slate-100 mb-2">
              <p className="text-sm font-bold text-slate-800">Acme Corp</p>
              <p className="text-[10px] text-slate-500">owner@acme.com</p>
            </div>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><User size={16}/> Profile</button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><SettingsIcon size={16}/> Settings</button>
            <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-2"><LogOut size={16}/> Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';

export default function FilingCalendar() {
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'quarterly'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const deadlines = [
    { name: "GSTR-1 (Monthly)", day: 11, type: "monthly", desc: "Outward Supplies (Sales) summary for taxpayers with turnover > ₹5Cr or opted for monthly filing." },
    { name: "IFF (QRMP)", day: 13, type: "monthly", desc: "Invoice Furnishing Facility for quarterly filers to upload B2B invoices." },
    { name: "GSTR-3B (Monthly)", day: 20, type: "monthly", desc: "Summary return and tax payment for monthly filers." },
    { name: "PMT-06 (QRMP)", day: 25, type: "monthly", desc: "Challan for depositing tax by quarterly filers for the first two months of the quarter." },
    { name: "GSTR-1 (Quarterly)", day: 13, type: "quarterly", desc: "Quarterly sales summary for taxpayers under QRMP scheme." },
    { name: "GSTR-3B (Quarterly)", day: 22, type: "quarterly", desc: "Quarterly summary return and tax payment (State Category 1)." },
    { name: "GSTR-3B (Quarterly)", day: 24, type: "quarterly", desc: "Quarterly summary return and tax payment (State Category 2)." }
  ];

  const filteredDeadlines = deadlines.filter(d => d.type === viewType || d.type === 'monthly');

  const getStatus = (day) => {
    const today = new Date().getDate();
    const month = new Date().getMonth();
    if (month > currentMonth) return "Completed";
    if (month < currentMonth) return "Upcoming";
    if (today > day) return "Missed";
    if (today === day) return "Due Today";
    return "Upcoming";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GST Filing Calendar</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track your compliance deadlines and avoid late fees.</p>
        </div>
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setViewType('monthly')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >Monthly Filer</button>
          <button 
            onClick={() => setViewType('quarterly')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'quarterly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >QRMP (Quarterly)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Calendar View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-extrabold text-slate-800">{months[currentMonth]} {currentYear}</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={20}/></button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={20}/></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">{d}</div>
              ))}
              {Array.from({length: 31}, (_, i) => {
                const day = i + 1;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth;
                const deadline = filteredDeadlines.find(d => d.day === day);
                
                return (
                  <div key={day} className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all group cursor-default ${isToday ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                    <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-slate-600'}`}>{day}</span>
                    {deadline && (
                      <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-sm shadow-rose-200 group-hover:w-3 group-hover:h-1 group-hover:rounded-full transition-all" />
                    )}
                    {deadline && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 bg-slate-900 text-white text-[9px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-xl transition-opacity">
                         <p className="font-bold border-b border-white/20 pb-1 mb-1">{deadline.name}</p>
                         <p className="font-medium text-slate-300">Due by midnight</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Pro Tip: ITC Reconciliation</p>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">Run your reconciliation by the 14th of every month (after GSTR-1 filing deadline) to ensure your GSTR-2B is fully updated with supplier data.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Deadline List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Upcoming Deadlines</h3>
          {filteredDeadlines.sort((a,b) => a.day - b.day).map((d, i) => {
            const status = getStatus(d.day);
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{d.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Due: {d.day} {months[currentMonth]}</p>
                    </div>
                  </div>
                  <Badge variant={status === 'Completed' ? 'success' : status === 'Missed' ? 'error' : status === 'Due Today' ? 'warning' : 'info'} size="sm">
                    {status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-3">{d.desc}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Late Fee: ₹50/day</span>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline">Set Reminder</button>
                </div>
              </div>
            );
          })}

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-none text-white relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="text-lg font-bold mb-2">Filing Status</h4>
               <p className="text-xs text-slate-400 font-medium mb-6">You have filed all returns for the previous month on time.</p>
               <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                 <CheckCircle2 className="text-emerald-400" size={20} />
                 <div>
                   <p className="text-[10px] font-bold text-slate-300 uppercase">Compliance Health</p>
                   <p className="text-sm font-bold">Excellent (100%)</p>
                 </div>
               </div>
             </div>
             <CalendarIcon className="absolute -right-4 -bottom-4 text-white/5" size={120} />
          </Card>
        </div>

      </div>
    </div>
  );
}

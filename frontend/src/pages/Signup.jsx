// import { motion } from 'framer-motion';
// import { ShieldCheck, UserPlus, Building2, Mail, Lock, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const InputField = ({ label, icon: Icon, type, placeholder }) => (
//   <div className="space-y-1">
//     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
//     <div className="relative">
//       <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//       <input 
//         type={type} 
//         placeholder={placeholder} 
//         className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700" 
//       />
//     </div>
//   </div>
// );

// export default function Signup() {
//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
//       <motion.div 
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-12 border border-slate-100"
//       >
//         <div className="flex flex-col items-center mb-10">
//           <div className="bg-emerald-600 p-3 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
//             <UserPlus className="text-white" size={32} />
//           </div>
//           <h1 className="text-2xl font-bold text-slate-900">Create Business Account</h1>
//           <p className="text-slate-500 text-sm">Join 5,000+ MSMEs simplifying their GST compliance</p>
//         </div>

//         <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="md:col-span-2">
//             <InputField label="Business Name" icon={Building2} type="text" placeholder="e.g. Khanna Manufacturing Ltd" />
//           </div>
//           <InputField label="Email Address" icon={Mail} type="email" placeholder="owner@business.com" />
//           <InputField label="GSTIN (Optional)" icon={ShieldCheck} type="text" placeholder="27AAAAA0000A1Z5" />
//           <InputField label="Password" icon={Lock} type="password" placeholder="••••••••" />
//           <InputField label="Confirm Password" icon={Lock} type="password" placeholder="••••••••" />

//           <div className="md:col-span-2 mt-4">
//             <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group">
//               Get Started for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
//             </button>
//           </div>
//         </form>

//         <p className="mt-8 text-center text-sm text-slate-500">
//           Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign in here</Link>
//         </p>
//       </motion.div>
//     </div>
//   );
// }

import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, Building2, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate

const InputField = ({ label, icon: Icon, type, placeholder }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input 
        type={type} 
        placeholder={placeholder} 
        className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700" 
      />
    </div>
  </div>
);

export default function Signup() {
  const navigate = useNavigate(); // Initialize the navigate hook

  const handleSignup = (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    // In a real app, you'd do API calls here. 
    // For your demo, we'll jump straight to the success experience!
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-12 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-emerald-600 p-3 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Business Account</h1>
          <p className="text-slate-500 text-sm">Join 5,000+ MSMEs simplifying their GST compliance</p>
        </div>

        {/* Added onSubmit handler here */}
        <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField label="Business Name" icon={Building2} type="text" placeholder="e.g. Khanna Manufacturing Ltd" />
          </div>
          <InputField label="Email Address" icon={Mail} type="email" placeholder="owner@business.com" />
          <InputField label="GSTIN (Optional)" icon={ShieldCheck} type="text" placeholder="27AAAAA0000A1Z5" />
          <InputField label="Password" icon={Lock} type="password" placeholder="••••••••" />
          <InputField label="Confirm Password" icon={Lock} type="password" placeholder="••••••••" />

          <div className="md:col-span-2 mt-4">
            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group"
            >
              Get Started for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign in here</Link>
        </p>
      </motion.div>
    </div>
  );
}
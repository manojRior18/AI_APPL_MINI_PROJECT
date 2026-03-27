// import { motion } from 'framer-motion';
// import { ShieldCheck, ArrowRight } from 'lucide-react';
// import { Link } from 'react-router-dom';

// export default function Login() {
//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-blue-100/50 p-10 border border-slate-100"
//       >
//         <div className="flex flex-col items-center mb-10">
//           <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-200">
//             <ShieldCheck className="text-white" size={32} />
//           </div>
//           <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
//           <p className="text-slate-500 text-sm">Secure access to your GST dashboard</p>
//         </div>

//         <form className="space-y-4">
//           <div>
//             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
//             <input type="email" placeholder="owner@msme.com" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
//           </div>
//           <div>
//             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
//             <input type="password" placeholder="••••••••" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
//           </div>
//           <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
//             Sign In <ArrowRight size={18} />
//           </button>
//         </form>

//         <p className="mt-8 text-center text-sm text-slate-500">
//           New to the platform? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
//         </p>
//       </motion.div>
//     </div>
//   );
// }


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, validate with backend here
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Enter your credentials to access GST AI</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Sign In</button>
        </form>
        <p className="text-center mt-6 text-slate-500 text-sm">Don't have an account? <Link to="/signup" className="text-blue-600 font-bold">Create one</Link></p>
      </div>
    </div>
  );
}
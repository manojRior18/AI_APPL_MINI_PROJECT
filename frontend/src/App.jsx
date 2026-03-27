// import { Routes, Route, useLocation } from 'react-router-dom';
// import Header from './components/Header';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Dashboard from './pages/Dashboard';
// import Upload from './pages/Upload';
// import Report from './pages/Report';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// // ... import your other pages ...

// export default function App() {
//   const location = useLocation();
//   const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

//   if (isAuthPage) {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="flex min-h-screen bg-[#f8fafc] font-sans">
//       {/* The Fixed Sidebar */}
//       <div className="w-64 fixed inset-y-0">
//         <Navbar />  
//       </div>    
//       <div className="flex-1 ml-64 flex flex-col">
//         <Header />
//         <main className="p-8">
//           <Routes>
//             <Route path="/" element={<Dashboard />} />
//             <Route path="/uploads" element={<Upload />} />
//             <Route path="/reports" element={<Report />} />
//           </Routes>
//         </main>
//         <Footer />
//       </div>
//     </div>
//   );
// }

import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Report from './pages/Report';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';

export default function App() {
  const location = useLocation();
  // Hide Navbar/Header on Auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {!isAuthPage && <Navbar />}
      
      <div className={`flex-1 flex flex-col min-w-0 ${!isAuthPage ? 'ml-64' : ''}`}>
        {!isAuthPage && <Header />}
        
        <main className={`flex-1 flex flex-col ${isAuthPage ? '' : 'p-10 pb-0'}`}>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<Report />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          {!isAuthPage && <Footer />}
        </main>
      </div>
    </div>
  );
}
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Report from './pages/Report';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import TallyExport from './pages/TallyExport';
import ChatAssistant from './components/ChatAssistant';
import FilingCalendar from './pages/Calendar';
import { ToastProvider } from './components/ui/Toast';

// ── Auth Context ───────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ── Protected Route ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gst_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('gst_user', JSON.stringify(userData));
    localStorage.setItem('gst_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gst_user');
    localStorage.removeItem('gst_token');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    setIsSidebarOpen(false); // Close on route change
  }, [location.pathname]);

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <div className="flex min-h-screen bg-[#F0F4F8] font-body relative">
          {!isAuthPage && user && <Navbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isAuthPage && user ? 'lg:ml-64' : ''}`}>
            {!isAuthPage && user && <Header onMenuClick={() => setIsSidebarOpen(true)} />}

            <main className={`flex-1 flex flex-col ${isAuthPage ? '' : 'p-8 pb-0'}`}>
              <div className="flex-1">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                  <Route path="/tally" element={<ProtectedRoute><TallyExport /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><FilingCalendar /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
              </div>
              {!isAuthPage && user && <Footer />}
            </main>
          </div>
          {!isAuthPage && user && <ChatAssistant />}
        </div>
      </AuthContext.Provider>
    </ToastProvider>
  );
}
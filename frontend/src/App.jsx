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

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex min-h-screen bg-[#F0F4F8] font-body">
        {!isAuthPage && user && <Navbar />}

        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isAuthPage && user ? 'ml-64' : ''}`}>
          {!isAuthPage && user && <Header />}

          <main className={`flex-1 flex flex-col ${isAuthPage ? '' : 'p-8 pb-0'}`}>
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              </Routes>
            </div>
            {!isAuthPage && user && <Footer />}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
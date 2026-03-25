import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import LandingLayout from './components/layout/LandingLayout';
import { ProtectedRoute, AdminRoute } from './components/layout/ProtectedRoute';
import SubscriptionGate from './components/common/SubscriptionGate';

// Public pages
import Home from './pages/public/Home';
import Charities from './pages/public/Charities';
import CharityDetail from './pages/public/CharityDetail';
import Pricing from './pages/public/Pricing';
import HowItWorks from './pages/public/HowItWorks';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import Overview from './pages/dashboard/Overview';
import Scores from './pages/dashboard/Scores';
import Charity from './pages/dashboard/Charity';
import Draws from './pages/dashboard/Draws';
import Winnings from './pages/dashboard/Winnings';
import Settings from './pages/dashboard/Settings';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import DrawManagement from './pages/admin/DrawManagement';
import CharityManagement from './pages/admin/CharityManagement';
import AdminWinners from './pages/admin/Winners';
import Reports from './pages/admin/Reports';



// Redirect already-logged-in users away from auth pages
function AuthRedirect({ children }) {
  const { user, token } = useAuthStore();
  if (token && user) {
    return <Navigate to={user?.profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const { token, fetchProfile, profileLoaded } = useAuthStore();

  useEffect(() => {
    // Only fetch profile once on mount if token exists and profile not yet loaded
    if (token && !profileLoaded) fetchProfile();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1B2D45', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' },
          success: { iconTheme: { primary: '#D4AF37', secondary: '#0D1B2A' } },
          error: { iconTheme: { primary: '#E8553A', secondary: '#fff' } },
        }}
      />
      <SubscriptionGate />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public — LandingLayout owns Lenis smooth scroll + Navbar + Footer */}
          <Route path="/" element={<LandingLayout><Home /></LandingLayout>} />
          <Route path="/charities" element={<LandingLayout><Charities /></LandingLayout>} />
          <Route path="/charities/:id" element={<LandingLayout><CharityDetail /></LandingLayout>} />
          <Route path="/pricing" element={<LandingLayout><Pricing /></LandingLayout>} />
          <Route path="/how-it-works" element={<LandingLayout><HowItWorks /></LandingLayout>} />

          {/* Auth — redirect to correct dashboard if already logged in */}
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* User Dashboard — own header, no landing nav */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="scores" element={<Scores />} />
            <Route path="charity" element={<Charity />} />
            <Route path="draws" element={<Draws />} />
            <Route path="winnings" element={<Winnings />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin — own header, completely separate */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="draws" element={<DrawManagement />} />
            <Route path="charities" element={<CharityManagement />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

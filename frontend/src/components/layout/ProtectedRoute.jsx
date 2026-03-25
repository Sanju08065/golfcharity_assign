import { Navigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

// Regular users only — admins get redirected to /admin
export function ProtectedRoute({ children }) {
  const { user, token, profileLoading, profileLoaded } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // Preserve the full path + query so we can redirect back after login
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  // Wait for profile to load before making role decisions
  if (profileLoading || (!profileLoaded && token)) return <LoadingSpinner />;
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (user?.profile?.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}

// Admins only — regular users get access denied
export function AdminRoute({ children }) {
  const { user, token, isAdmin, profileLoading, profileLoaded } = useAuthStore();

  if (!token) return <AdminAccessDenied reason="login" />;

  if (profileLoading || (!profileLoaded && token)) return <AdminLoadingScreen />;

  // Regular user trying to access admin — block them
  if (!isAdmin()) return <AdminAccessDenied reason="forbidden" />;

  return children;
}

function AdminLoadingScreen() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white/60 text-sm tracking-wide">Verifying admin access...</p>
      </motion.div>
    </div>
  );
}

function AdminAccessDenied({ reason }) {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-white/50 mb-8">
          {reason === 'login'
            ? 'You need to be logged in with an admin account to access this area.'
            : 'Your account does not have administrator privileges.'}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          >
            {reason === 'login' ? 'Go to Login' : 'Back to Login'}
          </Link>
          <Link
            to="/"
            className="text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

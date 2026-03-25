import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome, HiUsers, HiTicket, HiHeart, HiStar, HiChartPie,
  HiLogout, HiCog, HiChevronUp, HiShieldCheck
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';

const sidebarLinks = [
  { to: '/admin',            icon: HiHome,     label: 'Dashboard', end: true },
  { to: '/admin/users',      icon: HiUsers,    label: 'Users' },
  { to: '/admin/draws',      icon: HiTicket,   label: 'Draws' },
  { to: '/admin/charities',  icon: HiHeart,    label: 'Charities' },
  { to: '/admin/winners',    icon: HiStar,     label: 'Winners' },
  { to: '/admin/reports',    icon: HiChartPie, label: 'Reports' },
];

function getInitials(name, email) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email?.[0] || 'A').toUpperCase();
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const name = user?.profile?.full_name;
  const email = user?.email;
  const initials = getInitials(name, email);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-navy">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center shadow-md shadow-gold/20">
              <span className="text-navy font-bold text-sm">GC</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg hidden sm:block">GolfCharity</span>
              <span className="bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Admin</span>
            </div>
          </div>
          {/* Mobile: show initials */}
          <div className="lg:hidden flex items-center gap-3">
            <span className="text-white/40 text-sm">{name || email}</span>
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <span className="text-gold text-xs font-black">{initials}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-navy-dark border-r border-white/5 min-h-[calc(100vh-4rem)] fixed">
          <div className="flex-1 p-4 pt-6 space-y-1">
            <div className="px-4 py-2 mb-2">
              <span className="text-gold text-xs font-semibold uppercase tracking-wider">Navigation</span>
            </div>
            {sidebarLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gold/10 text-gold border border-gold/10'
                      : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                <link.icon className="w-4 h-4 flex-shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Avatar popup — same as DashboardLayout */}
          <div className="p-4 border-t border-white/[0.05]" ref={menuRef}>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-20 left-3 right-3 rounded-2xl bg-[#1a2a3a] border border-white/[0.08] shadow-2xl overflow-hidden z-50"
                >
                  {/* Email + admin badge */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-white/40 text-xs truncate">{email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <HiShieldCheck className="w-3 h-3 text-gold" />
                      <span className="text-gold text-[10px] font-bold uppercase tracking-widest">Administrator</span>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link
                      to="/admin/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.05] text-sm transition-colors"
                    >
                      <HiCog className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-white/[0.06] py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-coral hover:bg-coral/5 text-sm transition-colors"
                    >
                      <HiLogout className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <span className="text-gold text-xs font-black">{initials}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white/80 text-sm font-medium truncate">{name || 'Admin'}</p>
                <p className="text-gold text-[10px] font-semibold">Administrator</p>
              </div>
              <HiChevronUp className={`w-4 h-4 text-white/30 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-dark/95 backdrop-blur-xl border-t border-white/5 z-40">
          <div className="flex justify-around py-2">
            {sidebarLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-2 text-xs transition-colors ${
                    isActive ? 'text-gold' : 'text-white/30'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                <span className="text-[10px]">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

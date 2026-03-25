import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: 'Platform',
      links: [
        { to: '/how-it-works', label: 'How It Works' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/charities', label: 'Charities' },
      ],
    },
    {
      title: 'Account',
      links: [
        { to: '/login', label: 'Log In' },
        { to: '/signup', label: 'Sign Up' },
        { to: '/dashboard', label: 'Dashboard' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '#', label: 'Privacy Policy' },
        { to: '#', label: 'Terms of Service' },
        { to: '#', label: 'Cookie Policy' },
      ],
    },
  ];

  return (
    <footer className="bg-navy-dark border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-5 group w-fit">
              <div className="relative">
                <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
                  <span className="text-navy font-black text-sm">GC</span>
                </div>
                <div className="absolute inset-0 bg-gold rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
              </div>
              <div>
                <span className="text-white font-bold text-xl tracking-tight">Golf</span>
                <span className="text-gold font-bold text-xl tracking-tight">Charity</span>
              </div>
            </Link>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs">
              Play golf, win prizes, and make a real difference. Every round you play funds the charities you love.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-white/30 text-xs">Monthly draws active</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-white/30 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm">&copy; {year} GolfCharity. All rights reserved.</p>
          <p className="text-white/15 text-xs">
            Gambling responsibly. 18+ only. T&Cs apply.
          </p>
        </div>
      </div>
    </footer>
  );
}

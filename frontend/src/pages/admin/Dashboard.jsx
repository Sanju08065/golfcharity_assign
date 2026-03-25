import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiUsers, HiCreditCard, HiCurrencyPound, HiHeart, HiStar, HiCash, HiArrowRight, HiTicket } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, timeAgo } from '../../utils/helpers';
import { adminAPI } from '../../api/endpoints';

function StatCard({ icon: Icon, label, value, color = 'text-white/50', bg = 'bg-white/[0.05]', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl" />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-black text-xl">{value}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.reports()
      .then(r => setReports(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = [
    { icon: HiUsers,          label: 'Total Users',            value: reports?.total_users || 0,                              color: 'text-blue-400',  bg: 'bg-blue-400/10',  delay: 0 },
    { icon: HiCreditCard,     label: 'Active Subscribers',     value: reports?.active_subscribers || 0,                       color: 'text-green-400', bg: 'bg-green-400/10', delay: 0.05 },
    { icon: HiCurrencyPound,  label: 'Total Prize Pool',       value: formatCurrency(reports?.total_prize_pool || 0),          color: 'text-gold',      bg: 'bg-gold/10',      delay: 0.1 },
    { icon: HiHeart,          label: 'Charity Contributions',  value: formatCurrency(reports?.total_charity_contributions||0), color: 'text-coral',     bg: 'bg-coral/10',     delay: 0.15 },
    { icon: HiStar,           label: 'Total Winners',          value: reports?.total_winners || 0,                            color: 'text-yellow-400',bg: 'bg-yellow-400/10',delay: 0.2 },
    { icon: HiCash,           label: 'Total Paid Out',         value: formatCurrency(reports?.total_paid_out || 0),            color: 'text-green-400', bg: 'bg-green-400/10', delay: 0.25 },
  ];

  const drawStats = reports?.draw_statistics || {};
  const recentUsers = (reports?.recent_users || []).slice(0, 6);

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Admin Panel</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard</h1>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Draw stats + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Draw stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">Draw Statistics</h3>
            <Link to="/admin/draws" className="flex items-center gap-1 text-gold text-xs font-semibold hover:text-gold-light transition-colors">
              Manage <HiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: drawStats.total || 0, color: 'text-white' },
              { label: 'Published', value: drawStats.published || 0, color: 'text-green-400' },
              { label: 'Draft', value: drawStats.draft || 0, color: 'text-yellow-400' },
            ].map((d, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04] text-center">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{d.label}</p>
                <p className={`text-2xl font-black ${d.color}`}>{d.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-green-400"
                  style={{ width: drawStats.total ? `${(drawStats.published / drawStats.total) * 100}%` : '0%' }} />
              </div>
              <span className="text-white/30 text-xs">
                {drawStats.total ? Math.round((drawStats.published / drawStats.total) * 100) : 0}% published
              </span>
            </div>
          </div>
        </motion.div>

        {/* Recent users */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">Recent Users</h3>
            <Link to="/admin/users" className="flex items-center gap-1 text-gold text-xs font-semibold hover:text-gold-light transition-colors">
              View all <HiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 && <p className="text-white/20 text-sm text-center py-4">No users yet</p>}
            {recentUsers.map((u, i) => (
              <motion.div key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-xs font-bold">
                      {(u.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{u.full_name || 'Unknown'}</p>
                    <p className="text-white/25 text-xs">{u.email}</p>
                  </div>
                </div>
                <span className="text-white/20 text-xs">{timeAgo(u.created_at)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/users',     icon: HiUsers,          label: 'Manage Users' },
          { to: '/admin/draws',     icon: HiTicket,         label: 'Run Draw' },
          { to: '/admin/winners',   icon: HiStar,           label: 'Verify Winners' },
          { to: '/admin/charities', icon: HiHeart,          label: 'Charities' },
        ].map((a, i) => (
          <Link key={a.to} to={a.to}>
            <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group cursor-pointer text-center">
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] group-hover:bg-gold/10 flex items-center justify-center mx-auto mb-2 transition-colors">
                <a.icon className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors" />
              </div>
              <p className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">{a.label}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

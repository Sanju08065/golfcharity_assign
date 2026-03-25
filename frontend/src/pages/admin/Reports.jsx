import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { adminAPI } from '../../api/endpoints';
import {
  HiUsers, HiCreditCard, HiCurrencyPound, HiHeart,
  HiStar, HiCash, HiChartBar, HiTrendingUp
} from 'react-icons/hi';

const GOLD   = '#D4AF37';
const CORAL  = '#E8553A';
const BLUE   = '#3B82F6';
const GREEN  = '#10B981';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(13,27,42,0.97)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
};
const AXIS_STYLE = { fill: 'rgba(255,255,255,0.25)', fontSize: 11 };
const GRID_STYLE = { stroke: 'rgba(255,255,255,0.04)' };

function StatCard({ icon: Icon, label, value, color, bg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white font-black text-xl">{value}</p>
    </motion.div>
  );
}

function ChartCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
    >
      <h3 className="text-white font-bold mb-5">{title}</h3>
      {children}
    </motion.div>
  );
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (!value) return null;
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.8)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {formatCurrency(value)}
    </text>
  );
};

const STATUS_COLORS = {
  active:    { text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/15',  bar: 'bg-green-400' },
  inactive:  { text: 'text-white/40',   bg: 'bg-white/[0.03]',  border: 'border-white/[0.06]',  bar: 'bg-white/40' },
  lapsed:    { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/15', bar: 'bg-yellow-400' },
  cancelled: { text: 'text-coral',      bg: 'bg-coral/10',      border: 'border-coral/15',      bar: 'bg-coral' },
};

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminAPI.reports()
      .then(r => setReports(r.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-coral text-sm">Failed to load reports: {error}</p>
    </div>
  );

  // Monthly growth chart — sorted chronologically
  const growthData = Object.entries(reports?.monthly_growth || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // last 12 months
    .map(([month, count]) => ({ month: month.slice(5), users: count })); // show MM only

  // Real prize pool pie from latest published draw pools
  const prizePoolData = [
    { name: '5-Match (40%)', value: parseFloat(((reports?.total_prize_pool || 0) * 0.40).toFixed(2)), color: GOLD },
    { name: '4-Match (35%)', value: parseFloat(((reports?.total_prize_pool || 0) * 0.35).toFixed(2)), color: BLUE },
    { name: '3-Match (25%)', value: parseFloat(((reports?.total_prize_pool || 0) * 0.25).toFixed(2)), color: GREEN },
  ];

  const drawStats = reports?.draw_statistics || {};
  const subBreakdown = reports?.subscription_breakdown || {};
  const recentUsers = reports?.recent_users || [];

  const stats = [
    { icon: HiUsers,         label: 'Total Users',           value: reports?.total_users ?? 0,                                color: 'text-blue-400',   bg: 'bg-blue-400/10',   delay: 0 },
    { icon: HiCreditCard,    label: 'Active Subscribers',    value: reports?.active_subscribers ?? 0,                         color: 'text-green-400',  bg: 'bg-green-400/10',  delay: 0.05 },
    { icon: HiCurrencyPound, label: 'Total Prize Pool',      value: formatCurrency(reports?.total_prize_pool ?? 0),            color: 'text-gold',       bg: 'bg-gold/10',       delay: 0.1 },
    { icon: HiHeart,         label: 'Charity Contributions', value: formatCurrency(reports?.total_charity_contributions ?? 0), color: 'text-coral',      bg: 'bg-coral/10',      delay: 0.15 },
    { icon: HiStar,          label: 'Total Winners',         value: reports?.total_winners ?? 0,                              color: 'text-yellow-400', bg: 'bg-yellow-400/10', delay: 0.2 },
    { icon: HiCash,          label: 'Total Paid Out',        value: formatCurrency(reports?.total_paid_out ?? 0),              color: 'text-purple-400', bg: 'bg-purple-400/10', delay: 0.25 },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Admin Panel</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Reports & Analytics</h1>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* User growth */}
        <ChartCard title="User Growth (Monthly)" delay={0.3}>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={growthData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="users" fill={GOLD} radius={[6, 6, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-white/20">
              <HiChartBar className="w-10 h-10 mb-2" />
              <p className="text-sm">No growth data yet</p>
            </div>
          )}
        </ChartCard>

        {/* Prize pool pie — real amounts */}
        <ChartCard title="Prize Pool Distribution" delay={0.35}>
          {reports?.total_prize_pool > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={prizePoolData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    labelLine={false}
                    label={CustomPieLabel}
                  >
                    {prizePoolData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatCurrency(v), 'Pool']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 flex-1">
                {prizePoolData.map(d => (
                  <div key={d.name} className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="text-white/50 text-xs">{d.name}</p>
                      <p className="font-black text-sm" style={{ color: d.color }}>{formatCurrency(d.value)}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-white/30 text-xs">Total pool</p>
                  <p className="text-white font-black text-sm">{formatCurrency(reports?.total_prize_pool)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-white/20">
              <HiCurrencyPound className="w-10 h-10 mb-2" />
              <p className="text-sm">No prize pool data yet</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Draw statistics + Subscription breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Draw stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
        >
          <h3 className="text-white font-bold mb-5">Draw Statistics</h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total',     value: drawStats.total     ?? 0, color: 'text-white',       bg: 'bg-white/[0.05]',  border: 'border-white/[0.06]' },
              { label: 'Published', value: drawStats.published ?? 0, color: 'text-green-400',   bg: 'bg-green-400/10',  border: 'border-green-400/15' },
              { label: 'Draft',     value: drawStats.draft     ?? 0, color: 'text-yellow-400',  bg: 'bg-yellow-400/10', border: 'border-yellow-400/15' },
            ].map(d => (
              <div key={d.label} className={`p-4 rounded-xl ${d.bg} border ${d.border} text-center`}>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-2">{d.label}</p>
                <p className={`text-3xl font-black ${d.color}`}>{d.value}</p>
              </div>
            ))}
          </div>
          {drawStats.total > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/30 text-xs">Publication rate</p>
                <p className="text-white/50 text-xs font-semibold">
                  {Math.round(((drawStats.published ?? 0) / drawStats.total) * 100)}%
                </p>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((drawStats.published ?? 0) / drawStats.total) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-green-400"
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Subscription breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
        >
          <h3 className="text-white font-bold mb-5">Subscription Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(subBreakdown).map(([status, count]) => {
              const c = STATUS_COLORS[status] || STATUS_COLORS.inactive;
              const total = Object.values(subBreakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status} className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1 capitalize">{status}</p>
                  <p className={`text-2xl font-black ${c.text}`}>{count}</p>
                  <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className={`h-full rounded-full ${c.bar}`}
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-1">{pct}% of users</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent users table */}
      {recentUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <HiTrendingUp className="w-4 h-4 text-gold" />
            </div>
            <h3 className="text-white font-bold">Recent Signups</h3>
            <span className="ml-auto text-white/20 text-xs">Last 10 users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['User', 'Email', 'Status', 'Joined'].map(h => (
                    <th key={h} className="py-3 px-5 text-white/25 text-xs font-semibold uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => {
                  const c = STATUS_COLORS[u.subscription_status] || STATUS_COLORS.inactive;
                  return (
                    <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-gold text-xs font-bold">{(u.full_name || 'U').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-white/70 text-sm">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-white/30 text-xs">{u.email || '—'}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${c.bg} ${c.text} ${c.border}`}>
                          {u.subscription_status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-white/25 text-xs">{formatDate(u.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

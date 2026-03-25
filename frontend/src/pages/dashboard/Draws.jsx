import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiTicket, HiCheckCircle, HiXCircle, HiStar } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, getCountdown, getNextDrawDate } from '../../utils/helpers';
import { drawsAPI } from '../../api/endpoints';

function CountdownUnit({ label, value }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
        <span className="text-xl sm:text-2xl font-black text-gold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] text-white/30 mt-1.5 block uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(getCountdown(getNextDrawDate()));

  useEffect(() => {
    drawsAPI.userHistory()
      .then(r => setDraws(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    const t = setInterval(() => setCountdown(getCountdown(getNextDrawDate())), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalMatches = draws.reduce((a, d) => a + (d.user_match_count || 0), 0);
  const wins = draws.filter(d => d.user_win).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Draw History</h1>
      </motion.div>

      {/* Countdown card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative p-6 rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.07) 0%, transparent 60%)' }}>
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Next Draw</p>
            <h3 className="text-white font-bold text-lg">Monthly Prize Draw</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <HiTicket className="w-5 h-5 text-gold" />
          </div>
        </div>
        <div className="flex gap-3">
          <CountdownUnit label="Days" value={countdown.days} />
          <CountdownUnit label="Hours" value={countdown.hours} />
          <CountdownUnit label="Mins" value={countdown.minutes} />
          <CountdownUnit label="Secs" value={countdown.seconds} />
        </div>
      </motion.div>

      {/* Stats */}
      {draws.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Draws Entered', value: draws.length },
            { label: 'Total Matches', value: totalMatches },
            { label: 'Wins', value: wins },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Draw list */}
      <div className="space-y-3">
        {draws.map((draw, i) => {
          const monthName = new Date(0, draw.month - 1).toLocaleString('en', { month: 'long' });
          const hasWin = !!draw.user_win;
          const matches = draw.user_match_count || 0;

          return (
            <motion.div key={draw.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`p-5 rounded-2xl border transition-colors ${
                hasWin
                  ? 'bg-gold/[0.04] border-gold/20'
                  : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-white font-bold">{monthName} {draw.year}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      draw.status === 'published' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {draw.status}
                    </span>
                    {hasWin && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold">
                        <HiStar className="w-3 h-3" /> Winner
                      </span>
                    )}
                  </div>

                  {/* Winning numbers */}
                  {draw.winning_numbers?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {draw.winning_numbers.map((num, j) => (
                        <span key={j} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border ${
                          draw.user_match_count > 0
                            ? 'bg-gold/10 border-gold/30 text-gold'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/50'
                        }`}>
                          {num}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Result */}
                <div className="text-right flex-shrink-0">
                  {matches > 0 ? (
                    <div>
                      <div className="flex items-center gap-1.5 justify-end mb-1">
                        <HiCheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold text-sm">{matches} match{matches !== 1 ? 'es' : ''}</span>
                      </div>
                      {hasWin && (
                        <p className="text-gold font-black text-lg">{formatCurrency(draw.user_win.prize_amount)}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-white/25">
                      <HiXCircle className="w-4 h-4" />
                      <span className="text-sm">No matches</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prize pools */}
              {draw.prize_pools?.[0] && (
                <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-3 gap-2">
                  {[
                    { label: '5 Match', val: draw.prize_pools[0].five_match_pool },
                    { label: '4 Match', val: draw.prize_pools[0].four_match_pool },
                    { label: '3 Match', val: draw.prize_pools[0].three_match_pool },
                  ].map((p, j) => (
                    <div key={j} className="text-center">
                      <p className="text-white/20 text-[10px] uppercase tracking-wider">{p.label}</p>
                      <p className="text-white/50 text-xs font-semibold">{formatCurrency(p.val)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {draws.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <HiTicket className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 font-medium mb-1">No draws yet</p>
            <p className="text-white/20 text-sm">Stay tuned — the next monthly draw is coming soon</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

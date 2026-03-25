import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCreditCard, HiChartBar, HiTicket, HiCurrencyPound, HiHeart, HiArrowRight, HiStar, HiTrendingUp, HiCheckCircle, HiClock } from 'react-icons/hi';
import { formatCurrency, formatDate, getCountdown, getNextDrawDate } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import { winnersAPI, subscriptionAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, sub, accent = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group overflow-hidden"
    >
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${accent ? 'bg-gradient-to-br from-gold/8 to-transparent' : 'bg-gradient-to-br from-white/[0.02] to-transparent'}`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accent ? 'bg-gold/15' : 'bg-white/[0.05]'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-gold' : 'text-white/50'}`} />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-xl font-bold ${accent ? 'text-gold' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-white/25 text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function CountdownUnit({ label, value }) {
  return (
    <div className="text-center">
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
        <span className="text-xl sm:text-2xl font-black text-gold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] text-white/30 mt-1.5 block uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Overview() {
  const user = useAuthStore(s => s.user);
  const [winnings, setWinnings] = useState({ total_won: 0, count: 0 });
  const [countdown, setCountdown] = useState(getCountdown(getNextDrawDate()));
  const [searchParams, setSearchParams] = useSearchParams();
  const [pollState, setPollState] = useState(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const justPaid = searchParams.get('subscription') === 'success';
    const sessionId = searchParams.get('session_id');
    if (justPaid) setSearchParams({}, { replace: true });

    // Activate subscription if returning from Stripe
    if (justPaid && sessionId) {
      setPollState('polling');
      subscriptionAPI.activate(sessionId)
        .then(() => useAuthStore.getState().fetchProfile())
        .then(() => {
          const s = useAuthStore.getState().user?.profile?.subscription_status;
          setPollState(s === 'active' ? 'activated' : null);
          if (s === 'active') setTimeout(() => setPollState(null), 6000);
        })
        .catch(() => {
          setPollState(null);
          useAuthStore.getState().fetchProfile();
        });
    }

    // Fetch winnings — one call, no retry
    winnersAPI.my()
      .then(r => setWinnings({ total_won: r.data.total_won || 0, count: r.data.count || 0 }))
      .catch(() => {});

    // Countdown
    const t = setInterval(() => setCountdown(getCountdown(getNextDrawDate())), 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = user?.profile;
  const isActive = profile?.subscription_status === 'active';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-white/30 text-sm mb-1">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {profile?.full_name?.split(' ')[0] || 'Player'} <span className="text-gold">👋</span>
        </h1>
      </motion.div>

      <AnimatePresence>
        {pollState === 'activated' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-green-400/10 border border-green-400/25 flex items-center gap-3">
            <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">Subscription activated!</p>
              <p className="text-white/40 text-xs">You're now entered in the next monthly draw.</p>
            </div>
          </motion.div>
        )}
        {pollState === 'polling' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gold/8 border border-gold/20 flex items-center gap-3">
            <HiClock className="w-5 h-5 text-gold flex-shrink-0 animate-spin" />
            <div>
              <p className="text-white font-semibold text-sm">Activating your subscription...</p>
              <p className="text-white/40 text-xs">This usually takes a few seconds.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isActive && pollState !== 'polling' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gold/8 border border-gold/20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <HiStar className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">You're not subscribed yet</p>
              <p className="text-white/40 text-xs">Subscribe to enter monthly draws and support charities</p>
            </div>
          </div>
          <Link to="/pricing" className="flex items-center gap-1.5 px-4 py-2 bg-gold text-navy text-xs font-bold rounded-xl hover:bg-gold-light transition-colors flex-shrink-0">
            Subscribe Now <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={HiCreditCard} label="Status" value={isActive ? 'Active' : 'Inactive'} sub={isActive ? `${profile?.subscription_plan || 'monthly'} plan` : 'Not subscribed'} accent={isActive} delay={0} />
        <StatCard icon={HiCurrencyPound} label="Total Won" value={formatCurrency(winnings.total_won)} sub={`${winnings.count} win${winnings.count !== 1 ? 's' : ''}`} accent={winnings.total_won > 0} delay={0.05} />
        <StatCard icon={HiHeart} label="Charity" value={profile?.charities?.name || 'None selected'} sub={profile?.charity_id ? `${profile.charity_percentage || 10}% contribution` : 'Pick a charity'} delay={0.1} />
        <StatCard icon={HiTicket} label="Renewal" value={profile?.renewal_date ? formatDate(profile.renewal_date) : 'N/A'} sub="Next billing date" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-3 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.06) 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
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
            {isActive && (
              <p className="text-white/30 text-xs mt-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                You're entered in this draw
              </p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Supporting</p>
            <h3 className="text-white font-bold text-lg mb-3">{profile?.charities?.name || 'No charity yet'}</h3>
            {profile?.charities?.image_url && (
              <div className="w-full h-24 rounded-xl overflow-hidden mb-3">
                <img src={profile.charities.image_url} alt={profile.charities.name} className="w-full h-full object-cover" />
              </div>
            )}
            {profile?.charity_id && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${profile.charity_percentage || 10}%` }} />
                </div>
                <span className="text-gold text-xs font-bold">{profile.charity_percentage || 10}%</span>
              </div>
            )}
          </div>
          <Link to="/dashboard/charity" className="mt-4 flex items-center gap-1.5 text-gold text-xs font-semibold hover:text-gold-light transition-colors">
            {profile?.charity_id ? 'Change charity' : 'Pick a charity'} <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: '/dashboard/scores', icon: HiChartBar, label: 'Log a Score', desc: 'Add your latest Stableford score' },
          { to: '/dashboard/draws', icon: HiTicket, label: 'Draw History', desc: 'See past draws and your matches' },
          { to: '/dashboard/winnings', icon: HiTrendingUp, label: 'My Winnings', desc: 'Track prizes and upload proof' },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] group-hover:bg-gold/10 flex items-center justify-center mb-3 transition-colors">
                <item.icon className="w-4 h-4 text-white/40 group-hover:text-gold transition-colors" />
              </div>
              <p className="text-white text-sm font-semibold mb-0.5">{item.label}</p>
              <p className="text-white/30 text-xs">{item.desc}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

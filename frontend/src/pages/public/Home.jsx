import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { HiUserAdd, HiPencilAlt, HiGift, HiShieldCheck, HiArrowRight, HiStar, HiHeart, HiChevronDown } from 'react-icons/hi';
import { charitiesAPI, drawsAPI } from '../../api/endpoints';
import { formatCurrency, getCountdown, getNextDrawDate } from '../../utils/helpers';

/* ── Animated counter ── */
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 80;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Small countdown badge for hero pill ── */
function CountdownBadge() {
  const [cd, setCd] = useState(getCountdown(getNextDrawDate()));
  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(getNextDrawDate())), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-bold">
      {cd.days}d {String(cd.hours).padStart(2, '0')}h {String(cd.minutes).padStart(2, '0')}m
    </span>
  );
}

/* ── Countdown timer ── */
function CountdownTimer() {
  const [cd, setCd] = useState(getCountdown(getNextDrawDate()));
  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(getNextDrawDate())), 1000);
    return () => clearInterval(t);
  }, []);
  const units = [
    { label: 'Days', value: cd.days },
    { label: 'Hours', value: cd.hours },
    { label: 'Mins', value: cd.minutes },
    { label: 'Secs', value: cd.seconds },
  ];
  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {units.map(u => (
        <div key={u.label} className="text-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <span className="relative text-2xl sm:text-3xl font-black text-gold tabular-nums">
              {String(u.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[11px] text-white/40 mt-2 block uppercase tracking-widest">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Floating orb background ── */
function Orbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,85,58,0.08) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

/* ── Section wrapper with scroll reveal ── */
function Section({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [featuredCharity, setFeaturedCharity] = useState(null);
  const [drawInfo, setDrawInfo] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    charitiesAPI.list({ featured: true }).then(r => {
      if (r.data.data?.length > 0) setFeaturedCharity(r.data.data[0]);
    }).catch(() => {});
    drawsAPI.current().then(r => setDrawInfo(r.data.data)).catch(() => {});
  }, []);

  const steps = [
    {
      icon: HiUserAdd,
      step: '01',
      title: 'Subscribe & Choose',
      desc: 'Pick a monthly or yearly plan. Select the charity closest to your heart.',
      color: 'from-gold/20 to-gold/5',
      iconColor: 'text-gold',
    },
    {
      icon: HiPencilAlt,
      step: '02',
      title: 'Log Your Scores',
      desc: 'Enter your Stableford scores after each round. Your top 5 are always tracked.',
      color: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-400',
    },
    {
      icon: HiGift,
      step: '03',
      title: 'Win & Give Back',
      desc: 'Monthly draws match your scores to winning numbers. Win prizes, fund charities.',
      color: 'from-coral/20 to-coral/5',
      iconColor: 'text-coral',
    },
  ];

  const testimonials = [
    { name: 'James H.', role: 'Golfer, 3 years', text: 'Won £340 last month and my charity got their share too. This platform is genuinely brilliant.', stars: 5 },
    { name: 'Sarah M.', role: 'Weekend golfer', text: 'Finally a reason to track my scores properly. The draw system is exciting every month.', stars: 5 },
    { name: 'David K.', role: 'Club captain', text: 'Got our whole club signed up. The charity impact numbers are real and that matters to us.', stars: 5 },
  ];

  const features = [
    { icon: HiShieldCheck, title: 'Fully Transparent', desc: 'Every draw is verifiable. Winning numbers published publicly after each draw.' },
    { icon: HiHeart, title: 'Real Charity Impact', desc: '10% of every subscription goes directly to your chosen charity, every month.' },
    { icon: HiStar, title: 'Jackpot Rollovers', desc: 'No 5-match winner? The jackpot carries forward and grows until someone wins.' },
  ];

  return (
    <div className="bg-navy min-h-screen overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <Orbs />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-24 pb-16">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Monthly draws now live — next draw in
            <CountdownBadge />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.15] sm:leading-[1.05] tracking-tight mb-6"
          >
            Play Golf.{' '}
            <span className="relative inline-block">
              <span className="text-gold">Win Prizes.</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gold/40 rounded-full origin-left"
              />
            </span>
            <br />
            <span className="text-white/60">Change Lives.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Every round you play enters you into monthly prize draws that fund the charities you love.
            Golf with purpose. Win with meaning.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/signup">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(212,175,55,0.35)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-navy text-base font-black rounded-2xl shadow-xl shadow-gold/20 cursor-pointer transition-shadow"
              >
                Start Playing Free
                <HiArrowRight className="w-5 h-5" />
              </motion.span>
            </Link>
            <Link to="/how-it-works">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white text-base font-semibold rounded-2xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                See How It Works
              </motion.span>
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-white/30"
          >
            <span className="flex items-center gap-2">
              <span className="text-gold font-bold text-base">1,250+</span> active players
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-2">
              <span className="text-gold font-bold text-base">£47,230</span> raised for charity
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-2">
              <span className="text-gold font-bold text-base">4</span> charities supported
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <HiChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          IMPACT STATS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-dark to-navy" />
        <div className="relative max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Real Impact</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Numbers that matter</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Every subscription, every score, every draw — it all adds up to something real.</p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: 47230, prefix: '£', label: 'Raised for Charities', sub: 'and growing every month', delay: 0 },
              { value: 1250, label: 'Active Players', sub: 'across the UK', delay: 0.1 },
              { value: 89, suffix: '%', label: 'Player Satisfaction', sub: 'based on member surveys', delay: 0.2 },
            ].map((stat, i) => (
              <Section key={i} delay={stat.delay}>
                <div className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-gold/20 transition-colors group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-5xl sm:text-6xl font-black text-gold mb-3 tabular-nums">
                      <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix || ''} />
                    </div>
                    <div className="text-white font-semibold text-lg mb-1">{stat.label}</div>
                    <div className="text-white/30 text-sm">{stat.sub}</div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Simple Process</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Three steps to start</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">No complicated rules. Just golf, scores, and monthly draws.</p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

            {steps.map((step, i) => (
              <Section key={i} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group h-full"
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center`}>
                        <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>
                      <span className="text-5xl font-black text-white/5 leading-none">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              </Section>
            ))}
          </div>

          <Section delay={0.4} className="text-center mt-10">
            <Link to="/how-it-works" className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-semibold transition-colors">
              Learn more about how it works <HiArrowRight className="w-4 h-4" />
            </Link>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURED CHARITY
      ═══════════════════════════════════════════════ */}
      {featuredCharity && (
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <Section>
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.06]">
                {/* Background image with overlay */}
                <div className="absolute inset-0">
                  <img src={featuredCharity.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />
                </div>
                <div className="relative z-10 p-10 sm:p-16 flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-2 text-gold text-sm font-semibold uppercase tracking-widest mb-4">
                      <HiHeart className="w-4 h-4" /> Featured Charity
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">{featuredCharity.name}</h3>
                    <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-lg">{featuredCharity.description}</p>
                    <Link to={`/charities/${featuredCharity.id}`}>
                      <motion.span
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-navy font-bold rounded-xl shadow-lg shadow-gold/20 cursor-pointer hover:bg-gold-light transition-colors"
                      >
                        Support This Charity <HiArrowRight className="w-4 h-4" />
                       </motion.span>
                    </Link>
                  </div>
                  <div className="hidden md:block w-64 h-64 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={featuredCharity.image_url} alt={featuredCharity.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          PRIZE POOL + COUNTDOWN
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <Section>
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Next Draw</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Don't miss your chance</h2>
            <p className="text-white/40 text-lg mb-12">Draws happen on the last day of every month. Subscribe before then to enter.</p>
            <div className="mb-12">
              <CountdownTimer />
            </div>
            {drawInfo?.estimatedPools && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                {[
                  { label: '5-Number Match', value: drawInfo.estimatedPools.fiveMatch, highlight: true, rollover: drawInfo.estimatedPools.carriedOver > 0 },
                  { label: '4-Number Match', value: drawInfo.estimatedPools.fourMatch, highlight: false },
                  { label: '3-Number Match', value: drawInfo.estimatedPools.threeMatch, highlight: false },
                ].map((pool, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${pool.highlight ? 'bg-gold/5 border-gold/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                    <p className="text-white/40 text-sm mb-2">{pool.label}</p>
                    <p className={`text-3xl font-black ${pool.highlight ? 'text-gold' : 'text-white'}`}>{formatCurrency(pool.value)}</p>
                    {pool.rollover && <p className="text-coral text-xs mt-1 font-semibold">Includes jackpot rollover</p>}
                  </div>
                ))}
              </div>
            )}
            <Link to="/signup">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(212,175,55,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 px-10 py-4 bg-gold text-navy text-lg font-black rounded-2xl shadow-xl shadow-gold/20 cursor-pointer"
              >
                Enter the Draw <HiArrowRight className="w-5 h-5" />
              </motion.span>
            </Link>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Why GolfCharity</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Built different</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Not just another subscription. A platform that gives back every single month.</p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Section key={i} delay={i * 0.1}>
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-gold/20 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                    <f.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Members</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">What players say</h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Section key={i} delay={i * 0.1}>
                <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <HiStar key={j} className="w-4 h-4 text-gold" />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-white/30 text-xs">{t.role}</div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest mb-4">Pricing</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Simple, honest pricing</h2>
            <p className="text-white/40 text-lg">No hidden fees. Cancel anytime.</p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Monthly',
                price: '£9.99',
                period: '/month',
                sub: 'Billed monthly. Cancel anytime.',
                features: ['Monthly prize draws', 'Score tracking (rolling 5)', 'Charity contribution', 'Full dashboard access'],
                cta: 'Get Started',
                highlight: false,
                badge: null,
              },
              {
                name: 'Yearly',
                price: '£7.99',
                period: '/month',
                sub: '£95.88 billed annually.',
                features: ['Everything in Monthly', '20% savings vs monthly', 'Priority support', 'Early draw access'],
                cta: 'Best Value',
                highlight: true,
                badge: 'SAVE 20%',
              },
            ].map((plan, i) => (
              <Section key={i} delay={i * 0.1}>
                <div className={`relative p-8 rounded-3xl border h-full flex flex-col ${
                  plan.highlight
                    ? 'bg-gold/5 border-gold/30'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-navy text-xs font-black rounded-full tracking-wider">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">{plan.name}</h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-5xl font-black text-white">{plan.price}</span>
                      <span className="text-white/40 mb-2">{plan.period}</span>
                    </div>
                    <p className="text-white/30 text-sm">{plan.sub}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                          <HiShieldCheck className="w-3 h-3 text-gold" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <motion.span
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors ${
                        plan.highlight
                          ? 'bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {plan.cta} <HiArrowRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center border border-gold/10"
              style={{ background: 'radial-gradient(ellipse at center top, rgba(212,175,55,0.12) 0%, rgba(13,27,42,0.8) 60%)' }}
            >
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative">
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Ready to play with purpose?</h2>
                <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">Join 1,250+ golfers who are winning prizes and funding charities every month.</p>
                <Link to="/signup">
                  <motion.span
                    whileHover={{ scale: 1.04, boxShadow: '0 25px 70px rgba(212,175,55,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-3 px-10 py-4 bg-gold text-navy text-lg font-black rounded-2xl shadow-xl shadow-gold/25 cursor-pointer"
                  >
                    Start Playing Today <HiArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
                <p className="text-white/20 text-sm mt-6">No commitment. Cancel anytime. First draw entry included.</p>
              </div>
            </div>
          </Section>
        </div>
      </section>

    </div>
  );
}



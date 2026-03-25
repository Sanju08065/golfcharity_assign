import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  HiEye, HiEyeOff, HiArrowRight, HiCheck, HiHeart,
  HiUser, HiMail, HiLockClosed, HiShieldCheck
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { charitiesAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

// Password strength
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'bg-white/10' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Weak', color: 'bg-coral' };
  if (s <= 3) return { score: s, label: 'Fair', color: 'bg-yellow-400' };
  return { score: s, label: 'Strong', color: 'bg-green-400' };
}

// Step pill
function StepPill({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
        done ? 'bg-gold text-navy' : active ? 'bg-gold/20 border border-gold text-gold' : 'bg-white/[0.05] border border-white/10 text-white/25'
      }`}>
        {done ? <HiCheck className="w-3.5 h-3.5" /> : n}
      </div>
      <span className={`text-xs font-medium hidden sm:block transition-colors ${active ? 'text-white/70' : 'text-white/20'}`}>{label}</span>
    </div>
  );
}

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.28 }
};

export default function Signup() {
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({ mode: 'onTouched' });
  const { register: authRegister, loading } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [charities, setCharities] = useState([]);
  const [charitiesLoading, setCharitiesLoading] = useState(true);
  const [selectedCharity, setSelectedCharity] = useState(null); // null = choose later

  const password = watch('password', '');
  const strength = getStrength(password);

  useEffect(() => {
    charitiesAPI.list()
      .then(r => setCharities(r.data.data || []))
      .catch(() => {})
      .finally(() => setCharitiesLoading(false));
  }, []);

  const goToStep2 = async () => {
    const valid = await trigger(['full_name', 'email', 'password']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data) => {
    try {
      const result = await authRegister({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        charity_id: selectedCharity || null,
      });

      // If charity was selected, save it immediately after registration
      if (selectedCharity && result?.data?.session) {
        try {
          await charitiesAPI.updateUserCharity({ charity_id: selectedCharity });
        } catch { /* non-fatal */ }
      }

      toast.success('Welcome to GolfCharity!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setStep(1); // go back to fix details
    }
  };

  return (
    <div className="min-h-screen bg-navy flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-navy-dark" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(212,175,55,0.11) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 bg-gold rounded-xl flex items-center justify-center shadow-xl shadow-gold/30">
              <span className="text-navy font-black text-sm">GC</span>
            </div>
            <span className="text-white font-bold text-xl">Golf<span className="text-gold">Charity</span></span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-gold text-xs font-bold uppercase tracking-[0.2em] mb-4">Join the community</p>
            <h2 className="text-5xl font-black text-white leading-[1.1] mb-5">
              Join 1,250+<br /><span className="text-gold">golfers</span><br />making a<br />difference.
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-10 max-w-xs">
              Subscribe, log your scores, and get entered into monthly draws — while funding the charities you care about.
            </p>

            <div className="space-y-5">
              {[
                { n: '01', title: 'Create your account', desc: 'Takes less than 2 minutes', done: step > 1 },
                { n: '02', title: 'Pick a charity', desc: 'We support 4 UK charities', done: step > 2 },
                { n: '03', title: 'Start playing', desc: 'Log scores, enter draws, win prizes', done: false },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                  className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                    s.done ? 'bg-gold text-navy' : 'bg-white/[0.05] text-white/30'
                  }`}>
                    {s.done ? <HiCheck className="w-4 h-4" /> : s.n}
                  </div>
                  <div>
                    <div className="text-white/70 text-sm font-semibold">{s.title}</div>
                    <div className="text-white/25 text-xs">{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-white/20 text-xs">No credit card required to sign up.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto">
        <div className="absolute inset-0 bg-navy" />

        <div className="lg:hidden relative z-10 mb-8">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <span className="text-navy font-black text-sm">GC</span>
            </div>
            <span className="text-white font-bold text-xl">Golf<span className="text-gold">Charity</span></span>
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[400px]">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-7">
            <StepPill n={1} label="Account" active={step === 1} done={step > 1} />
            <div className={`flex-1 h-px transition-colors ${step > 1 ? 'bg-gold/40' : 'bg-white/[0.08]'}`} />
            <StepPill n={2} label="Charity" active={step === 2} done={false} />
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Account details ── */}
            {step === 1 && (
              <motion.div key="step1" {...slide}>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8">
                  <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1.5">Create account</h1>
                    <p className="text-white/40 text-sm">Start playing, winning, and giving back</p>
                  </div>

                  <form onSubmit={e => { e.preventDefault(); goToStep2(); }} className="space-y-4">

                    {/* Full name */}
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Full name</label>
                      <div className="relative">
                        <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input type="text" placeholder="John Smith" autoComplete="name"
                          {...register('full_name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                          className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.05] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                            errors.full_name ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                          }`}
                        />
                      </div>
                      {errors.full_name && <p className="text-coral text-xs mt-1.5">{errors.full_name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Email address</label>
                      <div className="relative">
                        <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input type="email" placeholder="you@example.com" autoComplete="email"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
                          })}
                          className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.05] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                            errors.email ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                          }`}
                        />
                      </div>
                      {errors.email && <p className="text-coral text-xs mt-1.5">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
                      <div className="relative">
                        <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" autoComplete="new-password"
                          {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 6, message: 'At least 6 characters' }
                          })}
                          className={`w-full pl-10 pr-12 py-3.5 bg-white/[0.05] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                            errors.password ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                          }`}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                          {showPw ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-coral text-xs mt-1.5">{errors.password.message}</p>}
                      {password && (
                        <div className="mt-2.5 space-y-1">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/[0.06]'}`} />
                            ))}
                          </div>
                          <p className="text-white/30 text-xs">{strength.label} password</p>
                        </div>
                      )}
                    </div>

                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors mt-2">
                      Continue <HiArrowRight className="w-4 h-4" />
                    </motion.button>
                  </form>

                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-white/20 text-xs">have an account?</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <Link to="/login">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/15 text-white/70 hover:text-white font-semibold text-sm rounded-xl transition-all cursor-pointer">
                      Log in instead <HiArrowRight className="w-4 h-4" />
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Charity selection ── */}
            {step === 2 && (
              <motion.div key="step2" {...slide}>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8">
                  <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1.5">Pick a charity</h1>
                    <p className="text-white/40 text-sm">10% of your subscription goes directly to them each month</p>
                  </div>

                  <div className="space-y-2.5 mb-6 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {charitiesLoading ? (
                      <div className="flex justify-center py-8">
                        <svg className="animate-spin w-6 h-6 text-gold/40" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    ) : charities.map((c, i) => (
                      <motion.button key={c.id} type="button"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedCharity(c.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                          selectedCharity === c.id
                            ? 'bg-gold/[0.07] border-gold/35 shadow-lg shadow-gold/5'
                            : 'bg-white/[0.03] border-white/[0.07] hover:border-white/15 hover:bg-white/[0.05]'
                        }`}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.05]">
                          {c.image_url
                            ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                            : <div className="w-full h-full flex items-center justify-center"><HiHeart className="w-5 h-5 text-gold/40" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{c.name}</div>
                          <div className="text-white/30 text-xs truncate mt-0.5">{c.description?.slice(0, 60)}...</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedCharity === c.id ? 'border-gold bg-gold shadow-md shadow-gold/30' : 'border-white/20'
                        }`}>
                          {selectedCharity === c.id && <HiCheck className="w-3 h-3 text-navy" />}
                        </div>
                      </motion.button>
                    ))}

                    {/* Skip option */}
                    <button type="button" onClick={() => setSelectedCharity(null)}
                      className={`w-full p-3.5 rounded-2xl border text-sm transition-all ${
                        selectedCharity === null
                          ? 'bg-white/[0.06] border-white/20 text-white/60'
                          : 'border-white/[0.06] text-white/25 hover:border-white/10 hover:text-white/40'
                      }`}>
                      Choose later from dashboard
                    </button>
                  </div>

                  {/* Selected charity badge */}
                  {selectedCharity && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/[0.06] border border-gold/15 mb-4">
                      <HiShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
                      <p className="text-gold/80 text-xs font-medium">
                        {charities.find(c => c.id === selectedCharity)?.name} selected — 10% of your sub goes here
                      </p>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading
                        ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Creating account...</>
                        : <>Create Account <HiArrowRight className="w-4 h-4" /></>
                      }
                    </motion.button>
                  </form>

                  <button type="button" onClick={() => setStep(1)}
                    className="w-full py-3 text-white/30 hover:text-white/50 text-sm transition-colors mt-3">
                    ← Back to account details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

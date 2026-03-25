import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { HiEye, HiEyeOff, HiArrowRight, HiShieldCheck, HiStar, HiHeart, HiLockClosed, HiMail } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const STATS = [
  { value: '1,250+', label: 'Active players' },
  { value: '£47k+', label: 'Raised for charity' },
  { value: '4', label: 'UK charities' },
];

const PERKS = [
  { icon: HiStar, text: 'Monthly prize draws with real cash prizes' },
  { icon: HiHeart, text: '10% of your subscription funds your chosen charity' },
  { icon: HiShieldCheck, text: 'Fully transparent — every draw is verifiable' },
];

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async ({ email, password }) => {
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      const isAdmin = user?.profile?.role === 'admin';
      // Admins always go to /admin — never honour a redirect to /dashboard
      if (isAdmin) {
        navigate('/admin', { replace: true });
        return;
      }
      // For regular users, honour the redirect param if present
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo), { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-navy-dark" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.13) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        <motion.div animate={{ y: [0, -24, 0], x: [0, 12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />
        <motion.div animate={{ y: [0, 18, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,85,58,0.07) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 bg-gold rounded-xl flex items-center justify-center shadow-xl shadow-gold/30">
              <span className="text-navy font-black text-sm">GC</span>
            </div>
            <span className="text-white font-bold text-xl">Golf<span className="text-gold">Charity</span></span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-gold text-xs font-bold uppercase tracking-[0.2em] mb-4">Welcome back</p>
            <h2 className="text-5xl font-black text-white leading-[1.1] mb-5">
              Play Golf.<br /><span className="text-gold">Win Prizes.</span><br />Change Lives.
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-10 max-w-xs">
              Every round you play enters you into monthly draws that fund the charities you love.
            </p>
            <div className="space-y-3.5">
              {PERKS.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center flex-shrink-0">
                    <p.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="text-white/50 text-sm">{p.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-10">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-gold font-black text-xl">{value}</div>
              <div className="text-white/25 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-navy" />

        <div className="lg:hidden relative z-10 mb-10">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <span className="text-navy font-black text-sm">GC</span>
            </div>
            <span className="text-white font-bold text-xl">Golf<span className="text-gold">Charity</span></span>
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[380px]">

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-black text-white mb-1.5">Welcome back</h1>
              <p className="text-white/40 text-sm">Log in to your GolfCharity account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Email</label>
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-white/30 hover:text-gold text-xs transition-colors">Forgot?</Link>
                </div>
                <div className="relative">
                  <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                    {...register('password', { required: 'Password is required' })}
                    className={`w-full pl-10 pr-12 py-3.5 bg-white/[0.05] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                      errors.password ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-coral text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors disabled:opacity-50 mt-2">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Logging in...</>
                  : <>Log In <HiArrowRight className="w-4 h-4" /></>
                }
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/20 text-xs">new here?</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/15 text-white/70 hover:text-white font-semibold text-sm rounded-xl transition-all cursor-pointer">
                Create free account <HiArrowRight className="w-4 h-4" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

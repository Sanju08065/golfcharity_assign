import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiUser, HiLockClosed, HiCheckCircle, HiMail,
  HiPencil, HiEye, HiEyeOff, HiBadgeCheck, HiClock
} from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

function getInitials(name, email) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email?.[0] || 'U').toUpperCase();
}

function InputField({ label, error, children }) {
  return (
    <div>
      {label && <label className="block text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">{label}</label>}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-coral text-xs mt-1.5">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full px-4 py-3.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
    hasError ? 'border-coral/50 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
  }`;

export default function Settings() {
  const { user, updateProfile, loading } = useAuthStore();
  const profile = user?.profile;
  const name = profile?.full_name || '';
  const email = user?.email || '';
  const initials = getInitials(name, email);
  const isActive = profile?.subscription_status === 'active';
  const isAdmin = profile?.role === 'admin';

  const [nameSuccess, setNameSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register: regName,
    handleSubmit: handleName,
    reset: resetName,
    formState: { errors: nameErrors, isDirty: nameDirty },
  } = useForm({ defaultValues: { full_name: name } });

  // Re-initialize form when profile loads (e.g. on hard refresh)
  useEffect(() => {
    if (name) resetName({ full_name: name });
  }, [name]);

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    watch,
    formState: { errors: pwErrors },
  } = useForm();

  const newPwValue = watch('new_password', '');

  const pwStrength = (() => {
    const v = newPwValue;
    if (!v) return 0;
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-coral', 'bg-yellow-400', 'bg-gold', 'bg-green-400'];
  const strengthText = ['', 'text-coral', 'text-yellow-400', 'text-gold', 'text-green-400'];

  const onSaveName = async ({ full_name }) => {
    try {
      await updateProfile({ full_name });
      setNameSuccess(true);
      toast.success('Name updated');
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSavePassword = async ({ current_password, new_password }) => {
    try {
      await updateProfile({ current_password, new_password });
      setPwSuccess(true);
      resetPw();
      toast.success('Password changed');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6 pb-8"
    >

      {/* ── Profile hero card ── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.06]"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(212,175,55,0.1) 0%, rgba(13,27,42,0.8) 60%)' }}
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative p-8 flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center shadow-xl shadow-gold/10">
              <span className="text-gold text-3xl font-black">{initials}</span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-navy flex items-center justify-center ${isActive ? 'bg-green-400' : 'bg-white/20'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white truncate">{name || 'Your Name'}</h1>
            <p className="text-white/40 text-sm truncate mt-0.5">{email}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isAdmin
                  ? 'bg-gold/10 border-gold/20 text-gold'
                  : isActive
                  ? 'bg-green-400/10 border-green-400/20 text-green-400'
                  : 'bg-white/[0.05] border-white/10 text-white/30'
              }`}>
                {isAdmin
                  ? <HiBadgeCheck className="w-3.5 h-3.5" />
                  : isActive
                  ? <HiBadgeCheck className="w-3.5 h-3.5" />
                  : <HiClock className="w-3.5 h-3.5" />
                }
                {isAdmin ? 'Administrator' : isActive ? 'Active Subscriber' : 'No Subscription'}
              </span>
              {!isAdmin && profile?.subscription_plan && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/10 border border-gold/20 text-gold capitalize">
                  {profile.subscription_plan} plan
                </span>
              )}            </div>
          </div>
        </div>
      </div>

      {/* ── Display name ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <HiUser className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Display Name</h2>
            <p className="text-white/30 text-xs">How you appear across the platform</p>
          </div>
        </div>
        <form onSubmit={handleName(onSaveName)} className="p-6 space-y-4">
          <InputField error={nameErrors.full_name?.message}>
            <div className="relative">
              <input
                {...regName('full_name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' }
                })}
                placeholder="Your full name"
                className={inputCls(!!nameErrors.full_name)}
              />
              <HiPencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            </div>
          </InputField>
          <div className="flex items-center justify-between">
            <p className="text-white/20 text-xs">This name is visible to admins and in draw results.</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !nameDirty}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {nameSuccess
                ? <><HiCheckCircle className="w-4 h-4" /> Saved</>
                : 'Save Name'
              }
            </motion.button>
          </div>
        </form>
      </div>

      {/* ── Email (read-only) ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
            <HiMail className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Email Address</h2>
            <p className="text-white/30 text-xs">Used for login and notifications</p>
          </div>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{email}</p>
            <p className="text-white/20 text-xs mt-1">Email address cannot be changed</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/25 text-xs font-medium">Locked</span>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            <HiLockClosed className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Change Password</h2>
            <p className="text-white/30 text-xs">Keep your account secure</p>
          </div>
        </div>
        <form onSubmit={handlePw(onSavePassword)} className="p-6 space-y-4">

          <InputField label="Current Password" error={pwErrors.current_password?.message}>
            <div className="relative">
              <input
                {...regPw('current_password', { required: 'Current password is required' })}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputCls(!!pwErrors.current_password)} pr-12`}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                {showCurrent ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </InputField>

          <InputField label="New Password" error={pwErrors.new_password?.message}>
            <div className="relative">
              <input
                {...regPw('new_password', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'At least 6 characters' }
                })}
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputCls(!!pwErrors.new_password)} pr-12`}
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                {showNew ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
            {/* Strength meter */}
            {newPwValue && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? strengthColor[pwStrength] : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthText[pwStrength]}`}>{strengthLabel[pwStrength]}</p>
              </div>
            )}
          </InputField>

          <InputField label="Confirm New Password" error={pwErrors.confirm_password?.message}>
            <div className="relative">
              <input
                {...regPw('confirm_password', {
                  required: 'Please confirm your password',
                  validate: v => v === newPwValue || 'Passwords do not match'
                })}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputCls(!!pwErrors.confirm_password)} pr-12`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                {showConfirm ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </InputField>

          <div className="flex items-center justify-between pt-1">
            <p className="text-white/20 text-xs">You'll stay logged in after changing your password.</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {pwSuccess
                ? <><HiCheckCircle className="w-4 h-4" /> Changed</>
                : 'Update Password'
              }
            </motion.button>
          </div>
        </form>
      </div>

    </motion.div>
  );
}

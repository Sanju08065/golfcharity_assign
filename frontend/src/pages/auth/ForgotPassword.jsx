import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiArrowRight, HiMail, HiLockClosed, HiCheckCircle, HiEye, HiEyeOff } from 'react-icons/hi';
import { authAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
};

// Step indicator
function Steps({ current }) {
  const steps = ['Email', 'Verify OTP', 'New Password'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${
            i < current ? 'bg-gold text-navy' :
            i === current ? 'bg-gold/20 border border-gold text-gold' :
            'bg-white/[0.05] border border-white/10 text-white/20'
          }`}>
            {i < current ? <HiCheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-white/70' : 'text-white/20'}`}>{label}</span>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1 ${i < current ? 'bg-gold/50' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=new password, 3=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pwError, setPwError] = useState('');
  const otpRefs = useRef([]);

  // Step 0 — send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { setEmailError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email'); return; }
    setEmailError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent — check your inbox');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 1 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(email, code);
      toast.success('OTP verified');
      setStep(2);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setPwError('At least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp.join(''), newPassword);
      setStep(3);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-12">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,85,58,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/30">
              <span className="text-navy font-black text-sm">GC</span>
            </div>
            <span className="text-white font-bold text-xl">Golf<span className="text-gold">Charity</span></span>
          </Link>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">

            {/* ── Step 0: Email ── */}
            {step === 0 && (
              <motion.div key="email" {...slide}>
                <Steps current={0} />
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white mb-1">Forgot password?</h1>
                  <p className="text-white/40 text-sm">Enter your email and we'll send a 6-digit OTP.</p>
                </div>
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest font-semibold mb-2">Email address</label>
                    <div className="relative">
                      <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                        placeholder="you@example.com"
                        autoFocus
                        className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                          emailError ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                        }`}
                      />
                    </div>
                    {emailError && <p className="text-coral text-xs mt-1.5">{emailError}</p>}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : <> Send OTP <HiArrowRight className="w-4 h-4" /> </>}
                  </motion.button>
                </form>
                <p className="text-center text-white/30 text-sm mt-6">
                  Remember it?{' '}
                  <Link to="/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">Log in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 1: OTP ── */}
            {step === 1 && (
              <motion.div key="otp" {...slide}>
                <Steps current={1} />
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white mb-1">Check your email</h1>
                  <p className="text-white/40 text-sm">
                    We sent a 6-digit code to <span className="text-white/70 font-medium">{email}</span>
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP boxes */}
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest font-semibold mb-4 text-center">Enter OTP</label>
                    <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => otpRefs.current[i] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-white/[0.04] text-white focus:outline-none focus:ring-2 transition-all ${
                            otpError ? 'border-coral/60 focus:ring-coral/20' :
                            digit ? 'border-gold/50 focus:ring-gold/20' :
                            'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                          }`}
                        />
                      ))}
                    </div>
                    {otpError && <p className="text-coral text-xs mt-3 text-center">{otpError}</p>}
                    <p className="text-white/20 text-xs text-center mt-3">Code expires in 10 minutes</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : <> Verify OTP <HiArrowRight className="w-4 h-4" /> </>}
                  </motion.button>
                </form>

                <div className="flex items-center justify-between mt-5">
                  <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition-colors">
                    <HiArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try { await authAPI.forgotPassword(email); toast.success('New OTP sent'); setOtp(['','','','','','']); }
                      catch { toast.error('Failed to resend'); }
                      finally { setLoading(false); }
                    }}
                    className="text-gold/60 hover:text-gold text-sm transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: New password ── */}
            {step === 2 && (
              <motion.div key="password" {...slide}>
                <Steps current={2} />
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-white mb-1">Set new password</h1>
                  <p className="text-white/40 text-sm">Choose a strong password for your account.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest font-semibold mb-2">New Password</label>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setPwError(''); }}
                        placeholder="••••••••"
                        autoFocus
                        className="w-full pl-10 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showPw ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-widest font-semibold mb-2">Confirm Password</label>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setPwError(''); }}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-12 py-3.5 bg-white/[0.04] border rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                          pwError ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                        {showConfirm ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    {pwError && <p className="text-coral text-xs mt-1.5">{pwError}</p>}
                  </div>

                  {/* Password strength hint */}
                  {newPassword && (
                    <div className="flex gap-1.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          newPassword.length >= i * 3
                            ? i <= 2 ? 'bg-coral' : i === 3 ? 'bg-gold' : 'bg-green-400'
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Resetting...' : <> Reset Password <HiArrowRight className="w-4 h-4" /> </>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6"
                >
                  <HiCheckCircle className="w-10 h-10 text-gold" />
                </motion.div>
                <h1 className="text-2xl font-black text-white mb-2">Password reset!</h1>
                <p className="text-white/40 text-sm mb-8">Your password has been updated. You can now log in with your new password.</p>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold text-navy font-black text-sm rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-colors"
                >
                  Go to Login <HiArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

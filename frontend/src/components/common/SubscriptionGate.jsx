import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiLockClosed, HiX, HiArrowRight, HiStar, HiHeart, HiShieldCheck } from 'react-icons/hi';

// Event bus — axios interceptor fires this, component listens
const SUBSCRIPTION_GATE_EVENT = 'subscription:required';

export function triggerSubscriptionGate() {
  window.dispatchEvent(new CustomEvent(SUBSCRIPTION_GATE_EVENT));
}

const perks = [
  { icon: HiStar,        text: 'Enter monthly prize draws' },
  { icon: HiHeart,       text: 'Support your chosen charity' },
  { icon: HiShieldCheck, text: 'Full access to all features' },
];

export default function SubscriptionGate() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SUBSCRIPTION_GATE_EVENT, handler);
    return () => window.removeEventListener(SUBSCRIPTION_GATE_EVENT, handler);
  }, []);

  const goToPricing = () => {
    setOpen(false);
    navigate('/pricing');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60"
              style={{ background: 'linear-gradient(160deg, #1B2D45 0%, #0D1B2A 60%)' }}
            >
              {/* Close */}
              <div className="flex justify-end p-4 pb-0">
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              {/* Icon */}
              <div className="flex flex-col items-center px-8 pt-2 pb-6">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-xl shadow-gold/10">
                    <HiLockClosed className="w-9 h-9 text-gold" />
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gold/10 blur-xl -z-10" />
                </div>

                <h2 className="text-white font-black text-xl text-center mb-2">
                  Subscription Required
                </h2>
                <p className="text-white/40 text-sm text-center leading-relaxed mb-6">
                  This feature is only available to active subscribers. Join to unlock full access.
                </p>

                {/* Perks */}
                <div className="w-full space-y-2.5 mb-7">
                  {perks.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gold" />
                      </div>
                      <span className="text-white/60 text-sm">{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToPricing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold text-navy font-black text-sm shadow-lg shadow-gold/25 hover:bg-gold/90 transition-colors"
                >
                  View Plans <HiArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={() => setOpen(false)}
                  className="mt-3 text-white/25 hover:text-white/50 text-xs transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

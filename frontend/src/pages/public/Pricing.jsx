import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiCheck, HiLightningBolt, HiShieldCheck, HiStar } from 'react-icons/hi';
import { subscriptionAPI } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const FEATURES = [
  'Monthly prize draws',
  'Stableford score tracking (5 rolling scores)',
  'Charity contribution — you choose the %',
  'Full dashboard access',
  'Winner verification & payout',
  'Draw history & match analytics',
];

const YEARLY_EXTRAS = [
  'Everything in Monthly',
  'Stableford score tracking (5 rolling scores)',
  'Charity contribution — you choose the %',
  'Full dashboard access',
  'Winner verification & payout',
  'Draw history & match analytics',
  'Priority support',
];

export default function Pricing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!user) { navigate('/signup'); return; }
    try {
      setLoading(plan);
      const { data } = await subscriptionAPI.subscribe(plan);
      if (data.data?.url) window.location.href = data.data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="bg-navy min-h-screen py-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-widest mb-6">
            <HiStar className="w-3.5 h-3.5" /> Simple Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-lg">
            Every plan includes full access. Subscribe monthly or save 20% with yearly.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/15 transition-colors flex flex-col"
          >
            <div className="mb-6">
              <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Monthly</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">£9.99</span>
                <span className="text-white/30 text-sm mb-2">/ month</span>
              </div>
              <p className="text-white/25 text-xs">Cancel anytime</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-white/60 text-sm">
                  <HiCheck className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly'}
              className="w-full py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-bold text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-50"
            >
              {loading === 'monthly' ? 'Loading...' : 'Subscribe Monthly'}
            </motion.button>
          </motion.div>

          {/* Yearly — highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative p-8 rounded-2xl border border-gold/25 flex flex-col overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.08) 0%, rgba(13,27,42,0.6) 60%)' }}
          >
            {/* Popular badge */}
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gold text-navy text-xs font-black rounded-bl-xl rounded-tr-2xl">
              SAVE 20%
            </div>

            <div className="mb-6">
              <p className="text-gold text-sm uppercase tracking-widest mb-2 font-semibold">Yearly</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">£7.99</span>
                <span className="text-white/30 text-sm mb-2">/ month</span>
              </div>
              <p className="text-white/25 text-xs">Billed £95.88/year · saves £24</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {YEARLY_EXTRAS.map(f => (
                <li key={f} className="flex items-start gap-3 text-white/70 text-sm">
                  <HiCheck className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly'}
              className="w-full py-3.5 rounded-xl bg-gold text-navy font-black text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-lg shadow-gold/20"
            >
              {loading === 'yearly' ? 'Loading...' : 'Subscribe Yearly'}
            </motion.button>
          </motion.div>
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/25 text-sm"
        >
          {[
          { icon: HiShieldCheck, text: 'Stripe-secured payments' },
            { icon: HiLightningBolt, text: 'Instant access after payment' },
            { icon: HiCheck, text: 'Cancel anytime, no lock-in' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-gold/50" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* Test card note — dev only */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center"
          >
            <p className="text-white/20 text-xs">
              Test card: <span className="font-mono text-white/35">4242 4242 4242 4242</span> · any future date · any CVC · Stripe test mode
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

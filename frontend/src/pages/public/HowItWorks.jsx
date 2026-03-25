import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiUserAdd, HiPencilAlt, HiGift, HiCurrencyPound,
  HiQuestionMarkCircle, HiArrowRight, HiStar
} from 'react-icons/hi';

const STEPS = [
  {
    icon: HiUserAdd,
    step: '01',
    title: 'Subscribe',
    desc: 'Choose monthly (£9.99) or yearly (£7.99/mo). Select a charity you want to support — 10% of your subscription goes directly to them.',
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/20',
  },
  {
    icon: HiPencilAlt,
    step: '02',
    title: 'Enter Your Scores',
    desc: 'After each round, log your Stableford score (1–45). We keep your latest 5 scores on file — a new score automatically replaces the oldest.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: HiGift,
    step: '03',
    title: 'Monthly Draw',
    desc: 'At the end of each month, 5 winning numbers are drawn from the pool of all player scores — randomly or algorithmically weighted.',
    color: 'text-coral',
    bg: 'bg-coral/10',
    border: 'border-coral/20',
  },
  {
    icon: HiCurrencyPound,
    step: '04',
    title: 'Win Prizes',
    desc: 'Match 3, 4, or all 5 numbers to win from the prize pool. No 5-match winner? The jackpot rolls over to next month and keeps growing.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
];

const FAQS = [
  {
    q: 'What is a Stableford score?',
    a: 'Stableford is a scoring system in golf where points are awarded based on strokes taken at each hole. Scores typically range from 0 to 45 points per round.',
  },
  {
    q: 'How are winning numbers chosen?',
    a: 'Numbers are drawn from the pool of all player scores — either randomly (standard lottery-style) or algorithmically weighted by frequency. The admin selects the method each month.',
  },
  {
    q: 'What happens if nobody matches 5 numbers?',
    a: 'The 5-match prize pool carries over to the next month as a jackpot, growing until someone wins it.',
  },
  {
    q: 'How much goes to charity?',
    a: 'A minimum of 10% of your subscription goes to your chosen charity. You can increase this percentage at any time from your dashboard.',
  },
  {
    q: 'Can I change my charity?',
    a: 'Yes — switch your supported charity at any time from your dashboard.',
  },
  {
    q: 'How do I claim my prize?',
    a: 'Winners upload a screenshot of their scorecard as proof. Once verified by our team, the prize is paid out.',
  },
];

const PRIZE_TIERS = [
  { match: '5-Number Match', share: '40%', rollover: 'Yes (Jackpot)', color: 'text-gold', bg: 'bg-gold/[0.05]', border: 'border-gold/15' },
  { match: '4-Number Match', share: '35%', rollover: 'No',            color: 'text-blue-400', bg: 'bg-blue-400/[0.04]', border: 'border-blue-400/10' },
  { match: '3-Number Match', share: '25%', rollover: 'No',            color: 'text-white/60', bg: 'bg-white/[0.02]', border: 'border-white/[0.06]' },
];

export default function HowItWorks() {
  return (
    <div className="bg-navy min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto space-y-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-widest mb-6">
            <HiStar className="w-3.5 h-3.5" /> How It Works
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Golf meets charity<br />meets prizes.
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-lg">
            Here's the full breakdown — from signup to winning.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex items-start gap-6 p-6 rounded-2xl border ${step.bg} ${step.border}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center flex-shrink-0`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${step.color}`}>Step {step.step}</div>
                <h3 className="text-white font-black text-xl mb-2">{step.title}</h3>
                <p className="text-white/40 leading-relaxed">{step.desc}</p>
              </div>
              <div className={`text-4xl font-black opacity-10 ${step.color} hidden sm:block`}>{step.step}</div>
            </motion.div>
          ))}
        </div>

        {/* Prize pool breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-black text-white mb-6 text-center">Prize Pool Breakdown</h2>
          <div className="space-y-3">
            {PRIZE_TIERS.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center justify-between p-5 rounded-2xl border ${tier.bg} ${tier.border}`}
              >
                <div>
                  <p className={`font-bold ${tier.color}`}>{tier.match}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {tier.rollover === 'Yes (Jackpot)' ? 'Rolls over if unclaimed' : 'Does not roll over'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${tier.color}`}>{tier.share}</p>
                  {tier.rollover === 'Yes (Jackpot)' && (
                    <span className="text-xs text-gold/60 font-semibold">Jackpot</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-white/25 text-sm text-center mt-4">
            10% of each subscription contributes to the prize pool. Prizes split equally among multiple winners in the same tier.
          </p>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-black text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <HiQuestionMarkCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1.5">{faq.q}</h4>
                    <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-navy font-black text-base rounded-2xl shadow-xl shadow-gold/20 hover:bg-gold/90 transition-colors"
            >
              Start Playing Now <HiArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

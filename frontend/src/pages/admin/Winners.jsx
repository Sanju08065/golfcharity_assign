import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiCheck, HiX, HiCash, HiEye, HiStar,
  HiFilter, HiPhotograph, HiExclamation
} from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { winnersAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const MATCH_STYLES = {
  5: { bg: 'bg-gold/10',       border: 'border-gold/20',       text: 'text-gold',       label: 'Jackpot' },
  4: { bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   text: 'text-blue-400',   label: '4-Match' },
  3: { bg: 'bg-white/[0.05]',  border: 'border-white/[0.08]',  text: 'text-white/60',   label: '3-Match' },
};

const VERIFY_STYLES = {
  pending:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  submitted: 'bg-blue-400/10  text-blue-400  border-blue-400/20',
  approved:  'bg-green-400/10 text-green-400 border-green-400/20',
  rejected:  'bg-coral/10     text-coral     border-coral/20',
};

const PAY_STYLES = {
  pending: 'bg-white/[0.05] text-white/40 border-white/10',
  paid:    'bg-green-400/10 text-green-400 border-green-400/20',
};

function Pill({ label, styleClass }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styleClass}`}>
      {label}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
      <span className="text-gold text-xs font-bold">{(name || 'U').charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function AdminWinners() {
  const [winners, setWinners]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [proofModal, setProofModal] = useState(null);
  const [filter, setFilter]         = useState('all'); // all | pending | approved | paid
  const [acting, setActing]         = useState(null);  // id being acted on

  const fetchWinners = async () => {
    try {
      const { data } = await winnersAPI.adminList();
      setWinners(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWinners(); }, []);

  const handleVerify = async (id, status) => {
    try {
      setActing(id);
      await winnersAPI.verify(id, status);
      toast.success(`Winner ${status}`);
      fetchWinners();
    } catch {
      toast.error('Failed to verify');
    } finally {
      setActing(null);
    }
  };

  const handlePay = async (id) => {
    try {
      setActing(id);
      await winnersAPI.pay(id);
      toast.success('Marked as paid');
      fetchWinners();
    } catch {
      toast.error('Failed to mark as paid');
    } finally {
      setActing(null);
    }
  };

  const filtered = winners.filter(w => {
    if (filter === 'pending')  return w.verification_status === 'pending' || w.verification_status === 'submitted';
    if (filter === 'approved') return w.verification_status === 'approved' && w.payment_status === 'pending';
    if (filter === 'paid')     return w.payment_status === 'paid';
    return true;
  });

  const counts = {
    all:      winners.length,
    pending:  winners.filter(w => w.verification_status === 'pending' || w.verification_status === 'submitted').length,
    approved: winners.filter(w => w.verification_status === 'approved' && w.payment_status === 'pending').length,
    paid:     winners.filter(w => w.payment_status === 'paid').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Admin Panel</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Winners Management</h1>
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        {[
          { key: 'all',      label: 'All' },
          { key: 'pending',  label: 'Needs Review' },
          { key: 'approved', label: 'Awaiting Payment' },
          { key: 'paid',     label: 'Paid Out' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === tab.key
                ? 'bg-gold/10 border border-gold/20 text-gold'
                : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/30'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Winners list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((winner, i) => {
            const match = MATCH_STYLES[winner.match_type] || MATCH_STYLES[3];
            const drawLabel = winner.draws
              ? `${new Date(0, winner.draws.month - 1).toLocaleString('en', { month: 'short' })} ${winner.draws.year}`
              : '—';
            const isActing = acting === winner.id;

            return (
              <motion.div
                key={winner.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className={`p-5 rounded-2xl border transition-colors ${match.bg} ${match.border}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: user info */}
                  <div className="flex items-center gap-3">
                    <Avatar name={winner.profiles?.full_name} />
                    <div>
                      <p className="text-white font-semibold text-sm">{winner.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-white/30 text-xs">{winner.user_email}</p>
                    </div>
                  </div>

                  {/* Right: match badge + prize */}
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-xl border ${match.bg} ${match.border}`}>
                      <p className={`text-xs font-bold ${match.text}`}>{match.label}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg ${match.text}`}>{formatCurrency(winner.prize_amount)}</p>
                      <p className="text-white/25 text-xs">{drawLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Status row + actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06] flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Pill label={winner.verification_status} styleClass={VERIFY_STYLES[winner.verification_status] || VERIFY_STYLES.pending} />
                    <Pill label={winner.payment_status === 'paid' ? 'Paid' : 'Unpaid'} styleClass={PAY_STYLES[winner.payment_status] || PAY_STYLES.pending} />
                  </div>

                  <div className="flex items-center gap-2">
                    {winner.proof_url && (
                      <button
                        onClick={() => setProofModal(winner.proof_url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white text-xs font-medium transition-colors"
                      >
                        <HiEye className="w-3.5 h-3.5" /> View Proof
                      </button>
                    )}

                    {(winner.verification_status === 'pending' || winner.verification_status === 'submitted') && (
                      <>
                        <button
                          onClick={() => handleVerify(winner.id, 'approved')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-400/20 text-green-400 hover:bg-green-400/15 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <HiCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleVerify(winner.id, 'rejected')}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral/10 border border-coral/20 text-coral hover:bg-coral/15 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <HiX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                      <button
                        onClick={() => handlePay(winner.id)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <HiCash className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
        >
          <HiStar className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm">No winners in this category</p>
        </motion.div>
      )}

      {/* Proof image modal */}
      <Modal isOpen={!!proofModal} onClose={() => setProofModal(null)} title="Winner Proof">
        {proofModal && (
          <div className="space-y-3">
            <img
              src={proofModal}
              alt="Winner proof"
              className="w-full rounded-xl object-contain max-h-[60vh]"
            />
            <a
              href={proofModal}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white text-sm transition-colors"
            >
              <HiEye className="w-4 h-4" /> Open full size
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

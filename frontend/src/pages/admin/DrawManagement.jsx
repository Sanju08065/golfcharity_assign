import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus, HiPlay, HiCheck, HiLightningBolt, HiTicket,
  HiCurrencyPound, HiUsers, HiRefresh, HiChevronDown, HiChevronUp
} from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { drawsAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  draft:     'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  published: 'bg-green-400/10 text-green-400 border-green-400/20',
  cancelled: 'bg-coral/10 text-coral border-coral/20',
};

function DrawStatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

function WinningBall({ num }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
      <span className="text-gold font-black text-sm">{num}</span>
    </div>
  );
}

export default function DrawManagement() {
  const [draws, setDraws]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [simulating, setSimulating]   = useState(null); // drawId being simulated
  const [publishing, setPublishing]   = useState(null); // drawId being published
  const [simResult, setSimResult]     = useState(null);
  const [simDrawId, setSimDrawId]     = useState(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [drawType, setDrawType]       = useState('random');
  const [expanded, setExpanded]       = useState({});

  const fetchDraws = async () => {
    try {
      const { data } = await drawsAPI.list();
      setDraws(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDraws(); }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const now = new Date();
      await drawsAPI.create({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        draw_type: drawType,
      });
      toast.success('Draw created');
      setCreateModal(false);
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create draw');
    } finally {
      setCreating(false);
    }
  };

  const handleSimulate = async (drawId) => {
    try {
      setSimulating(drawId);
      const { data } = await drawsAPI.simulate(drawId);
      setSimResult(data.data);
      setSimDrawId(drawId);
      setShowSimModal(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally {
      setSimulating(null);
    }
  };

  const handlePublish = async (drawId) => {
    try {
      setPublishing(drawId);
      const winNums = simResult?.winning_numbers || null;
      await drawsAPI.publish(drawId, winNums);
      toast.success('Draw published successfully');
      setShowSimModal(false);
      setSimResult(null);
      setSimDrawId(null);
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishDirect = async (drawId) => {
    if (!confirm('Publish this draw without simulation? This action is final.')) return;
    try {
      setPublishing(drawId);
      await drawsAPI.publish(drawId, null);
      toast.success('Draw published');
      fetchDraws();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(null);
    }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <LoadingSpinner />;

  const draftDraws     = draws.filter(d => d.status === 'draft');
  const publishedDraws = draws.filter(d => d.status === 'published');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-white/30 text-sm mb-1">Admin Panel</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Draw Management</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
        >
          <HiPlus className="w-4 h-4" /> New Draw
        </motion.button>
      </motion.div>

      {/* Draft draws */}
      {draftDraws.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/30 text-xs uppercase tracking-wider font-semibold">Pending Draws</p>
          {draftDraws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-yellow-400/[0.03] border border-yellow-400/[0.12] hover:border-yellow-400/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                    <HiTicket className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-bold">
                        {new Date(0, draw.month - 1).toLocaleString('en', { month: 'long' })} {draw.year}
                      </h3>
                      <DrawStatusPill status={draw.status} />
                    </div>
                    <p className="text-white/30 text-xs capitalize">{draw.draw_type} draw</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleSimulate(draw.id)}
                    disabled={simulating === draw.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/15 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {simulating === draw.id
                      ? <HiRefresh className="w-4 h-4 animate-spin" />
                      : <HiPlay className="w-4 h-4" />
                    }
                    Simulate
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handlePublishDirect(draw.id)}
                    disabled={publishing === draw.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 hover:bg-green-400/15 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <HiCheck className="w-4 h-4" />
                    {publishing === draw.id ? 'Publishing...' : 'Publish'}
                  </motion.button>
                </div>
              </div>

              {draw.carried_over_amount > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-coral/10 border border-coral/20">
                  <HiLightningBolt className="w-4 h-4 text-coral flex-shrink-0" />
                  <p className="text-coral text-xs font-semibold">
                    Jackpot rollover: {formatCurrency(draw.carried_over_amount)} carried from previous draw
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Published draws */}
      {publishedDraws.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/30 text-xs uppercase tracking-wider font-semibold">Published Draws</p>
          {publishedDraws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(draw.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
                    <HiCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-bold">
                        {new Date(0, draw.month - 1).toLocaleString('en', { month: 'long' })} {draw.year}
                      </h3>
                      <DrawStatusPill status={draw.status} />
                    </div>
                    <p className="text-white/30 text-xs capitalize">{draw.draw_type} draw</p>
                  </div>
                </div>
                {expanded[draw.id]
                  ? <HiChevronUp className="w-4 h-4 text-white/30" />
                  : <HiChevronDown className="w-4 h-4 text-white/30" />
                }
              </button>

              <AnimatePresence>
                {expanded[draw.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-white/[0.05] pt-4">
                      {draw.winning_numbers && (
                        <div>
                          <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Winning Numbers</p>
                          <div className="flex gap-2 flex-wrap">
                            {draw.winning_numbers.map((num, j) => (
                              <WinningBall key={j} num={num} />
                            ))}
                          </div>
                        </div>
                      )}
                      {draw.prize_pools?.[0] && (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: '5-Match Pool', value: draw.prize_pools[0].five_match_pool, color: 'text-gold' },
                            { label: '4-Match Pool', value: draw.prize_pools[0].four_match_pool, color: 'text-blue-400' },
                            { label: '3-Match Pool', value: draw.prize_pools[0].three_match_pool, color: 'text-white/60' },
                          ].map(p => (
                            <div key={p.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                              <p className="text-white/30 text-xs mb-1">{p.label}</p>
                              <p className={`font-bold text-sm ${p.color}`}>{formatCurrency(p.value)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {draws.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
        >
          <HiTicket className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm">No draws yet. Create one to get started.</p>
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Draw">
        <div className="space-y-5">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Draw Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'random', label: 'Random', desc: 'Standard lottery-style random draw' },
                { value: 'algorithmic', label: 'Algorithmic', desc: 'Frequency-weighted scoring' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDrawType(opt.value)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    drawType === opt.value
                      ? 'bg-gold/10 border-gold/30 text-gold'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/15'
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">{opt.label}</p>
                  <p className="text-xs opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Draw'}
          </button>
        </div>
      </Modal>

      {/* Simulation Results Modal */}
      <Modal
        isOpen={showSimModal}
        onClose={() => { setShowSimModal(false); setSimResult(null); setSimDrawId(null); }}
        title="Simulation Preview"
      >
        {simResult && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Winning Numbers</p>
              <div className="flex gap-2 flex-wrap">
                {simResult.winning_numbers?.map((num, i) => (
                  <WinningBall key={i} num={num} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '5-Match', value: simResult.winner_counts?.five || 0, color: 'text-gold' },
                { label: '4-Match', value: simResult.winner_counts?.four || 0, color: 'text-blue-400' },
                { label: '3-Match', value: simResult.winner_counts?.three || 0, color: 'text-white/60' },
              ].map(w => (
                <div key={w.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <p className="text-white/30 text-xs mb-1">{w.label}</p>
                  <p className={`text-2xl font-black ${w.color}`}>{w.value}</p>
                  <p className="text-white/20 text-xs">winner{w.value !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <HiUsers className="w-4 h-4 text-white/30 flex-shrink-0" />
              <p className="text-white/50 text-sm">
                {simResult.total_participants} total participants
              </p>
            </div>

            {simResult.jackpot_rollover > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-coral/10 border border-coral/20">
                <HiLightningBolt className="w-4 h-4 text-coral flex-shrink-0" />
                <p className="text-coral text-sm font-semibold">
                  No 5-match winner — {formatCurrency(simResult.jackpot_rollover)} rolls over to next draw
                </p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-yellow-400/[0.05] border border-yellow-400/[0.15]">
              <p className="text-yellow-400/80 text-xs">
                This is a preview only. Click "Publish Draw" to make it official and notify winners.
              </p>
            </div>

            <button
              onClick={() => handlePublish(simDrawId)}
              disabled={publishing === simDrawId}
              className="w-full py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {publishing === simDrawId ? 'Publishing...' : 'Publish Draw'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

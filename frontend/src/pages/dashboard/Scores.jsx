import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { HiPencil, HiTrash, HiPlus, HiChartBar, HiStar } from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import DatePicker from '../../components/common/DatePicker';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { scoresAPI } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const MAX = 5;

function FieldInput({ label, error, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">{label}</label>}
      <input
        {...props}
        className={`w-full px-4 py-3 bg-white/[0.04] border rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all text-sm ${
          error ? 'border-coral/60 focus:ring-coral/20' : 'border-white/[0.08] focus:border-gold/50 focus:ring-gold/20'
        }`}
      />
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}

export default function Scores() {
  const { user } = useAuthStore();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();
  const { register: editReg, handleSubmit: editSubmit, setValue, control: editControl } = useForm();

  const fetchScores = async () => {
    try {
      const { data } = await scoresAPI.getByUser(user.id);
      setScores(data.data || []);
    } catch { toast.error('Failed to load scores'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user?.id) fetchScores();
  }, [user?.id]);

  const onAdd = async (fd) => {
    try {
      setSubmitting(true);
      const wasAtMax = scores.length >= MAX; // capture before state update
      const { data: res } = await scoresAPI.add({ score: parseInt(fd.score), played_date: fd.played_date });
      const newScore = res.data;
      setScores(prev => {
        const updated = [...prev, newScore].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return updated.slice(0, MAX);
      });
      toast.success(wasAtMax ? 'Score added — oldest replaced!' : 'Score added!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add score');
      fetchScores();
    } finally { setSubmitting(false); }
  };

  const onEdit = async (fd) => {
    try {
      await scoresAPI.update(editModal.id, { score: parseInt(fd.edit_score), played_date: fd.edit_date });
      toast.success('Score updated');
      setEditModal(null);
      fetchScores();
    } catch { toast.error('Failed to update score'); }
  };

  const onDelete = async (id) => {
    try {
      await scoresAPI.delete(id);
      toast.success('Score deleted');
      setDeleteId(null);
      fetchScores();
    } catch { toast.error('Failed to delete score'); }
  };

  const openEdit = (s) => { setEditModal(s); setValue('edit_score', s.score); setValue('edit_date', s.played_date); };

  const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores.map(s => s.score)) : 0;
  const filled = scores.length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Scores</h1>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Stored', value: `${filled}/${MAX}`, icon: HiChartBar },
          { label: 'Average', value: avg || '—', icon: HiStar },
          { label: 'Best', value: best || '—', icon: HiStar },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-black text-gold">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Capacity bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Score slots used</span>
          <span className={filled >= MAX ? 'text-coral' : 'text-white/30'}>{filled}/{MAX}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${filled >= MAX ? 'bg-coral' : 'bg-gold'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(filled / MAX) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {filled >= MAX && (
          <p className="text-coral text-xs mt-1.5">Slot full — next score will replace the oldest</p>
        )}
      </motion.div>

      {/* Add score form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <h2 className="text-white font-bold mb-4">Add New Score</h2>
        <form onSubmit={handleSubmit(onAdd)} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <FieldInput
              type="number"
              placeholder="Score (1–45)"
              {...register('score', { required: 'Required', min: { value: 1, message: 'Min 1' }, max: { value: 45, message: 'Max 45' } })}
              error={errors.score?.message}
            />
          </div>
          <div className="flex-1">
            <Controller
              name="played_date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <DatePicker
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Date played"
                  error={errors.played_date?.message}
                />
              )}
            />
          </div>
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50 self-start sm:self-auto flex-shrink-0"
          >
            {submitting ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <HiPlus className="w-4 h-4" />}
            Add Score
          </motion.button>
        </form>
      </motion.div>

      {/* Score list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {scores.map((score, i) => (
            <motion.div
              key={score.id}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group"
            >
              {/* Rank */}
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <span className="text-white/20 text-xs font-bold">#{i + 1}</span>
              </div>

              {/* Score bubble */}
              <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/15 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-black text-gold">{score.score}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Stableford Score</p>
                <p className="text-white/30 text-xs">{formatDate(score.played_date)}</p>
              </div>

              {/* Score bar */}
              <div className="hidden sm:flex flex-col gap-1 w-24">
                <div className="h-1 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gold/60" style={{ width: `${(score.score / 45) * 100}%` }} />
                </div>
                <span className="text-white/20 text-[10px]">{Math.round((score.score / 45) * 100)}% of max</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(score)}
                  className="w-8 h-8 rounded-lg hover:bg-gold/10 text-white/30 hover:text-gold transition-colors flex items-center justify-center">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(score.id)}
                  className="w-8 h-8 rounded-lg hover:bg-coral/10 text-white/30 hover:text-coral transition-colors flex items-center justify-center">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {scores.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <HiChartBar className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 font-medium mb-1">No scores yet</p>
            <p className="text-white/20 text-sm">Add your first Stableford score above</p>
          </motion.div>
        )}
      </div>

      {/* Delete modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Score">
        <p className="text-white/50 text-sm mb-6">This score will be permanently removed. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)}
            className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-colors">
            Cancel
          </button>
          <button onClick={() => onDelete(deleteId)}
            className="flex-1 py-3 rounded-xl bg-coral text-white text-sm font-bold hover:bg-coral-light transition-colors">
            Delete
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Score">
        <form onSubmit={editSubmit(onEdit)} className="space-y-4">
          <FieldInput type="number" label="Score (1–45)" {...editReg('edit_score', { required: true, min: 1, max: 45 })} />
          <Controller
            name="edit_date"
            control={editControl}
            rules={{ required: 'Date is required' }}
            render={({ field }) => (
              <DatePicker
                label="Date Played"
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Select date"
              />
            )}
          />
          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold-light transition-colors">
              Save Changes
            </button>
            <button type="button" onClick={() => setEditModal(null)}
              className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

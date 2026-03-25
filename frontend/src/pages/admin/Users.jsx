import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSearch, HiPencil, HiChartBar, HiX,
  HiUser, HiShieldCheck, HiCreditCard, HiTrash, HiMail
} from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { adminAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active:    'bg-green-400/10 text-green-400 border-green-400/20',
  inactive:  'bg-white/[0.05] text-white/40 border-white/10',
  lapsed:    'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  cancelled: 'bg-coral/10 text-coral border-coral/20',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[status] || STATUS_COLORS.inactive}`}>
      {status || 'inactive'}
    </span>
  );
}

function Avatar({ name, email, size = 'md' }) {
  const letter = (name || email || 'U').charAt(0).toUpperCase();
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0`}>
      <span className="text-gold font-bold">{letter}</span>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]               = useState([]);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [editUser, setEditUser]         = useState(null);
  const [scoresModal, setScoresModal]   = useState(null);
  const [userScores, setUserScores]     = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [editScore, setEditScore]       = useState(null);
  const [editScoreForm, setEditScoreForm] = useState({ score: '', played_date: '' });
  const [editForm, setEditForm]         = useState({});
  const [saving, setSaving]             = useState(false);

  const fetchUsers = async (q = '') => {
    try {
      setLoading(true);
      const { data } = await adminAPI.users(q ? { q } : {});
      setUsers(data.data || []);
      setTotal(data.total || data.count || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      subscription_status: user.subscription_status || 'inactive',
      subscription_plan:   user.subscription_plan   || '',
      role:                user.role                 || 'user',
    });
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      setSaving(true);
      await adminAPI.updateUser(editUser.id, editForm);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers(search);
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const openScores = async (user) => {
    setScoresModal(user);
    setScoresLoading(true);
    try {
      const { data } = await adminAPI.userScores(user.id);
      setUserScores(data.data || []);
    } catch {
      toast.error('Failed to load scores');
    } finally {
      setScoresLoading(false);
    }
  };

  const handleSaveScore = async () => {
    if (!editScore || !scoresModal) return;
    try {
      await adminAPI.updateUserScore(scoresModal.id, editScore.id, {
        score: parseInt(editScoreForm.score),
        played_date: editScoreForm.played_date,
      });
      toast.success('Score updated');
      setEditScore(null);
      const { data } = await adminAPI.userScores(scoresModal.id);
      setUserScores(data.data || []);
    } catch {
      toast.error('Failed to update score');
    }
  };

  const handleDeleteScore = async (scoreId) => {
    if (!scoresModal || !confirm('Delete this score?')) return;
    try {
      await adminAPI.deleteUserScore(scoresModal.id, scoreId);
      toast.success('Score deleted');
      const { data } = await adminAPI.userScores(scoresModal.id);
      setUserScores(data.data || []);
    } catch {
      toast.error('Failed to delete score');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-white/30 text-sm mb-1">Admin Panel</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">User Management</h1>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-white/40 text-xs uppercase tracking-wider">Total Users </span>
          <span className="text-white font-black text-lg ml-1">{total}</span>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative max-w-md">
        <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            <HiX className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Users grid */}
      {loading && users.length === 0 ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={user.full_name} email={user.email} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user.full_name || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <HiMail className="w-3 h-3 text-white/25 flex-shrink-0" />
                      <p className="text-white/35 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <StatusPill status={user.subscription_status} />
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Plan</p>
                    <p className="text-white/70 text-xs font-semibold capitalize">{user.subscription_plan || '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Charity</p>
                    <p className="text-white/70 text-xs font-semibold truncate">{user.charities?.name || '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Role</p>
                    <p className={`text-xs font-semibold capitalize ${user.role === 'admin' ? 'text-gold' : 'text-white/70'}`}>
                      {user.role || 'user'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Joined</p>
                    <p className="text-white/70 text-xs font-semibold">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {/* Actions — always visible */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-gold/10 text-white/40 hover:text-gold text-xs font-semibold transition-colors border border-white/[0.06] hover:border-gold/20"
                  >
                    <HiPencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => openScores(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-blue-400/10 text-white/40 hover:text-blue-400 text-xs font-semibold transition-colors border border-white/[0.06] hover:border-blue-400/20"
                  >
                    <HiChartBar className="w-3.5 h-3.5" /> Scores
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && users.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed">
          <HiUser className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm">{search ? `No users matching "${search}"` : 'No users yet'}</p>
        </motion.div>
      )}

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Avatar name={editUser.full_name} email={editUser.email} size="lg" />
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{editUser.full_name || 'Unknown'}</p>
                <p className="text-white/30 text-sm truncate">{editUser.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <Select label="Subscription Status" labelIcon={<HiShieldCheck className="w-3.5 h-3.5" />}
                value={editForm.subscription_status}
                onChange={(v) => setEditForm({ ...editForm, subscription_status: v })}
                options={[
                  { value: 'active',    label: 'Active' },
                  { value: 'inactive',  label: 'Inactive' },
                  { value: 'lapsed',    label: 'Lapsed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <Select label="Plan" labelIcon={<HiCreditCard className="w-3.5 h-3.5" />}
                value={editForm.subscription_plan}
                onChange={(v) => setEditForm({ ...editForm, subscription_plan: v })}
                options={[
                  { value: '',        label: 'None' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly',  label: 'Yearly' },
                ]}
              />
              <Select label="Role" labelIcon={<HiUser className="w-3.5 h-3.5" />}
                value={editForm.role}
                onChange={(v) => setEditForm({ ...editForm, role: v })}
                options={[
                  { value: 'user',  label: 'User' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
            <button onClick={handleUpdateUser} disabled={saving}
              className="w-full py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </Modal>

      {/* User Scores Modal */}
      <Modal isOpen={!!scoresModal} onClose={() => { setScoresModal(null); setEditScore(null); }}
        title={`Scores — ${scoresModal?.full_name || scoresModal?.email || 'User'}`}>
        {scoresLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-2">
            {userScores.length === 0 && (
              <div className="text-center py-10">
                <HiChartBar className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/20 text-sm">No scores recorded</p>
              </div>
            )}
            {userScores.map((score, i) => (
              <motion.div key={score.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                {editScore?.id === score.id ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input type="number" min="1" max="45"
                      value={editScoreForm.score}
                      onChange={(e) => setEditScoreForm({ ...editScoreForm, score: e.target.value })}
                      className="w-20 px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold/40"
                    />
                    <input type="date"
                      value={editScoreForm.played_date}
                      onChange={(e) => setEditScoreForm({ ...editScoreForm, played_date: e.target.value })}
                      className="px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold/40"
                    />
                    <button onClick={handleSaveScore} className="text-green-400 hover:text-green-300 text-xs font-semibold px-2 py-1 rounded-lg bg-green-400/10">Save</button>
                    <button onClick={() => setEditScore(null)} className="text-white/30 hover:text-white text-xs px-2 py-1">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <span className="text-gold font-black text-sm">{score.score}</span>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-medium">Stableford Score</p>
                        <p className="text-white/30 text-xs">{formatDate(score.played_date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditScore(score); setEditScoreForm({ score: score.score, played_date: score.played_date }); }}
                        className="p-2 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-gold transition-colors">
                        <HiPencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteScore(score.id)}
                        className="p-2 rounded-lg hover:bg-coral/10 text-white/25 hover:text-coral transition-colors">
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

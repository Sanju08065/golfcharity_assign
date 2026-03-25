import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus, HiPencil, HiTrash, HiStar, HiHeart,
  HiPhotograph, HiGlobe, HiUsers
} from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { charitiesAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80';

function CharityCard({ charity, onEdit, onDelete, onToggleFeatured }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 overflow-hidden transition-colors"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={charity.image_url || FALLBACK_IMG}
          alt={charity.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = FALLBACK_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/20 to-transparent" />

        {/* Featured badge */}
        {charity.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/20 border border-gold/30 backdrop-blur-sm">
            <HiStar className="w-3 h-3 text-gold" />
            <span className="text-gold text-xs font-semibold">Featured</span>
          </div>
        )}

        {/* Action buttons — appear on hover */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleFeatured(charity)}
            className={`p-1.5 rounded-lg backdrop-blur-sm border transition-colors ${
              charity.is_featured
                ? 'bg-gold/20 border-gold/30 text-gold'
                : 'bg-black/40 border-white/10 text-white/50 hover:text-gold'
            }`}
            title={charity.is_featured ? 'Unfeature' : 'Feature'}
          >
            <HiStar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(charity)}
            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white/50 hover:text-gold backdrop-blur-sm transition-colors"
            title="Edit"
          >
            <HiPencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(charity.id)}
            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-white/50 hover:text-coral backdrop-blur-sm transition-colors"
            title="Delete"
          >
            <HiTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-sm mb-1.5">{charity.name}</h3>
        <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{charity.description}</p>
        {charity.subscriber_count !== undefined && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.05]">
            <HiUsers className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/25 text-xs">{charity.subscriber_count || 0} supporters</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CharityManagement() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | 'add' | charity object
  const [form, setForm]           = useState({ name: '', description: '', image_url: '', is_featured: false });
  const [saving, setSaving]       = useState(false);

  const fetchCharities = async () => {
    try {
      const { data } = await charitiesAPI.list();
      setCharities(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, []);

  const openAdd = () => {
    setForm({ name: '', description: '', image_url: '', is_featured: false });
    setModal('add');
  };

  const openEdit = (charity) => {
    setForm({
      name:        charity.name,
      description: charity.description || '',
      image_url:   charity.image_url   || '',
      is_featured: charity.is_featured,
    });
    setModal(charity);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Name and description are required');
      return;
    }
    try {
      setSaving(true);
      if (modal === 'add') {
        await charitiesAPI.create(form);
        toast.success('Charity added');
      } else {
        await charitiesAPI.update(modal.id, form);
        toast.success('Charity updated');
      }
      setModal(null);
      fetchCharities();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this charity? This cannot be undone.')) return;
    try {
      await charitiesAPI.remove(id);
      toast.success('Charity deleted');
      fetchCharities();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleFeatured = async (charity) => {
    try {
      await charitiesAPI.update(charity.id, { is_featured: !charity.is_featured });
      fetchCharities();
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-white/30 text-sm mb-1">Admin Panel</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Charity Management</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
        >
          <HiPlus className="w-4 h-4" /> Add Charity
        </motion.button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-white/30 text-xs">Total </span>
          <span className="text-white font-bold text-sm">{charities.length}</span>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-gold/[0.05] border border-gold/[0.12]">
          <span className="text-white/30 text-xs">Featured </span>
          <span className="text-gold font-bold text-sm">{charities.filter(c => c.is_featured).length}</span>
        </div>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {charities.map((charity, i) => (
            <motion.div key={charity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CharityCard
                charity={charity}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleFeatured={toggleFeatured}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {charities.length === 0 && (
        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <HiHeart className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-sm">No charities yet. Add one to get started.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add Charity' : 'Edit Charity'}
      >
        <div className="space-y-4">
          {/* Image preview */}
          {form.image_url && (
            <div className="relative h-32 rounded-xl overflow-hidden">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = FALLBACK_IMG; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/60 to-transparent" />
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-wider mb-2">
              <HiHeart className="w-3.5 h-3.5" /> Charity Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Children's Cancer Fund"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the charity's mission and impact..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-wider mb-2">
              <HiPhotograph className="w-3.5 h-3.5" /> Image URL
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-white/10 transition-colors">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${form.is_featured ? 'bg-gold' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="sr-only"
            />
            <div>
              <p className="text-white text-sm font-medium">Featured charity</p>
              <p className="text-white/30 text-xs">Shown prominently on the homepage</p>
            </div>
          </label>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : modal === 'add' ? 'Add Charity' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

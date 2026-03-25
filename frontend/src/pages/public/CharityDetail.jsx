import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiCalendar, HiHeart, HiArrowRight } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { charitiesAPI } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function CharityDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    charitiesAPI.get(id)
      .then(r => setCharity(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async () => {
    if (!user) return;
    try {
      setSelecting(true);
      await charitiesAPI.updateUserCharity({ charity_id: id });
      toast.success('Charity selected!');
    } catch {
      toast.error('Failed to select charity');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) return (
    <div className="bg-navy min-h-screen py-24 flex justify-center"><LoadingSpinner /></div>
  );

  if (!charity) return (
    <div className="bg-navy min-h-screen py-24 text-center">
      <p className="text-white/40">Charity not found.</p>
      <Link to="/charities" className="text-gold text-sm mt-4 inline-block hover:text-gold/80">← Back to charities</Link>
    </div>
  );

  return (
    <div className="bg-navy min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/charities"
            className="inline-flex items-center gap-2 text-white/30 hover:text-gold text-sm transition-colors mb-8"
          >
            <HiArrowLeft className="w-4 h-4" /> Back to Charities
          </Link>
        </motion.div>

        {/* Hero image */}
        {charity.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8"
          >
            <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/80 via-transparent to-transparent" />
          </motion.div>
        )}

        {/* Title + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-start justify-between flex-wrap gap-4 mb-8"
        >
          <div>
            {charity.is_featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold mb-3">
                Featured Charity
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-white">{charity.name}</h1>
          </div>

          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSelect}
              disabled={selecting}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              <HiHeart className="w-4 h-4" />
              {selecting ? 'Selecting...' : 'Select This Charity'}
            </motion.button>
          ) : (
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
              >
                Sign Up to Support <HiArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-8"
        >
          <p className="text-white/60 leading-relaxed text-base">{charity.description}</p>
        </motion.div>

        {/* Events */}
        {charity.events && charity.events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-xl font-black text-white mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {charity.events.map((event, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <HiCalendar className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{event.name || event}</p>
                    {event.date && <p className="text-white/30 text-xs mt-0.5">{event.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

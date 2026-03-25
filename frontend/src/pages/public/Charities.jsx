import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiHeart, HiStar, HiArrowRight } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { charitiesAPI } from '../../api/endpoints';

const FALLBACK = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80';

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCharities = async (q = '') => {
    try {
      setLoading(true);
      const { data } = await charitiesAPI.list(q ? { q } : {});
      setCharities(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCharities(search);
  };

  return (
    <div className="bg-navy min-h-screen py-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 border border-coral/20 text-coral text-xs font-semibold uppercase tracking-widest mb-6">
            <HiHeart className="w-3.5 h-3.5" /> Our Charities
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Every subscription<br />supports a cause.
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-lg">
            Choose the charity you want to support. 10% of your subscription goes directly to them.
          </p>
        </motion.div>

        {/* Search */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="max-w-md mx-auto mb-14 flex gap-3"
        >
          <div className="relative flex-1">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charities..."
              className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-gold/10 border border-gold/20 rounded-xl text-gold text-sm font-semibold hover:bg-gold/15 transition-colors"
          >
            Search
          </button>
        </motion.form>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {charities.map((charity, i) => (
                <motion.div
                  key={charity.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/12 overflow-hidden transition-colors"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={charity.image_url || FALLBACK}
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = FALLBACK; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-transparent to-transparent" />
                    {charity.is_featured && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/20 border border-gold/30 backdrop-blur-sm">
                        <HiStar className="w-3 h-3 text-gold" />
                        <span className="text-gold text-xs font-semibold">Featured</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-white font-bold text-base mb-2">{charity.name}</h3>
                    <p className="text-white/35 text-sm leading-relaxed line-clamp-2 mb-5">{charity.description}</p>
                    <Link to={`/charities/${charity.id}`}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="flex items-center gap-2 text-gold text-sm font-semibold hover:text-gold/80 transition-colors"
                      >
                        Learn More <HiArrowRight className="w-4 h-4" />
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && charities.length === 0 && (
          <div className="text-center py-20">
            <HiHeart className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/20 text-sm">No charities found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

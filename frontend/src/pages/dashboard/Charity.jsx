import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiHeart, HiCheck, HiArrowRight, HiSave } from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { charitiesAPI } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Charity() {
  const { user, fetchProfile } = useAuthStore();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPct, setSavingPct] = useState(false);
  const [percentage, setPercentage] = useState(user?.profile?.charity_percentage || 10);
  const [savedPercentage, setSavedPercentage] = useState(user?.profile?.charity_percentage || 10);
  const [donateModal, setDonateModal] = useState(null);
  const [donateAmount, setDonateAmount] = useState('10');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    charitiesAPI.list()
      .then(r => setCharities(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = user?.profile;
  const currentCharity = charities.find(c => c.id === profile?.charity_id);
  const monthlyFee = profile?.subscription_plan === 'yearly' ? 7.99 : 9.99;
  const contribution = (monthlyFee * (percentage / 100)).toFixed(2);
  const isDirty = percentage !== savedPercentage;

  const handleSelect = async (charityId) => {
    try {
      setSaving(true);
      await charitiesAPI.updateUserCharity({ charity_id: charityId });
      await fetchProfile();
      toast.success('Charity updated!');
    } catch { toast.error('Failed to update charity'); }
    finally { setSaving(false); }
  };

  const handleSavePercentage = async () => {
    try {
      setSavingPct(true);
      await charitiesAPI.updateUserCharity({ charity_percentage: parseInt(percentage) });
      await fetchProfile();
      setSavedPercentage(percentage);
      toast.success('Contribution percentage saved!');
    } catch { toast.error('Failed to save percentage'); }
    finally { setSavingPct(false); }
  };

  const handleDonate = async () => {
    const amount = parseFloat(donateAmount);
    if (!donateModal || isNaN(amount) || amount < 1) { toast.error('Minimum donation is £1'); return; }
    try {
      setDonating(true);
      const { data } = await charitiesAPI.donate({ charity_id: donateModal.id, amount: parseFloat(donateAmount) });
      if (data.data?.url) window.location.href = data.data.url;
    } catch (err) { toast.error(err.response?.data?.error || 'Donation failed'); }
    finally { setDonating(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Charity</h1>
      </motion.div>

      {/* Current charity hero */}
      {currentCharity ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative rounded-2xl overflow-hidden border border-gold/15">
          <div className="absolute inset-0">
            <img src={currentCharity.image_url} alt="" className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
          </div>
          <div className="relative p-6 sm:p-8 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold uppercase tracking-widest mb-3">
                <HiHeart className="w-3.5 h-3.5" /> Currently Supporting
              </span>
              <h2 className="text-white font-black text-2xl mb-2">{currentCharity.name}</h2>
              <p className="text-white/40 text-sm max-w-md">{currentCharity.description?.slice(0, 100)}...</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-gold text-sm font-bold">{percentage}%</span>
                </div>
                <span className="text-white/30 text-xs">= £{contribution}/mo to charity</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setDonateModal(currentCharity)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-navy font-bold text-sm rounded-xl hover:bg-gold-light transition-colors flex-shrink-0"
            >
              <HiHeart className="w-4 h-4" /> Donate Extra
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-6 rounded-2xl bg-gold/[0.04] border border-gold/15 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
            <HiHeart className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">No charity selected yet</p>
            <p className="text-white/40 text-xs">Choose one below — {savedPercentage}% of your subscription goes directly to them</p>
          </div>
        </motion.div>
      )}

      {/* Contribution slider */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Contribution Percentage</h3>
            <p className="text-white/30 text-xs mt-0.5">How much of your subscription goes to charity</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-gold">{percentage}%</span>
            <p className="text-white/30 text-xs">£{contribution}/mo</p>
          </div>
        </div>

        {/* Custom styled range */}
        <div className="relative py-2">
          <input
            type="range" min="10" max="100" value={percentage}
            onChange={e => setPercentage(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((percentage - 10) / 90) * 100}%, rgba(255,255,255,0.06) ${((percentage - 10) / 90) * 100}%, rgba(255,255,255,0.06) 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/20 mt-1 mb-4">
          <span>10% min</span>
          <span>100% max</span>
        </div>

        {/* Save button — only shown when value has changed */}
        <motion.button
          whileHover={{ scale: isDirty ? 1.02 : 1 }}
          whileTap={{ scale: isDirty ? 0.98 : 1 }}
          onClick={handleSavePercentage}
          disabled={!isDirty || savingPct}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            isDirty
              ? 'bg-gold text-navy hover:bg-gold-light shadow-lg shadow-gold/20 cursor-pointer'
              : 'bg-white/[0.04] border border-white/[0.06] text-white/20 cursor-not-allowed'
          }`}
        >
          {savingPct ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : <HiSave className="w-4 h-4" />}
          {savingPct ? 'Saving...' : isDirty ? `Save — ${percentage}% (£${contribution}/mo)` : 'Saved'}
        </motion.button>
      </motion.div>

      {/* Charity grid */}
      <div>
        <h3 className="text-white font-bold mb-4">Browse Charities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {charities.map((charity, i) => {
            const isSelected = charity.id === profile?.charity_id;
            return (
              <motion.div key={charity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative p-4 rounded-2xl border transition-all group ${
                  isSelected
                    ? 'bg-gold/[0.05] border-gold/25'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.04]">
                    {charity.image_url
                      ? <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><HiHeart className="w-6 h-6 text-white/20" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-semibold text-sm truncate">{charity.name}</p>
                      {isSelected && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold flex-shrink-0">
                          <HiCheck className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-white/30 text-xs line-clamp-2">{charity.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {!isSelected && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(charity.id)}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs font-semibold hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
                    >
                      Select <HiArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setDonateModal(charity)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'flex-1 bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15'
                        : 'px-4 bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-coral hover:border-coral/20'
                    }`}
                  >
                    <HiHeart className="w-3.5 h-3.5" />
                    {isSelected ? 'Donate' : ''}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Donate modal */}
      <Modal isOpen={!!donateModal} onClose={() => setDonateModal(null)} title={`Donate to ${donateModal?.name || ''}`}>
        <p className="text-white/40 text-sm mb-5">Make a one-off donation directly to this charity, separate from your subscription.</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[5, 10, 25, 50].map(amt => (
            <button key={amt} onClick={() => setDonateAmount(String(amt))}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                donateAmount === String(amt)
                  ? 'bg-gold text-navy shadow-lg shadow-gold/20'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:border-white/15'
              }`}>
              £{amt}
            </button>
          ))}
        </div>
        <input
          type="number" min="1" step="0.01" value={donateAmount}
          onChange={e => setDonateAmount(e.target.value)}
          placeholder="Custom amount"
          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 text-sm mb-4"
        />
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleDonate} disabled={donating}
          className="w-full py-3.5 rounded-xl bg-gold text-navy font-black text-sm hover:bg-gold-light transition-colors disabled:opacity-40"
        >
          {donating ? 'Processing...' : `Donate £${donateAmount || '0'}`}
        </motion.button>
      </Modal>
    </div>
  );
}

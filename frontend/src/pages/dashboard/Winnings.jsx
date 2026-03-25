import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  HiUpload, HiCurrencyPound, HiCheckCircle, HiClock,
  HiXCircle, HiShieldCheck, HiDocumentText, HiX
} from 'react-icons/hi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, getMatchLabel } from '../../utils/helpers';
import { winnersAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

// ─── Status pipeline ───────────────────────────────────────────
// pending (no proof) → submitted (proof uploaded, awaiting admin) → approved → paid
// rejected is a dead-end with reason shown

const STEPS = [
  { key: 'upload',   label: 'Upload Proof' },
  { key: 'review',   label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid',     label: 'Paid' },
];

function getStepIndex(win) {
  if (win.payment_status === 'paid')              return 3;
  if (win.verification_status === 'approved')     return 2;
  if (win.verification_status === 'submitted')    return 1;
  return 0; // pending — needs proof upload
}

function StatusStepper({ win }) {
  const current = getStepIndex(win);
  const rejected = win.verification_status === 'rejected';

  if (rejected) {
    return (
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
        <div className="w-6 h-6 rounded-full bg-coral/15 border border-coral/30 flex items-center justify-center flex-shrink-0">
          <HiXCircle className="w-3.5 h-3.5 text-coral" />
        </div>
        <span className="text-coral text-xs font-semibold">Verification Rejected</span>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.05]">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done    = i < current;
          const active  = i === current;
          const future  = i > current;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  done   ? 'bg-gold border-gold' :
                  active ? 'bg-gold/15 border-gold' :
                           'bg-white/[0.04] border-white/[0.1]'
                }`}>
                  {done
                    ? <HiCheckCircle className="w-3.5 h-3.5 text-navy" />
                    : active
                    ? <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  }
                </div>
                <span className={`text-[9px] font-semibold whitespace-nowrap ${
                  done ? 'text-gold/70' : active ? 'text-gold' : 'text-white/20'
                }`}>{step.label}</span>
              </div>
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1 mb-4 transition-all ${done ? 'bg-gold/40' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusMessage({ win, onUpload }) {
  const vs = win.verification_status;
  const ps = win.payment_status;

  if (ps === 'paid') return (
    <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-gold/[0.07] border border-gold/15">
      <HiCheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
      <p className="text-gold/80 text-xs font-medium">Prize paid out — congratulations!</p>
    </div>
  );

  if (vs === 'approved') return (
    <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-green-400/[0.07] border border-green-400/15">
      <HiShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
      <p className="text-green-400/80 text-xs font-medium">Verified! Payment is being processed.</p>
    </div>
  );

  if (vs === 'submitted') return (
    <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-blue-400/[0.07] border border-blue-400/15">
      <HiClock className="w-4 h-4 text-blue-400 flex-shrink-0 animate-pulse" />
      <p className="text-blue-400/80 text-xs font-medium">Proof submitted — admin is reviewing your scorecard.</p>
    </div>
  );

  if (vs === 'rejected') return (
    <div className="mt-3 px-3 py-2.5 rounded-xl bg-coral/[0.07] border border-coral/15">
      <div className="flex items-center gap-2 mb-1">
        <HiXCircle className="w-4 h-4 text-coral flex-shrink-0" />
        <p className="text-coral text-xs font-semibold">Verification rejected</p>
      </div>
      {win.rejection_reason && (
        <p className="text-coral/60 text-xs ml-6">{win.rejection_reason}</p>
      )}
      <button
        onClick={() => onUpload(win)}
        className="ml-6 mt-2 text-xs text-gold/70 hover:text-gold underline underline-offset-2 transition-colors"
      >
        Re-upload proof →
      </button>
    </div>
  );

  // pending — needs upload
  return (
    <div className="flex items-center justify-between gap-3 mt-3 px-3 py-2.5 rounded-xl bg-yellow-400/[0.06] border border-yellow-400/15">
      <div className="flex items-center gap-2.5">
        <HiDocumentText className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <p className="text-yellow-400/80 text-xs font-medium">Upload your scorecard to claim this prize.</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => onUpload(win)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-black rounded-lg shadow-md shadow-gold/20 hover:bg-gold/90 transition-colors flex-shrink-0"
      >
        <HiUpload className="w-3 h-3" /> Upload
      </motion.button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function Winnings() {
  const [winnings, setWinnings]       = useState([]);
  const [totalWon, setTotalWon]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [uploadModal, setUploadModal] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);

  const fetchWinnings = async () => {
    try {
      const { data } = await winnersAPI.my();
      setWinnings(data.data || []);
      setTotalWon(data.total_won || 0);
    } catch (err) { toast.error('Failed to load winnings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWinnings(); }, []);

  // Revoke preview URL on cleanup
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const onDrop = useCallback((files) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPreview(URL.createObjectURL(files[0]));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const openUpload = (win) => {
    setUploadModal(win);
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!file || !uploadModal) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('proof', file);
      fd.append('winner_id', uploadModal.id);
      await winnersAPI.uploadProof(fd);
      toast.success('Proof uploaded — admin will review shortly');
      setUploadModal(null);
      setFile(null);
      setPreview(null);
      fetchWinnings();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const paidCount    = winnings.filter(w => w.payment_status === 'paid').length;
  const pendingCount = winnings.filter(w => w.payment_status !== 'paid').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm mb-1">Dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Winnings</h1>
      </motion.div>

      {/* Hero total */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative p-8 rounded-2xl overflow-hidden border border-gold/15"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(212,175,55,0.1) 0%, rgba(13,27,42,0.6) 60%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Prize Money</p>
            <p className="text-5xl font-black text-gold">{formatCurrency(totalWon)}</p>
            <p className="text-white/30 text-sm mt-2">
              {winnings.length} win{winnings.length !== 1 ? 's' : ''} · {paidCount} paid out
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <HiCurrencyPound className="w-8 h-8 text-gold" />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {winnings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Wins',  value: winnings.length },
            { label: 'Paid Out',    value: paidCount },
            { label: 'In Progress', value: pendingCount },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Winnings list */}
      <div className="space-y-3">
        <AnimatePresence>
          {winnings.map((win, i) => {
            const month = (win.draws?.month != null)
              ? new Date(0, win.draws.month - 1).toLocaleString('en', { month: 'long' })
              : '';
            const year  = win.draws?.year || '';
            return (
              <motion.div key={win.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.09] transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg ${
                      win.match_type === 5 ? 'bg-gold/15 text-gold border border-gold/20' :
                      win.match_type === 4 ? 'bg-blue-400/10 text-blue-400 border border-blue-400/15' :
                      'bg-white/[0.06] text-white/50 border border-white/[0.08]'
                    }`}>
                      {win.match_type}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{getMatchLabel(win.match_type)}</p>
                      <p className="text-white/30 text-xs">{month} {year}</p>
                      <p className={`text-xl font-black mt-0.5 ${win.match_type === 5 ? 'text-gold' : 'text-white'}`}>
                        {formatCurrency(win.prize_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Payment badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    win.payment_status === 'paid'
                      ? 'bg-gold/10 text-gold border-gold/20'
                      : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                  }`}>
                    {win.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                  </div>
                </div>

                {/* Status message + CTA */}
                <StatusMessage win={win} onUpload={openUpload} />

                {/* Progress stepper */}
                <StatusStepper win={win} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {winnings.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <HiCurrencyPound className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 font-medium mb-1">No winnings yet</p>
            <p className="text-white/20 text-sm">Keep logging scores — your first win could be this month</p>
          </motion.div>
        )}
      </div>

      {/* Upload proof modal */}
      <Modal
        isOpen={!!uploadModal}
        onClose={() => { setUploadModal(null); setFile(null); setPreview(null); }}
        title="Upload Proof of Play"
      >
        <p className="text-white/40 text-sm mb-5">
          Upload a clear photo or screenshot of your scorecard. Admin will verify and approve your prize.
        </p>

        {/* Win summary */}
        {uploadModal && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
              uploadModal.match_type === 5 ? 'bg-gold/15 text-gold' : 'bg-blue-400/10 text-blue-400'
            }`}>
              {uploadModal.match_type}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{getMatchLabel(uploadModal.match_type)}</p>
              <p className="text-gold text-sm font-black">{formatCurrency(uploadModal.prize_amount)}</p>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-white/[0.08] hover:border-gold/40 hover:bg-white/[0.02]'
          }`}
        >
          <input {...getInputProps()} />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                <p className="text-white text-xs font-semibold">Click to change</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <HiX className="w-3.5 h-3.5" />
              </button>
              <div className="px-4 py-2.5 flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                <div>
                  <p className="text-white text-xs font-medium">{file.name}</p>
                  <p className="text-white/30 text-[10px]">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <HiUpload className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-white/50 text-sm font-medium">
                {isDragActive ? 'Drop it here' : 'Drop your scorecard or click to browse'}
              </p>
              <p className="text-white/20 text-xs mt-1">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-3 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {uploading ? 'Uploading...' : 'Submit Proof'}
          </motion.button>
          <button
            onClick={() => { setUploadModal(null); setFile(null); setPreview(null); }}
            className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

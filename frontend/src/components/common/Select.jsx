import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck, HiChevronDown } from 'react-icons/hi';

/**
 * Custom styled Select component — matches the dark glassmorphism design system.
 *
 * Props:
 *   value        — current selected value
 *   onChange     — (value) => void
 *   options      — [{ value, label, color? }]
 *   label        — optional label text
 *   labelIcon    — optional React element shown before label
 *   placeholder  — shown when no value selected
 *   className    — extra classes on the wrapper
 */
export default function Select({
  value,
  onChange,
  options = [],
  label,
  labelIcon,
  placeholder = 'Select...',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-wider mb-2">
          {labelIcon}
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left
          ${open
            ? 'bg-white/[0.06] border-gold/40 text-white'
            : 'bg-white/[0.03] border-white/[0.08] text-white hover:border-white/15 hover:bg-white/[0.05]'
          }`}
      >
        <span className={selected ? 'text-white' : 'text-white/25'}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <HiChevronDown className="w-4 h-4 text-white/30" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1.5 rounded-xl border border-white/[0.1] bg-[#0D1B2A]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors
                    ${isSelected
                      ? 'bg-gold/10 text-gold'
                      : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                    }
                    ${i < options.length - 1 ? 'border-b border-white/[0.04]' : ''}
                  `}
                >
                  <span className={opt.color || ''}>{opt.label}</span>
                  {isSelected && <HiCheck className="w-4 h-4 text-gold flex-shrink-0" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

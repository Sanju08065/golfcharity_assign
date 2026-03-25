import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCalendar, HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * DatePicker — custom calendar dropdown, dark-themed.
 *
 * Props:
 *   value       string  ISO date "YYYY-MM-DD"
 *   onChange    fn(isoString)
 *   placeholder string
 *   error       string
 *   maxDate     Date    (defaults to today)
 *   label       string
 */
export default function DatePicker({ value, onChange, placeholder = 'Select date', error, maxDate, label }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = maxDate || today;

  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = selected || today;
    return { month: d.getMonth(), year: d.getFullYear() };
  });
  const [mode, setMode] = useState('days'); // 'days' | 'months' | 'years'
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build calendar grid
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    setView(v => {
      if (v.month === 0) return { month: 11, year: v.year - 1 };
      return { month: v.month - 1, year: v.year };
    });
  };
  const nextMonth = () => {
    setView(v => {
      if (v.month === 11) return { month: 0, year: v.year + 1 };
      return { month: v.month + 1, year: v.year };
    });
  };

  const selectDay = (day) => {
    if (!day) return;
    const d = new Date(view.year, view.month, day);
    if (d > max) return;
    onChange(toISO(d));
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!selected || !day) return false;
    return selected.getFullYear() === view.year &&
           selected.getMonth() === view.month &&
           selected.getDate() === day;
  };

  const isToday = (day) => {
    if (!day) return false;
    const t = new Date();
    return t.getFullYear() === view.year && t.getMonth() === view.month && t.getDate() === day;
  };

  const isFuture = (day) => {
    if (!day) return false;
    return new Date(view.year, view.month, day) > max;
  };

  // Year range for year picker
  const yearStart = Math.floor(view.year / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  const canGoNext = new Date(view.year, view.month + 1, 1) <= max;

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setMode('days'); }}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-coral/60 focus:ring-coral/20'
            : open
            ? 'border-gold/50 ring-2 ring-gold/20'
            : 'border-white/[0.08] hover:border-white/[0.14]'
        }`}
      >
        <HiCalendar className={`w-4 h-4 flex-shrink-0 transition-colors ${value ? 'text-gold' : 'text-white/25'}`} />
        <span className={`flex-1 text-left ${value ? 'text-white' : 'text-white/25'}`}>
          {value ? formatDisplay(selected) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="text-white/20 hover:text-white/60 transition-colors p-0.5 rounded"
          >
            <HiX className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {error && <p className="mt-1 text-xs text-coral">{error}</p>}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 w-72 rounded-2xl border border-white/[0.1] bg-[#0D1B2A]/98 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{ left: 0 }}
          >
            {/* ── DAYS VIEW ── */}
            {mode === 'days' && (
              <div className="p-4">
                {/* Nav */}
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={prevMonth}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors">
                    <HiChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('months')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-white font-bold text-sm">{MONTHS[view.month]}</span>
                    <span className="text-white/40 text-sm">{view.year}</span>
                  </button>

                  <button type="button" onClick={nextMonth} disabled={!canGoNext}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-white/25 uppercase py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-1">
                  {cells.map((day, i) => {
                    const sel = isSelected(day);
                    const tod = isToday(day);
                    const fut = isFuture(day);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!day || fut}
                        onClick={() => selectDay(day)}
                        className={`
                          relative h-9 w-full rounded-lg text-sm font-medium transition-all
                          ${!day ? 'invisible' : ''}
                          ${fut ? 'text-white/15 cursor-not-allowed' : ''}
                          ${sel
                            ? 'bg-gold text-navy font-black shadow-lg shadow-gold/25'
                            : tod && !fut
                            ? 'text-gold border border-gold/30 hover:bg-gold/10'
                            : !fut
                            ? 'text-white/70 hover:bg-white/[0.07] hover:text-white'
                            : ''
                          }
                        `}
                      >
                        {day}
                        {tod && !sel && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Today shortcut */}
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setView({ month: today.getMonth(), year: today.getFullYear() });
                      onChange(toISO(today));
                      setOpen(false);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-gold/70 hover:text-gold hover:bg-gold/[0.06] transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}

            {/* ── MONTHS VIEW ── */}
            {mode === 'months' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setView(v => ({ ...v, year: v.year - 1 }))}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors">
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setMode('years')}
                    className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-white font-bold text-sm transition-colors">
                    {view.year}
                  </button>
                  <button type="button" onClick={() => setView(v => ({ ...v, year: v.year + 1 }))}
                    disabled={view.year >= today.getFullYear()}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20">
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, i) => {
                    const isCurrent = view.month === i && selected?.getFullYear() === view.year;
                    const isFutureMonth = view.year === today.getFullYear() && i > today.getMonth();
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={isFutureMonth}
                        onClick={() => { setView(v => ({ ...v, month: i })); setMode('days'); }}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isCurrent
                            ? 'bg-gold text-navy font-black'
                            : isFutureMonth
                            ? 'text-white/15 cursor-not-allowed'
                            : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── YEARS VIEW ── */}
            {mode === 'years' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setView(v => ({ ...v, year: v.year - 12 }))}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors">
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white/40 text-xs">{yearStart} – {yearStart + 11}</span>
                  <button type="button" onClick={() => setView(v => ({ ...v, year: v.year + 12 }))}
                    disabled={yearStart + 12 > today.getFullYear()}
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20">
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {years.map(y => {
                    const isSel = selected?.getFullYear() === y;
                    const isFutureYear = y > today.getFullYear();
                    return (
                      <button
                        key={y}
                        type="button"
                        disabled={isFutureYear}
                        onClick={() => { setView(v => ({ ...v, year: y })); setMode('months'); }}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isSel
                            ? 'bg-gold text-navy font-black'
                            : isFutureYear
                            ? 'text-white/15 cursor-not-allowed'
                            : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

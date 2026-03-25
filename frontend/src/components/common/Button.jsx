import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gold hover:bg-gold-light text-navy font-semibold',
  secondary: 'bg-transparent border-2 border-gold text-gold hover:bg-gold/10',
  danger: 'bg-coral hover:bg-coral-light text-white',
  ghost: 'bg-white/10 hover:bg-white/20 text-white',
};

export default function Button({ children, variant = 'primary', className = '', loading, disabled, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 
        ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  );
}

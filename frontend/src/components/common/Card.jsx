import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' } : {}}
      className={`bg-navy-light border border-white/10 rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

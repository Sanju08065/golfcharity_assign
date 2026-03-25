import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-navy-light border border-white/10 rounded-lg text-white 
          placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold 
          transition-colors ${error ? 'border-coral' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-coral">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

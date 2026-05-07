import React from 'react';

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  label,
  error,
  icon,
  required = false,
  disabled = false,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full glass glass-hover
            px-4 py-3 ${icon ? 'pl-11' : ''}
            text-slate-100 placeholder-slate-500
            border border-white/10 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default GlassInput;

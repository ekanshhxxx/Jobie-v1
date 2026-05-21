import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 rounded-lg';
  
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-500 
      hover:from-blue-500 hover:to-blue-400
      text-white shadow-lg shadow-blue-500/20
      hover:shadow-xl hover:shadow-blue-500/30
      active:scale-95
    `,
    secondary: `
      glass glass-hover
      text-slate-100 hover:text-white
      border border-white/10 hover:border-white/20
    `,
    ghost: `
      text-slate-300 hover:text-white
      hover:bg-white/5
      active:bg-white/10
    `,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-40 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${disabledClasses}
        ${className}
      `}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};

export default GlassButton;

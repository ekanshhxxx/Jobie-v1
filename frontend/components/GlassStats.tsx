import React from 'react';

interface GlassStatsProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const GlassStats: React.FC<GlassStatsProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`glass glass-hover p-6 rounded-xl transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-white mt-2">
            {value}
          </h3>
        </div>
        
        {icon && (
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
            {icon}
          </div>
        )}
      </div>
      
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-sm font-medium ${
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span className="text-sm text-slate-400">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default GlassStats;

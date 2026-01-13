
import React from 'react';

interface MiniatureCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string;
  loading?: boolean;
}

export const MiniatureCard: React.FC<MiniatureCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  colorClass = "bg-white",
  loading = false
}) => {
  return (
    <div className={`${colorClass} mini-card rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b-4 border-slate-200/50 relative overflow-hidden group transition-all duration-300`}>
      <div className="absolute top-4 right-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center relative">
          {/* Subtle background glow for the icon */}
          <div className="absolute inset-0 bg-current opacity-5 rounded-2xl"></div>
          <div className="relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
            {icon && React.cloneElement(icon as React.ReactElement, { size: 24 })}
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-md mb-2"></div>
        ) : (
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{value}</h3>
        )}
        {subtitle && <div className="text-slate-400 text-xs font-medium">{subtitle}</div>}
      </div>
    </div>
  );
};

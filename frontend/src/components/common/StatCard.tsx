import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  accentBorderColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-[#087FA5]/10',
  iconColor = 'text-[#087FA5]',
  accentBorderColor,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-subtle hover:shadow-card transition-all duration-200',
        onClick && 'cursor-pointer hover:border-[#087FA5]/40 active:scale-[0.99]',
        accentBorderColor && `border-l-4 ${accentBorderColor}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">
            {title}
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight mt-1 truncate">
            {value}
          </h4>
          {(subtitle || trend) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              {trend && (
                <span
                  className={cn(
                    'font-bold px-1.5 py-0.5 rounded text-[11px]',
                    trend.isPositive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  )}
                >
                  {trend.value}
                </span>
              )}
              {subtitle && <span className="text-[#64748B] text-xs truncate">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-2xl flex-shrink-0', iconBgColor)}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
};


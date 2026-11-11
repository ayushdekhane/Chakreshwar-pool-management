import React from 'react';
import { SessionStatus } from '../../types';
import { cn } from '../../utils';

interface SessionStatusBadgeProps {
  status: SessionStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({
  status,
  size = 'md',
  className,
}) => {
  const configs: Record<
    SessionStatus,
    { label: string; bg: string; text: string; dot: string; border: string }
  > = {
    active: {
      label: 'Active Swimming',
      bg: 'bg-[#087FA5]/10',
      text: 'text-[#087FA5]',
      dot: 'bg-[#087FA5]',
      border: 'border-[#087FA5]/25',
    },
    expiring: {
      label: 'Expiring Soon',
      bg: 'bg-[#ED6429]/10',
      text: 'text-[#ED6429]',
      dot: 'bg-[#ED6429]',
      border: 'border-[#ED6429]/30',
    },
    expired: {
      label: 'Expired (Overtime)',
      bg: 'bg-[#E12C3D]/10',
      text: 'text-[#E12C3D]',
      dot: 'bg-[#E12C3D]',
      border: 'border-[#E12C3D]/30',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-100',
      text: 'text-[#64748B]',
      dot: 'bg-slate-400',
      border: 'border-slate-300',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      dot: 'bg-rose-400',
      border: 'border-rose-200',
    },
  };

  const config = configs[status] || configs.active;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full border',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.dot,
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          status === 'expiring' && 'animate-ping',
          status === 'expired' && 'animate-pulse'
        )}
      />
      {config.label}
    </span>
  );
};


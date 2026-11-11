import React from 'react';
import { Clock, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { useSessionTimer } from '../../hooks/useTimer';
import { cn } from '../../utils';

interface TimerDisplayProps {
  scheduledExitTime: string;
  isCompleted?: boolean;
  actualExitTime?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  scheduledExitTime,
  isCompleted,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const { isExpired, isExpiringSoon, formattedRemaining, formattedOvertime } =
    useSessionTimer(scheduledExitTime, isCompleted);

  if (isCompleted) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-mono text-slate-500 font-semibold',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm',
          className
        )}
      >
        {showIcon && <CheckCircle className="w-3.5 h-3.5 text-slate-400" />}
        <span>00:00 (Finished)</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-mono font-bold text-[#E12C3D] bg-red-50/80 px-2 py-0.5 rounded-lg border border-red-200/80 animate-pulse',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm',
          className
        )}
      >
        {showIcon && <AlertOctagon className="w-4 h-4 text-[#E12C3D] flex-shrink-0" />}
        <span>{formattedOvertime} OT</span>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-mono font-bold text-[#ED6429] bg-amber-50/90 px-2 py-0.5 rounded-lg border border-amber-200',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm',
          className
        )}
      >
        {showIcon && <AlertTriangle className="w-4 h-4 text-[#ED6429] flex-shrink-0 animate-bounce" />}
        <span>{formattedRemaining} left</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-semibold text-[#087FA5] bg-[#087FA5]/10 px-2 py-0.5 rounded-lg border border-[#087FA5]/20',
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm',
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4 text-[#087FA5] flex-shrink-0" />}
      <span>{formattedRemaining}</span>
    </div>
  );
};


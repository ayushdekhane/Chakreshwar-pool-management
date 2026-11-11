import { useEffect, useState } from 'react';
import { usePoolStore } from '../store/usePoolStore';
import { calculateTimeRemaining, formatSecondsToHHMMSS } from '../utils';

/**
 * Hook to keep the global pool store ticking every second
 */
export function useGlobalTimer() {
  const tickTimer = usePoolStore((state) => state.tickTimer);
  const currentTime = usePoolStore((state) => state.currentTime);

  useEffect(() => {
    // Initial tick
    tickTimer();
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer]);

  return currentTime;
}

/**
 * Hook to get real-time countdown/overtime calculation for an active session
 */
export function useSessionTimer(scheduledExitTime: string, isCompletedOrCancelled?: boolean) {
  const currentTime = usePoolStore((state) => state.currentTime);
  const [timerState, setTimerState] = useState(() =>
    calculateTimeRemaining(scheduledExitTime)
  );

  useEffect(() => {
    if (isCompletedOrCancelled) return;
    setTimerState(calculateTimeRemaining(scheduledExitTime));
  }, [currentTime, scheduledExitTime, isCompletedOrCancelled]);

  return {
    ...timerState,
    formattedRemaining: formatSecondsToHHMMSS(timerState.remainingSeconds),
    formattedOvertime: `+${formatSecondsToHHMMSS(timerState.overtimeSeconds)}`,
  };
}


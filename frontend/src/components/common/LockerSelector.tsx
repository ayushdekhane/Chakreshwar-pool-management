import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Session, Settings } from '../../types';

interface LockerSelectorProps {
  sessions: Session[];
  settings: Settings;
  selectedLockers: number[];
  onChange: (lockers: number[]) => void;
  accentClassName?: string;
}

export const LockerSelector: React.FC<LockerSelectorProps> = ({
  sessions,
  settings,
  selectedLockers,
  onChange,
  accentClassName = 'text-[#087FA5]',
}) => {
  const lockerCount = Math.max(0, Math.floor(settings.lockerCount || 0));
  const occupiedLockers = new Set(
    sessions
      .filter((session) =>
        session.status === 'active' ||
        session.status === 'expiring' ||
        session.status === 'expired'
      )
      .flatMap((session) => session.lockerNumbers || [])
  );
  const toggleLocker = (lockerNumber: number) => {
    if (occupiedLockers.has(lockerNumber)) return;
    onChange(
      selectedLockers.includes(lockerNumber)
        ? selectedLockers.filter((number) => number !== lockerNumber)
        : [...selectedLockers, lockerNumber].sort((a, b) => a - b)
    );
  };

  if (lockerCount === 0) {
    return (
      <p className="text-xs text-slate-500">
        No lockers configured. Add the available locker count in Settings.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-slate-100/70 p-2 max-h-[28vh] sm:max-h-64 md:max-h-80 lg:max-h-96"
        aria-label="Locker availability"
      >
        {Array.from({ length: lockerCount }, (_, index) => index + 1).map((lockerNumber) => {
          const isOccupied = occupiedLockers.has(lockerNumber);
          const isSelected = selectedLockers.includes(lockerNumber);
          return (
            <button
              key={lockerNumber}
              type="button"
              disabled={isOccupied}
              onClick={() => toggleLocker(lockerNumber)}
              className={`relative min-h-14 aspect-[1.35] rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-sm font-bold transition-colors ${
                isOccupied
                  ? 'border-slate-300 bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isSelected
                    ? `border-current bg-sky-50 ${accentClassName} ring-2 ring-current/20`
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
              aria-label={`Locker ${lockerNumber}${isOccupied ? ', occupied' : isSelected ? ', selected' : ', available'}`}
            >
              {isOccupied ? (
                <Lock className="absolute right-1.5 top-1.5 w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>{lockerNumber}</span>
            </button>
          );
        })}
      </div>
      <p className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>Select any number of available lockers.</span>
        <span className="shrink-0 font-semibold text-slate-700">
          {selectedLockers.length} selected
        </span>
      </p>
    </div>
  );
};

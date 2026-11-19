import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatTime, formatCurrency } from '../../utils';

export const ExtendSessionModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const settings = usePoolStore((state) => state.settings);
  const extendSession = usePoolStore((state) => state.extendSession);

  const session = sessions.find((s) => s.id === selectedSessionId);

  const [minutesToAdd, setMinutesToAdd] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [extensionFee, setExtensionFee] = useState<number>(50);
  const [customFee, setCustomFee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!session) return null;

  // Rate calculation
  const calculateRateForMinutes = (mins: number) => {
    return 0;
  };

  const handleSelectMinutes = (mins: number) => {
    setMinutesToAdd(mins);
    setCustomMinutes('');
    const fee = calculateRateForMinutes(mins);
    setExtensionFee(fee);
    setCustomFee('');
  };

  const currentExit = new Date(session.scheduledExitTime);
  const now = new Date();
  const baseTime = currentExit.getTime() < now.getTime() ? now.getTime() : currentExit.getTime();
  const activeMinutes = customMinutes ? parseInt(customMinutes, 10) || 0 : minutesToAdd;
  const activeFee = customFee ? parseInt(customFee, 10) || 0 : extensionFee;
  const newExitTime = new Date(baseTime + activeMinutes * 60000);

  const updatedTotalCharges = session.totalCharges + activeFee;
  const updatedOutstanding = Math.max(0, updatedTotalCharges - session.paidAmount);

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMinutes <= 0) {
      toast.error('Please enter valid extension minutes.');
      return;
    }

    try {
      await extendSession(session.id, activeMinutes, activeFee, notes);
      toast.success(`Session extended by ${activeMinutes} minutes!`, {
        description: `New exit time: ${formatTime(newExitTime)}. Fee: ${formatCurrency(activeFee)}.`,
      });
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to extend session.');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'extend_session'}
      onClose={closeModal}
      title="Extend Swimming Session"
      subtitle={`Customer: ${session.customerName} (${session.id})`}
      maxWidth="lg"
    >
      <form onSubmit={handleConfirmExtend} className="space-y-4">
        {/* Quick extension duration buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Additional Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectMinutes(mins)}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  !customMinutes && minutesToAdd === mins
                    ? 'bg-[#087FA5] text-white border-[#087FA5] shadow-md shadow-[#087FA5]/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                +{mins} Mins
              </button>
            ))}
          </div>
        </div>

        {/* Custom duration or fee input */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Custom Duration (Mins)
            </label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={customMinutes}
              onChange={(e) => {
                setCustomMinutes(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (val > 0) {
                  setExtensionFee(calculateRateForMinutes(val));
                }
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Extension Fee (₹)
            </label>
            <input
              type="number"
              value={customFee !== '' ? customFee : extensionFee}
              onChange={(e) => setCustomFee(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-[#087FA5]"
            />
          </div>
        </div>

        {/* Real-time schedule comparison card */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="text-slate-500 block text-[11px]">Current Exit Time</span>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {formatTime(session.scheduledExitTime)}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-[#087FA5]" />

            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Updated Exit Time</span>
              <span className="font-extrabold text-[#087FA5] font-mono text-sm">
                {formatTime(newExitTime)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Additional Minutes:</span>
            <span className="font-bold text-slate-800">+{activeMinutes} Minutes</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Extension Fee:</span>
            <span className="font-bold text-[#087FA5]">{formatCurrency(activeFee)}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200">
            <span className="text-slate-800">New Total Bill:</span>
            <span className="text-slate-900">{formatCurrency(updatedTotalCharges)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Updated Outstanding:</span>
            <span className="font-extrabold text-[#E12C3D]">
              {formatCurrency(updatedOutstanding)}
            </span>
          </div>
        </div>

        {/* Reason / Desk notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Desk Notes / Reason (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Requested extra 30 mins for lap practice"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md shadow-[#087FA5]/25 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm Extension (+{activeMinutes}m)</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

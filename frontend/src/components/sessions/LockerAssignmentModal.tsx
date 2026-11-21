import React, { useEffect, useState } from 'react';
import { LockKeyhole, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { LockerSelector } from '../common/LockerSelector';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';

export const LockerAssignmentModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const packages = usePoolStore((state) => state.packages);
  const settings = usePoolStore((state) => state.settings);
  const updateSessionLockers = usePoolStore((state) => state.updateSessionLockers);
  const [selectedLockers, setSelectedLockers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const session = sessions.find((item) => item.id === selectedSessionId);
  const pkg = packages.find((item) => item.id === session?.packageId);
  const lockerPrice = pkg?.lockerPrice ?? 0;
  const existingLockers = session?.lockerNumbers || [];
  const newLockerCount = selectedLockers.filter(
    (lockerNumber) => !existingLockers.includes(lockerNumber)
  ).length;
  const additionalLockerCharge = newLockerCount * lockerPrice;
  const lockerCharge = (session?.lockerCharges || 0) + additionalLockerCharge;

  useEffect(() => {
    if (activeModal === 'rent_locker') {
      setSelectedLockers(session?.lockerNumbers || []);
    }
  }, [activeModal, selectedSessionId]);

  if (!session) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSessionLockers(session.id, selectedLockers);
      toast.success(
        selectedLockers.length
          ? `${selectedLockers.length} locker(s) assigned. Locker charge: ${formatCurrency(lockerCharge)}`
          : 'Locker assignment removed.'
      );
      closeModal();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update locker assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'rent_locker'}
      onClose={closeModal}
      title={
        <span className="flex items-center gap-2">
          <LockKeyhole className="w-5 h-5 text-[#087FA5]" />
          Add / Change Locker
        </span>
      }
      subtitle={`${session.customerName} · ${pkg?.name || session.packageName}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700">Locker price</p>
            <p className="text-[11px] text-slate-500">Based on this customer's package</p>
          </div>
          <p className="font-extrabold text-[#087FA5]">
            {formatCurrency(lockerPrice)} / locker
          </p>
        </div>

        <LockerSelector
          sessions={sessions}
          settings={settings}
          selectedLockers={selectedLockers}
          onChange={setSelectedLockers}
          currentSessionId={session.id}
          lockedLockerNumbers={existingLockers}
        />

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-700">
            Locker Total:
            <span className="ml-2 text-[#087FA5]">{formatCurrency(lockerCharge)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Locker'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

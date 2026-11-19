import React, { useState } from 'react';
import { toast } from 'sonner';
import { Shirt, PlusCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';

export const RentEquipmentModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const equipment = usePoolStore((state) =>
    state.equipment.filter((item) => item.equipmentType === 'rental')
  );
  const issueRental = usePoolStore((state) => state.issueRental);

  const [sessionId, setSessionId] = useState<string>(selectedSessionId || '');
  const [guestName, setGuestName] = useState<string>('');
  const [equipmentId, setEquipmentId] = useState<string>(equipment[0]?.id || '');
  const [size, setSize] = useState<string | undefined>(equipment[0]?.sizes[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const selectedEq = equipment.find((e) => e.id === equipmentId) || equipment[0];
  const activeSession = sessions.find((s) => s.id === sessionId);

  const pricePerItem = customPrice !== '' ? parseFloat(customPrice) || 0 : selectedEq?.defaultRate || 50;
  const totalRental = pricePerItem * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) {
      toast.error('Add equipment to inventory before issuing a rental.');
      return;
    }
    if (!sessionId && !guestName.trim()) {
      toast.error('Please assign rental to an active session or enter guest name.');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be at least 1.');
      return;
    }

    const assignedName = activeSession ? activeSession.customerName : guestName;

    try {
      const rnt = await issueRental({
        sessionId: activeSession?.id,
        customerId: activeSession?.customerId,
        customerName: assignedName,
        equipmentId: selectedEq.id,
        size,
        quantity,
        pricePerItem,
        notes,
      });

      toast.success(`Issued ${quantity}x ${selectedEq.name} to ${assignedName}!`, {
        description: `Rental ID: ${rnt.id}. Rental charge: ${formatCurrency(totalRental)}.`,
      });
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to issue rental.');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'rent_equipment'}
      onClose={closeModal}
      title="Issue Equipment Rental"
      subtitle="Rent costumes, goggles, towels and floats to pool guests"
      maxWidth="lg"
    >
      {selectedEq ? (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest or Session Target */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Attach to Active Session
          </label>
          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              if (e.target.value) setGuestName('');
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="">-- Standalone Rental (No Active Session) --</option>
            {sessions
              .filter((s) => s.status !== 'completed' && s.status !== 'cancelled')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.customerName} (#{s.id}) - {s.type === 'group' ? s.groupName : 'Individual'}
                </option>
              ))}
          </select>

          {!sessionId && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Guest Name (Standalone Rental) *
              </label>
              <input
                type="text"
                placeholder="e.g. Sneha Rao"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          )}
        </div>

        {/* Equipment Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Equipment Item *
            </label>
            <select
              value={equipmentId}
              onChange={(e) => {
                setEquipmentId(e.target.value);
                const eq = equipment.find((item) => item.id === e.target.value);
                setSize(eq?.sizes[0]);
                setQuantity(1);
                setCustomPrice('');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
            >
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} (Avail: {eq.availableStock}/{eq.totalStock})
                </option>
              ))}
            </select>
          </div>

          {selectedEq.sizes.length > 0 ? <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              {selectedEq.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div> : (
            <div className="flex items-center text-xs text-slate-500">
              Size not applicable for this equipment.
            </div>
          )}
        </div>

        {/* Quantity & Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={selectedEq.availableStock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rate per Item (₹)
            </label>
            <input
              type="number"
              value={customPrice !== '' ? customPrice : selectedEq.defaultRate}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-[#087FA5]"
            />
          </div>

        </div>

        {/* Total Summary */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Rental Fee</span>
            <span className="text-base font-extrabold text-[#EFB33A]">
              {formatCurrency(totalRental)}
            </span>
          </div>

        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Locker #
          </label>
          <input
            type="text"
            placeholder="e.g. Locker #24 key provided"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          />
        </div>

        {/* Actions */}
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
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Rental Items</span>
          </button>
        </div>
      </form>
      ) : (
        <div className="flex flex-col items-center text-center py-8">
          <Shirt className="w-10 h-10 text-slate-400 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No equipment available</h4>
          <p className="text-xs text-slate-500 mt-1">
            Add equipment to inventory before issuing a rental.
          </p>
        </div>
      )}
    </Modal>
  );
};

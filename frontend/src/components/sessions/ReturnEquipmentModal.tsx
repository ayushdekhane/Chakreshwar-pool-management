import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shirt, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';

export const ReturnEquipmentModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedRentalId = usePoolStore((state) => state.selectedRentalId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const rentals = usePoolStore((state) => state.rentals);
  const processReturn = usePoolStore((state) => state.processReturn);

  const [currentRentalId, setCurrentRentalId] = useState<string>(selectedRentalId || '');
  const [returnType, setReturnType] = useState<'full' | 'partial'>('full');
  const [returnedQty, setReturnedQty] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (selectedRentalId) {
      setCurrentRentalId(selectedRentalId);
    } else {
      const activeRental = rentals.find(
        (r) => r.equipmentType !== 'sale' && r.status !== 'returned'
      );
      if (activeRental) setCurrentRentalId(activeRental.id);
    }
  }, [selectedRentalId, rentals]);

  const rental = rentals.find((r) => r.id === currentRentalId);

  const pendingQty = rental ? rental.quantity - rental.returnedQuantity : 0;

  useEffect(() => {
    if (rental) {
      setReturnedQty(pendingQty);
    }
  }, [currentRentalId, pendingQty, rental]);

  if (!rental || rental.equipmentType === 'sale') return null;

  const actualReturnQty = returnType === 'full' ? pendingQty : returnedQty;
  const remainingAfterThisReturn = Math.max(0, pendingQty - actualReturnQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualReturnQty <= 0) {
      toast.error('Returned quantity must be greater than 0.');
      return;
    }
    if (actualReturnQty > pendingQty) {
      toast.error(`Cannot return more than remaining items (${pendingQty}).`);
      return;
    }

    try {
      await processReturn(rental.id, actualReturnQty, notes);

      if (remainingAfterThisReturn === 0) {
        toast.success(`Equipment fully returned for ${rental.customerName}!`, {
          description: `Returned ${actualReturnQty}x ${rental.equipmentName}. Stock updated.`,
        });
      } else {
        toast.info(`Partial return recorded: ${actualReturnQty} item(s) returned.`, {
          description: `${remainingAfterThisReturn} item(s) still remaining with customer.`,
        });
      }

      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process return.');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'return_equipment'}
      onClose={closeModal}
      title="Process Equipment Return"
      subtitle={`Rental #${rental.id} · Customer: ${rental.customerName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Rental */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Rental Item
          </label>
          <select
            value={currentRentalId}
            onChange={(e) => setCurrentRentalId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
          >
            {rentals
              .filter((r) => r.equipmentType !== 'sale' && r.status !== 'returned')
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.customerName} - {r.equipmentName} ({r.quantity - r.returnedQuantity} pending)
                </option>
              ))}
          </select>
        </div>

        {/* Status card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Equipment:</span>
            <span className="font-bold text-slate-800">{rental.equipmentName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Size:</span>
            <span className="font-medium text-slate-700">{rental.size || 'Not applicable'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Originally Issued:</span>
            <span className="font-bold text-slate-800">{rental.quantity} items</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Already Returned:</span>
            <span className="font-bold text-emerald-700">{rental.returnedQuantity} items</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-700 font-bold">Currently Pending Return:</span>
            <span className="font-extrabold text-[#E12C3D] text-sm">{pendingQty} items</span>
          </div>
        </div>

        {/* Return Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Return Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setReturnType('full');
                setReturnedQty(pendingQty);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                returnType === 'full'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Full Return (All {pendingQty} items)
            </button>
            <button
              type="button"
              onClick={() => setReturnType('partial')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                returnType === 'partial'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Partial Return
            </button>
          </div>
        </div>

        {/* If Partial Return, specify quantity */}
        {returnType === 'partial' && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
            <label className="block text-xs font-bold text-amber-900">
              Quantity Being Returned Now:
            </label>
            <input
              type="number"
              min="1"
              max={pendingQty - 1}
              value={returnedQty}
              onChange={(e) => setReturnedQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-amber-300 bg-white"
            />
            <p className="text-[11px] text-amber-800 font-medium">
              After this return, {remainingAfterThisReturn} item(s) will remain active with guest.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Condition / Return Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Good condition, no damage"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
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
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Return ({actualReturnQty} item{actualReturnQty > 1 ? 's' : ''})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

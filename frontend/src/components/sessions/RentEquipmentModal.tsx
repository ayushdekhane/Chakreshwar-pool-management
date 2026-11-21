import React, { useEffect, useState } from 'react';
import { PlusCircle, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';

type SelectedAccessory = {
  equipmentId: string;
  quantity: number;
  size?: string;
};

const getAccessoryKey = (equipmentId: string) => equipmentId;

export const RentEquipmentModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const equipment = usePoolStore((state) => state.equipment);
  const issueRental = usePoolStore((state) => state.issueRental);
  const selectedEquipmentType = usePoolStore((state) => state.selectedEquipmentType);

  const [sessionId, setSessionId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [equipmentType, setEquipmentType] = useState<'rental' | 'sale'>('rental');
  const [selectedAccessories, setSelectedAccessories] = useState<Record<string, SelectedAccessory>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeModal !== 'rent_equipment') return;
    setSessionId(selectedSessionId || '');
    setGuestName('');
    setNotes('');
    setEquipmentType(selectedEquipmentType || 'rental');
    setSelectedAccessories({});
  }, [activeModal, selectedSessionId, selectedEquipmentType]);

  const activeSession = sessions.find((session) => session.id === sessionId);

  const availableItems = equipment
    .filter((item) =>
      equipmentType === 'rental'
        ? item.equipmentType === 'rental'
        : item.availableForSale
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const combinedCharge = Object.values(selectedAccessories).reduce((total, selection) => {
    const item = equipment.find((candidate) => candidate.id === selection.equipmentId);
    const rate = equipmentType === 'sale'
      ? item?.saleRate ?? item?.defaultRate ?? 0
      : item?.defaultRate ?? 0;
    return total + rate * selection.quantity;
  }, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!sessionId && !guestName.trim()) {
      toast.error('Please assign equipment to an active session or enter a guest name.');
      return;
    }
    if (Object.keys(selectedAccessories).length === 0) {
      toast.error('Select at least one equipment item.');
      return;
    }

    const selections = Object.values(selectedAccessories);
    for (const selection of selections) {
      const item = equipment.find((candidate) => candidate.id === selection.equipmentId);
      if (!item) {
        toast.error('One or more selected items are no longer available.');
        return;
      }
      if (
        !Number.isInteger(selection.quantity) ||
        selection.quantity < 1 ||
        selection.quantity > item.availableStock
      ) {
        toast.error(`Quantity for ${item.name} exceeds available stock.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      for (const selection of selections) {
        const item = equipment.find((candidate) => candidate.id === selection.equipmentId);
        if (!item) continue;
        const rate = equipmentType === 'sale'
          ? item.saleRate ?? item.defaultRate ?? 0
          : item.defaultRate ?? 0;

        await issueRental({
          sessionId: activeSession?.id,
          customerId: activeSession?.customerId,
          customerName: activeSession?.customerName || guestName.trim(),
          equipmentId: item.id,
          size: selection.size,
          quantity: selection.quantity,
          pricePerItem: rate,
          notes,
          transactionType: equipmentType,
        });
      }

      toast.success(
        `${equipmentType === 'sale' ? 'Sold' : 'Issued'} ${selections.length} equipment type(s)!`,
        { description: `Combined charge: ${formatCurrency(combinedCharge)}.` }
      );
      closeModal();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'rent_equipment'}
      onClose={closeModal}
      title={equipmentType === 'sale' ? 'Sell Equipment' : 'Rent Equipment'}
      subtitle="Add one or more costumes, goggles, towels or floats"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Attach to Active Session
          </label>
          <select
            value={sessionId}
            onChange={(event) => {
              setSessionId(event.target.value);
              if (event.target.value) setGuestName('');
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="">-- Standalone (No Active Session) --</option>
            {sessions
              .filter((session) => session.status !== 'completed' && session.status !== 'cancelled')
              .map((session) => (
                <option key={session.id} value={session.id}>
                  {session.customerName} (#{session.id}) - {session.type === 'group' ? session.groupName : 'Individual'}
                </option>
              ))}
          </select>

          {!sessionId && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Guest Name *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Guest name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-[#087FA5]" />
              Add Equipment
            </span>
            <span className="text-xs font-bold text-[#087FA5]">
              +{formatCurrency(combinedCharge)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            {availableItems.map((item) => {
              const key = getAccessoryKey(item.id);
              const selected = selectedAccessories[key];
              const rate = equipmentType === 'sale'
                ? item.saleRate ?? item.defaultRate
                : item.defaultRate;

              return (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col items-stretch gap-2 rounded-lg bg-white border border-slate-200 p-2.5"
                >
                  <label className="flex min-w-0 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      disabled={item.availableStock < 1}
                      onChange={(event) => {
                        setSelectedAccessories((current) => {
                          if (event.target.checked) {
                            return {
                              ...current,
                              [key]: {
                                equipmentId: item.id,
                                quantity: 1,
                                size: item.sizes[0],
                              },
                            };
                          }
                          const next = { ...current };
                          delete next[key];
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded text-[#087FA5]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {equipmentType === 'rental' ? 'Rental fee' : 'Sale price'}:{' '}
                        {formatCurrency(rate)} each · Available: {item.availableStock}
                      </span>
                    </span>
                  </label>

                  {selected && (
                    <div className="grid grid-cols-2 gap-2">
                      {item.sizes.length > 0 && (
                        <select
                          value={selected.size || item.sizes[0]}
                          onChange={(event) =>
                            setSelectedAccessories((current) => ({
                              ...current,
                              [key]: { ...selected, size: event.target.value },
                            }))
                          }
                          className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          {item.sizes.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={selected.quantity}
                        onChange={(event) =>
                          setSelectedAccessories((current) => ({
                            ...current,
                            [key]: {
                              ...selected,
                              quantity: Math.max(1, parseInt(event.target.value, 10) || 1),
                            },
                          }))
                        }
                        className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        placeholder="Qty"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {availableItems.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-500">
              No {equipmentType === 'sale' ? 'sale' : 'rental'} equipment is available.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Locker #
          </label>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Locker #24 key provided"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">
              {equipmentType === 'sale' ? 'Sale Charge' : 'Rental Fee'}
            </span>
            <span className="text-base font-extrabold text-[#EFB33A]">
              {formatCurrency(combinedCharge)}
            </span>
          </div>
        </div>

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
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl disabled:opacity-60"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting
              ? 'Adding...'
              : equipmentType === 'sale'
                ? 'Issue Sale Items'
                : 'Issue Rental Items'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

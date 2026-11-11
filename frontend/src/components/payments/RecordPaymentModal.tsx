import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CreditCard, CheckCircle2, User, Receipt, Banknote, Smartphone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';
import { PaymentMethod } from '../../types';

export const RecordPaymentModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const recordPayment = usePoolStore((state) => state.recordPayment);

  // If a session was selected, use it, else pick first with pending balance
  const [currentSessionId, setCurrentSessionId] = useState<string>(selectedSessionId || '');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (selectedSessionId) {
      setCurrentSessionId(selectedSessionId);
    } else if (sessions.length > 0) {
      const pendingSess = sessions.find((s) => s.outstandingBalance > 0);
      setCurrentSessionId(pendingSess ? pendingSess.id : sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  const activeSession = sessions.find((s) => s.id === currentSessionId);

  // Set default amount to pending balance
  useEffect(() => {
    if (activeSession) {
      setAmount(String(activeSession.outstandingBalance > 0 ? activeSession.outstandingBalance : activeSession.totalCharges));
    }
  }, [currentSessionId, activeSession]);

  if (!activeSession) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      const txn = await recordPayment({
        sessionId: activeSession.id,
        customerId: activeSession.customerId,
        customerName: activeSession.customerName,
        amount: numAmount,
        method,
        referenceNumber,
        notes,
      });

      toast.success(`Payment of ${formatCurrency(numAmount)} recorded!`, {
        description: `Txn ID: ${txn.id} (${method.toUpperCase()}). Session balance updated.`,
      });
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment.');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'record_payment'}
      onClose={closeModal}
      title="Record Payment Collection"
      subtitle="Accept Cash, UPI, or Card payments and immediately reconcile outstanding balances"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Target Session */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select Customer / Session
          </label>
          <select
            value={currentSessionId}
            onChange={(e) => setCurrentSessionId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#087FA5]"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.customerName} - #{s.id} (Bill: {formatCurrency(s.totalCharges)}, Pending: {formatCurrency(s.outstandingBalance)})
              </option>
            ))}
          </select>
        </div>

        {/* Financial Status Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Total Bill</span>
            <span className="font-extrabold text-slate-800 text-sm">
              {formatCurrency(activeSession.totalCharges)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Previously Paid</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {formatCurrency(activeSession.paidAmount)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Outstanding</span>
            <span
              className={`font-extrabold text-sm ${
                activeSession.outstandingBalance > 0 ? 'text-[#E12C3D]' : 'text-slate-700'
              }`}
            >
              {formatCurrency(activeSession.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">
              Payment Amount (₹) *
            </label>
            {activeSession.outstandingBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(activeSession.outstandingBalance))}
                className="text-[11px] font-bold text-[#087FA5] hover:underline"
              >
                Pay Full Outstanding ({formatCurrency(activeSession.outstandingBalance)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-bold text-slate-500">₹</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-base font-extrabold rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#087FA5]"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Payment Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className={`py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl border transition-all ${
                method === 'cash'
                  ? 'bg-[#087FA5] text-white border-[#087FA5] shadow-sm ring-2 ring-[#087FA5]/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('online')}
              className={`py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl border transition-all ${
                method === 'online'
                  ? 'bg-[#087FA5] text-white border-[#087FA5] shadow-sm ring-2 ring-[#087FA5]/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Online (UPI / Card)</span>
            </button>
          </div>
        </div>

        {/* Ref / UTR and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / UPI UTR / Receipt #
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/6312450091"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Counter deposit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
            <span>Record Payment ({formatCurrency(parseFloat(amount) || 0)})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};


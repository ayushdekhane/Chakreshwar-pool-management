import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  LogOut,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Smartphone,
  User,
  Phone,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency, formatTime } from '../../utils';
import { PaymentMethod } from '../../types';

export const CheckoutModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const checkoutAndPaySession = usePoolStore((state) => state.checkoutAndPaySession);
  const completeSession = usePoolStore((state) => state.completeSession);

  const session = sessions.find((s) => s.id === selectedSessionId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [payAmount, setPayAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setPayAmount(String(session.outstandingBalance));
      setPaymentMethod('cash');
      setReference('');
    }
  }, [session, selectedSessionId]);

  if (!session) return null;

  const hasPendingDue = session.outstandingBalance > 0;

  const handleCollectAndExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(payAmount);
      const amountToCollect = isNaN(parsedAmount) ? 0 : Math.max(0, parsedAmount);

      await checkoutAndPaySession({
        sessionId: session.id,
        amount: amountToCollect,
        method: paymentMethod,
        referenceNumber: reference.trim() || undefined,
        notes: `Exit checkout payment for ${session.customerName}`,
      });

      if (amountToCollect > 0) {
        toast.success(`Payment of ${formatCurrency(amountToCollect)} collected via ${paymentMethod.toUpperCase()}!`, {
          description: `Session #${session.id} checked out. Swimmer has left the pool. Updated in Payments page.`,
        });
      } else {
        toast.success(`Session #${session.id} checked out successfully!`);
      }

      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete pool exit checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitWithoutPaying = async () => {
    if (
      window.confirm(
        `Swimmer still owes ₹${session.outstandingBalance}!\n\nAre you sure you want to let them exit without collecting? The balance will remain unpaid on their record.`
      )
    ) {
      setIsSubmitting(true);
      try {
        await completeSession(session.id);
        toast.warning(`Session #${session.id} completed with ₹${session.outstandingBalance} pending.`);
        closeModal();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to exit session.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'checkout_session'}
      onClose={closeModal}
      title={
        <div className="flex items-center gap-2">
          <LogOut className="w-5 h-5 text-[#087FA5]" />
          <span>Pool Exit & Checkout</span>
        </div>
      }
      subtitle={`Verify payment status for ${session.customerName} before pool departure`}
      maxWidth="md"
    >
      <form onSubmit={handleCollectAndExit} className="space-y-4">
        {/* Swimmer Overview Header */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <User className="w-4 h-4 text-[#087FA5]" />
                <span>{session.customerName}</span>
                {session.type === 'group' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#70218C]/10 text-[#70218C]">
                    Group ({session.peopleCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{session.customerPhone}</span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Entry Time</span>
              <span className="font-mono font-bold text-slate-700 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTime(session.entryTime)}
              </span>
            </div>
          </div>

          {/* Charges Pill Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">Total Bill</span>
              <span className="font-bold text-slate-800">{formatCurrency(session.totalCharges)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Paid Advance</span>
              <span className="font-bold text-emerald-700">{formatCurrency(session.paidAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Balance Due</span>
              <span
                className={`font-extrabold text-sm ${
                  hasPendingDue ? 'text-[#E12C3D]' : 'text-slate-700'
                }`}
              >
                {formatCurrency(session.outstandingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Conditional Status Section: Due vs Settled */}
        {hasPendingDue ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Payment Required Before Departure</h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Swimmer has an unpaid balance of{' '}
                  <span className="font-extrabold text-amber-950 underline">
                    {formatCurrency(session.outstandingBalance)}
                  </span>
                  . Please collect payment in Cash or Online before completing exit.
                </p>
              </div>
            </div>

            {/* Payment Mode Selection: Cash or Online Only */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Payment Mode *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Counter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`py-3 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl border transition-all ${
                    paymentMethod === 'online'
                      ? 'bg-[#087FA5] text-white border-[#087FA5] shadow-sm ring-2 ring-[#087FA5]/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Online (UPI / Card)</span>
                </button>
              </div>
            </div>

            {/* Amount & Reference Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount to Collect (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-extrabold rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#087FA5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ref / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Desk Note"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">All Charges Fully Paid</h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Total charges of {formatCurrency(session.totalCharges)} have been fully settled. Swimmer is ready to leave.
              </p>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
          {hasPendingDue ? (
            <button
              type="button"
              onClick={handleExitWithoutPaying}
              disabled={isSubmitting}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 underline order-2 sm:order-1"
            >
              Exit Without Collecting
            </button>
          ) : (
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl order-2 sm:order-1"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={closeModal}
              className="hidden sm:inline-block px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 ${
                hasPendingDue
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-[#087FA5] hover:bg-[#066382] shadow-[#087FA5]/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {hasPendingDue
                  ? `Collect ${formatCurrency(Number(payAmount) || session.outstandingBalance)} & Complete Exit`
                  : 'Confirm Pool Exit & Complete'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};


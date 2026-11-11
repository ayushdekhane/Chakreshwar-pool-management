import React from 'react';
import {
  User,
  Phone,
  Clock,
  Calendar,
  CreditCard,
  Shirt,
  Plus,
  CheckCircle,
  XCircle,
  Printer,
  History,
  AlertOctagon,
  Users,
  Trash2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { SessionStatusBadge } from '../common/SessionStatusBadge';
import { TimerDisplay } from '../common/TimerDisplay';
import { formatTime, formatDateTime, formatCurrency } from '../../utils';
import { toast } from 'sonner';

export const SessionDetailsModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const openModal = usePoolStore((state) => state.openModal);
  const sessions = usePoolStore((state) => state.sessions);
  const completeSession = usePoolStore((state) => state.completeSession);
  const cancelSession = usePoolStore((state) => state.cancelSession);
  const deleteSession = usePoolStore((state) => state.deleteSession);

  const session = sessions.find((s) => s.id === selectedSessionId);

  if (!session) return null;

  const isFinished = session.status === 'completed' || session.status === 'cancelled';

  const handleComplete = () => {
    openModal('checkout_session', { sessionId: session.id });
  };

  const handleCancel = () => {
    if (window.confirm(`Are you sure you want to cancel session #${session.id}?`)) {
      cancelSession(session.id);
      toast.info(`Session #${session.id} cancelled.`);
      closeModal();
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete session #${session.id} for ${session.customerName}?\n\nThis will remove the admission record and live timer.`
      )
    ) {
      deleteSession(session.id);
      toast.success(`Session #${session.id} deleted.`);
      closeModal();
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'session_details'}
      onClose={closeModal}
      title={
        <div className="flex items-center gap-3">
          <span>Session #{session.id}</span>
          <SessionStatusBadge status={session.status} size="sm" />
        </div>
      }
      subtitle={`Swimmer: ${session.customerName} · Registered on ${formatDateTime(session.entryTime)}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Top Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Customer Info
            </span>
            <div className="font-bold text-sm text-[#171717] mt-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#087FA5]" />
              {session.customerName}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {session.customerPhone}
            </div>
            {session.type === 'group' && session.groupName && (
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#70218C]/10 text-[#70218C] text-[11px] font-bold">
                <Users className="w-3 h-3" />
                {session.groupName} ({session.peopleCount} members)
              </div>
            )}
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Timing Schedule
            </span>
            <div className="text-xs text-slate-700 mt-1 space-y-1">
              <div>
                Entry:{' '}
                <span className="font-mono font-bold">{formatTime(session.entryTime)}</span>
              </div>
              <div>
                Sched. Exit:{' '}
                <span className="font-mono font-bold">
                  {formatTime(session.scheduledExitTime)}
                </span>
              </div>
              {session.actualExitTime && (
                <div>
                  Actual Exit:{' '}
                  <span className="font-mono font-bold text-slate-600">
                    {formatTime(session.actualExitTime)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center items-start md:items-end">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Live Session Timer
            </span>
            <TimerDisplay
              scheduledExitTime={session.scheduledExitTime}
              isCompleted={isFinished}
              size="lg"
            />
            <span className="text-[11px] text-slate-500 mt-1">
              Total Duration: {session.durationMinutes} mins
            </span>
          </div>
        </div>

        {/* Financial Billing Breakdown */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-subtle">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#087FA5]" />
            Complete Billing Breakdown
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-500 block">Swimming Charge</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatCurrency(session.swimmingCharges)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Extension Fees</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatCurrency(session.extensionCharges)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Rental Charges</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatCurrency(session.rentalCharges)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Bill</span>
              <span className="font-extrabold text-[#087FA5] text-base">
                {formatCurrency(session.totalCharges)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">Paid: </span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(session.paidAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Outstanding: </span>
                <span
                  className={`font-bold ${
                    session.outstandingBalance > 0 ? 'text-[#E12C3D]' : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(session.outstandingBalance)}
                </span>
              </div>
            </div>

            {session.outstandingBalance > 0 && !isFinished && (
              <button
                onClick={() => {
                  openModal('record_payment', { sessionId: session.id });
                }}
                className="px-3 py-1 bg-[#087FA5] hover:bg-[#066382] text-white rounded-lg font-bold text-xs shadow-sm"
              >
                Collect ₹{session.outstandingBalance}
              </button>
            )}
          </div>
        </div>

        {/* Extensions History */}
        {session.extensions && session.extensions.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-600" />
              Extension History ({session.extensions.length})
            </h4>
            <div className="space-y-1.5">
              {session.extensions.map((ext) => (
                <div
                  key={ext.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs"
                >
                  <div>
                    <span className="font-bold text-amber-900">
                      +{ext.minutesAdded} Minutes Added
                    </span>
                    <span className="text-slate-500 ml-2">({formatDateTime(ext.timestamp)})</span>
                    {ext.notes && <p className="text-[11px] text-slate-600">{ext.notes}</p>}
                  </div>
                  <span className="font-bold text-amber-800">{formatCurrency(ext.charge)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Rentals attached */}
        {session.rentals && session.rentals.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-[#087FA5]" />
              Rented Equipment ({session.rentals.length})
            </h4>
            <div className="space-y-2">
              {session.rentals.map((rnt) => (
                <div
                  key={rnt.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{rnt.equipmentName}</span>
                    <span className="text-slate-500 ml-1">
                      (Qty: {rnt.quantity}, Returned: {rnt.returnedQuantity})
                    </span>
                    <div className="text-[11px] text-slate-500">
                      Size: {rnt.size || 'Standard'} · Deposit: {formatCurrency(rnt.securityDeposit)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rnt.status === 'returned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rnt.status === 'partial_returned'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rnt.status === 'returned'
                        ? 'Returned'
                        : rnt.status === 'partial_returned'
                        ? 'Partial Return'
                        : 'Active / With Guest'}
                    </span>

                    {rnt.status !== 'returned' && (
                      <button
                        onClick={() => openModal('return_equipment', { rentalId: rnt.id })}
                        className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-[11px] font-bold text-slate-700"
                      >
                        Process Return
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {!isFinished && (
              <>
                <button
                  onClick={() => openModal('extend_session', { sessionId: session.id })}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  <Clock className="w-3.5 h-3.5 text-[#087FA5]" />
                  <span>+ Extend Timer</span>
                </button>

                <button
                  onClick={() => openModal('record_payment', { sessionId: session.id })}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record Payment</span>
                </button>

                <button
                  onClick={() => openModal('rent_equipment', { sessionId: session.id })}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
                >
                  <Shirt className="w-3.5 h-3.5 text-purple-600" />
                  <span>Rent Equipment</span>
                </button>
              </>
            )}

            <button
              onClick={() => openModal('receipt_modal', { sessionId: session.id })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Receipt</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-1 transition-colors"
              title="Delete session record"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {!isFinished && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Cancel Session
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Session</span>
                </button>
              </>
            )}

            {isFinished && (
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

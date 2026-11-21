import React, { useRef } from 'react';
import { Printer, Waves, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency, formatDateTime, formatTime } from '../../utils';

export const ReceiptModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedSessionId = usePoolStore((state) => state.selectedSessionId);
  const closeModal = usePoolStore((state) => state.closeModal);
  const sessions = usePoolStore((state) => state.sessions);
  const settings = usePoolStore((state) => state.settings);

  const session = sessions.find((s) => s.id === selectedSessionId);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!session) return null;
  const overtimeMinutes = session.penaltyMinutes ??
    Math.max(
      0,
      Math.floor(
        (new Date(session.actualExitTime || Date.now()).getTime()
          - new Date(session.scheduledExitTime).getTime()) / 60000
      )
    );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={activeModal === 'receipt_modal'}
      onClose={closeModal}
      title="Official Pool Admission Receipt"
      subtitle={`${settings.businessName} · Guest Tax Invoice`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Printable Paper Area */}
        <div
          ref={receiptRef}
          className="p-6 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 space-y-4 print:p-0 print:border-none shadow-sm"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 text-base font-extrabold text-[#087FA5]">
              <Waves className="pw-5 h-5 text-[#087FA5]" />
              <span>{settings.businessName}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{settings.address}</p>
            <p className="text-[10px] text-slate-500">Phone: {settings.phone} · GSTIN: {settings.gstNumber}</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
              SWIMMING PASS & TAX INVOICE
            </span>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold">{session.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formatDateTime(session.entryTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Guest Name:</span>
              <span className="font-bold">{session.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span>{session.customerPhone}</span>
            </div>
            {session.type === 'group' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Group Leader:</span>
                <span className="font-bold">{session.groupName} ({session.peopleCount} pax)</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Entry Time:</span>
              <span>{formatTime(session.entryTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Allotted Exit:</span>
              <span>{formatTime(session.scheduledExitTime)}</span>
            </div>
            {session.actualExitTime && (
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Exit:</span>
                <span className="font-bold text-slate-800">{formatTime(session.actualExitTime)}</span>
              </div>
            )}
            {session.lockerNumbers && session.lockerNumbers.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Locker(s):</span>
                <span className="font-bold text-slate-800">{session.lockerNumbers.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-1.5 text-xs pb-3 border-b-2 border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-slate-600 pb-1 border-b border-slate-100">
              <span>Item / Service Description</span>
              <span>Amount</span>
            </div>

            <div className="flex justify-between">
              <span>{session.packageName} ({session.peopleCount} pax)</span>
              <span>{formatCurrency(session.swimmingCharges)}</span>
            </div>

            {(session.lockerCharges || 0) > 0 && (
              <div className="flex justify-between">
                <span>
                  Locker Charges ({session.lockerNumbers?.length || 0} locker
                  {(session.lockerNumbers?.length || 0) === 1 ? '' : 's'})
                </span>
                <span>{formatCurrency(session.lockerCharges || 0)}</span>
              </div>
            )}

            {session.extensionCharges > 0 && (
              <div className="flex justify-between">
                <span>Session Time Extension (+{session.durationMinutes - 60}m)</span>
                <span>{formatCurrency(session.extensionCharges)}</span>
              </div>
            )}

            {session.penaltyApplied && (session.penaltyCharges || 0) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>
                  Overtime Penalty ({session.penaltyIntervals || 0} intervals · {overtimeMinutes}m extra)
                </span>
                <span>{formatCurrency(session.penaltyCharges || 0)}</span>
              </div>
            )}

            {session.rentals.map((r) => (
              <div key={r.id} className="flex justify-between text-slate-600">
                <span>{r.equipmentType === 'sale' ? 'Sale' : 'Rental'}: {r.equipmentName} ({r.quantity}x)</span>
                <span>{formatCurrency(r.totalRentalAmount)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-sm text-slate-900">
              <span>Grand Total:</span>
              <span>{formatCurrency(session.totalCharges)}</span>
            </div>

            <div className="flex justify-between text-emerald-700">
              <span>Amount Paid:</span>
              <span className="font-bold">{formatCurrency(session.paidAmount)}</span>
            </div>

            <div className="flex justify-between text-[#E12C3D]">
              <span>Balance Outstanding:</span>
              <span className="font-bold">{formatCurrency(session.outstandingBalance)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-200 text-[10px] text-slate-500 space-y-1">
            <p>Thank you for choosing {settings.businessName}!</p>
            <p>Please return all rental gear and locker keys before leaving.</p>
            <p className="font-sans text-[9px] text-slate-400">Generated via Chakreshwar Swimming Desk OS</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  Search,
  Plus,
  Download,
  Printer,
  Smartphone,
  Banknote,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Clock,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatDateTime, exportToCsv, exportToExcel } from '../utils';
import { PaymentMethod, PaymentRecord } from '../types';
import { toast } from 'sonner';

export const Payments: React.FC = () => {
  const payments = usePoolStore((state) => state.payments);
  const sessions = usePoolStore((state) => state.sessions);
  const businessName = usePoolStore((state) => state.settings.businessName);
  const openModal = usePoolStore((state) => state.openModal);
  const deletePayment = usePoolStore((state) => state.deletePayment);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'online'>('all');
  const handleDeletePayment = async (p: PaymentRecord) => {
    if (
      window.confirm(
        `Are you sure you want to delete transaction ${p.id} of ${formatCurrency(p.amount)} for ${p.customerName}?\n\nThis will adjust the customer's session ledger and update reports.`
      )
    ) {
      try {
        await deletePayment(p.id);
        toast.success(`Transaction ${p.id} deleted.`, {
          description: 'Session billing, outstanding balance, and reports updated.',
        });
      } catch (err: any) {
        toast.error('Failed to delete transaction: ' + (err?.message || 'Error'));
      }
    }
  };

  // Summary Metrics
  const totalCollections = payments.reduce((acc, p) => acc + p.amount, 0);

  const cashCollections = payments
    .filter((p) => p.method === 'cash')
    .reduce((acc, p) => acc + p.amount, 0);

  const onlineCollections = payments
    .filter((p) => p.method !== 'cash')
    .reduce((acc, p) => acc + p.amount, 0);

  // Filtered Payments List
  const filteredPayments = payments.filter((p) => {
    if (methodFilter === 'cash' && p.method !== 'cash') return false;
    if (methodFilter === 'online' && p.method === 'cash') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCust = p.customerName.toLowerCase().includes(q);
      const matchTxn = p.id.toLowerCase().includes(q);
      const matchSess = p.sessionId.toLowerCase().includes(q);
      const matchRef = p.referenceNumber?.toLowerCase().includes(q) || false;
      if (!matchCust && !matchTxn && !matchSess && !matchRef) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    if (filteredPayments.length === 0) {
      toast.warning('No payment records are available to export.');
      return;
    }

    const exportData = filteredPayments.map((p) => ({
      'Transaction ID': p.id,
      'Session ID': p.sessionId,
      Customer: p.customerName,
      Method: p.method.toUpperCase(),
      Amount: p.amount,
      Reference: p.referenceNumber || '',
      Timestamp: p.timestamp,
      Status: p.status,
      'Locker Amount': sessions.find((session) => session.id === p.sessionId)?.lockerCharges || 0,
    }));
    const safeBusinessName = businessName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    exportToCsv(`${safeBusinessName || 'Pool'}_Payments_Ledger`, exportData);
    toast.success('Payments ledger exported to CSV!');
  };

  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      toast.warning('No payment records are available to export.');
      return;
    }

    const exportData = filteredPayments.map((p) => ({
      'Transaction ID': p.id,
      'Session ID': p.sessionId,
      Customer: p.customerName,
      Method: p.method.toUpperCase(),
      Amount: p.amount,
      Reference: p.referenceNumber || '',
      Timestamp: p.timestamp,
      Status: p.status,
      'Locker Amount': sessions.find((session) => session.id === p.sessionId)?.lockerCharges || 0,
    }));
    const safeBusinessName = businessName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    exportToExcel(`${safeBusinessName || 'Pool'}_Payments_Ledger`, [
      { sheetName: 'Payments', data: exportData },
    ]);
    toast.success('Payments ledger exported to Excel (.xlsx)!');
  };

  const getMethodBadge = (method: PaymentMethod) => {
    if (method === 'cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
          <Banknote className="w-3 h-3" /> Cash
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
        <Smartphone className="w-3 h-3 text-blue-600" /> Online
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Payments & Reconciliations
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Audit swimming receipts, UPI transaction IDs, and cash counter registers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openModal('record_payment')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white font-bold text-xs shadow-md shadow-[#087FA5]/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Today's Collections"
          value={formatCurrency(totalCollections)}
          subtitle="Recorded payments"
          icon={IndianRupee}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          accentBorderColor="border-l-emerald-500"
        />

        <StatCard
          title="Cash Collections"
          value={formatCurrency(cashCollections)}
          subtitle="Physical cash drawer"
          icon={Banknote}
          iconBgColor="bg-emerald-50/70"
          iconColor="text-emerald-700"
        />

        <StatCard
          title="Online Collections"
          value={formatCurrency(onlineCollections)}
          subtitle="UPI, Card & Netbanking"
          icon={Smartphone}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

      </div>

      {/* Filter and Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search txn ID, customer, UTR reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#087FA5] bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>

          {/* Export buttons */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-colors"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Locker Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No payment records found</p>
                    <p className="text-[11px] text-slate-400">Use "Record Payment" to log counter collections.</p>
                  </td>
                </tr>
              ) : (
                        filteredPayments.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Txn ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {p.id}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.customerName}
                      </td>

                      {/* Session ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        #{p.sessionId}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDateTime(p.timestamp)}
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4">
                        {getMethodBadge(p.method)}
                      </td>

                      {/* Ref */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {p.referenceNumber || '-'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span
                          className="font-extrabold text-sm text-emerald-700"
                        >
                          +{formatCurrency(p.amount)}
                        </span>
                        {(() => {
                          const session = sessions.find((item) => item.id === p.sessionId);
                          if (!session?.penaltyApplied || !session.penaltyCharges) return null;
                          return (
                            <span className="block text-[10px] font-semibold text-amber-700">
                              Includes penalty: {formatCurrency(session.penaltyCharges)} · {session.penaltyIntervals || 0} intervals · {session.penaltyMinutes || 0}m extra
                            </span>
                          );
                        })()}
                      </td>

                      {/* Locker Amount */}
                      <td className="py-3.5 px-4 font-bold text-[#087FA5]">
                        {formatCurrency(
                          sessions.find((session) => session.id === p.sessionId)?.lockerCharges || 0
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.id.startsWith('pay-') ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"
                            title="Locally recorded staff entry. Will synchronize with Supabase ledger when online."
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            Local (Pending Sync)
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"
                            title="Server-confirmed payment in Supabase ledger"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              openModal('receipt_modal', { sessionId: p.sessionId })
                            }
                            className="p-1.5 text-slate-500 hover:text-[#087FA5] rounded-lg hover:bg-slate-100"
                            title="View & print invoice receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete transaction record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

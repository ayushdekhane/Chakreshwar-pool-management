import React, { useState } from 'react';
import {
  Waves,
  Search,
  Filter,
  Users,
  Shirt,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Eye,
  RotateCcw,
  Printer,
  ChevronDown,
  Trash2,
  LogOut,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { StatCard } from '../components/common/StatCard';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { TimerDisplay } from '../components/common/TimerDisplay';
import { formatCurrency, formatTime, formatDate } from '../utils';
import { SessionStatus, SessionType, PaymentStatus } from '../types';
import { toast } from 'sonner';

export const Sessions: React.FC = () => {
  const sessions = usePoolStore((state) => state.sessions);
  const rentals = usePoolStore((state) => state.rentals);
  const openModal = usePoolStore((state) => state.openModal);
  const completeSession = usePoolStore((state) => state.completeSession);
  const deleteSession = usePoolStore((state) => state.deleteSession);

  const handleDeleteSession = (session: any) => {
    const label = session.type === 'group' && session.groupName ? `group "${session.groupName}"` : `session #${session.id} for ${session.customerName}`;
    if (window.confirm(`Are you sure you want to delete ${label}?\n\nThis will remove the session pass and active timers.`)) {
      deleteSession(session.id);
      toast.success(`Session #${session.id} deleted.`);
    }
  };

  // Tabs: 'active' | 'expired' | 'completed' | 'all' | 'rentals'
  const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'completed' | 'all' | 'rentals'>('active');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Top statistics
  const activeCount = sessions.filter((s) => s.status === 'active' || s.status === 'expiring').length;
  const expiringSoonCount = sessions.filter((s) => s.status === 'expiring').length;
  const expiredCount = sessions.filter((s) => s.status === 'expired').length;
  const completedTodayCount = sessions.filter((s) => s.status === 'completed').length;
  const totalSwimmers = sessions.reduce((acc, s) => acc + s.peopleCount, 0);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    // Tab filter
    if (activeTab === 'active' && session.status !== 'active' && session.status !== 'expiring') {
      return false;
    }
    if (activeTab === 'expired' && session.status !== 'expired') {
      return false;
    }
    if (activeTab === 'completed' && session.status !== 'completed') {
      return false;
    }

    // Search query (customer name, phone, group name, session id)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = session.customerName.toLowerCase().includes(q);
      const matchPhone = session.customerPhone.includes(q);
      const matchGroup = session.groupName?.toLowerCase().includes(q) || false;
      const matchId = session.id.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchGroup && !matchId) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && session.type !== typeFilter) {
      return false;
    }

    // Payment status filter
    if (paymentFilter !== 'all' && session.paymentStatus !== paymentFilter) {
      return false;
    }

    // Date filter
    if (dateFilter) {
      const sessionDate = session.entryTime.split('T')[0];
      if (sessionDate !== dateFilter) return false;
    }

    return true;
  });

  // Filter rentals
  const filteredRentals = rentals.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.equipmentName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Swimming Sessions & Rentals
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage live admission timers, equipment gear, and desk customer check-ins
          </p>
        </div>
      </div>

      {/* Top 5 Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Active Sessions"
          value={activeCount}
          subtitle="Currently swimming"
          icon={Waves}
          iconBgColor="bg-[#087FA5]/10"
          iconColor="text-[#087FA5]"
          onClick={() => setActiveTab('active')}
        />

        <StatCard
          title="Expiring Soon"
          value={expiringSoonCount}
          subtitle="≤ 5 mins warning"
          icon={AlertTriangle}
          iconBgColor="bg-[#ED6429]/10"
          iconColor="text-[#ED6429]"
          onClick={() => setActiveTab('active')}
        />

        <StatCard
          title="Expired Sessions"
          value={expiredCount}
          subtitle="Overtime alert"
          icon={AlertOctagon}
          iconBgColor="bg-[#E12C3D]/10"
          iconColor="text-[#E12C3D]"
          onClick={() => setActiveTab('expired')}
        />

        <StatCard
          title="Completed Today"
          value={completedTodayCount}
          subtitle="Concluded slots"
          icon={CheckCircle}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-600"
          onClick={() => setActiveTab('completed')}
        />

        <StatCard
          title="Total Swimmers"
          value={totalSwimmers}
          subtitle="All recorded visitors"
          icon={Users}
          iconBgColor="bg-[#70218C]/10"
          iconColor="text-[#70218C]"
          onClick={() => setActiveTab('all')}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] overflow-x-auto pb-px">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'active', label: 'Active Sessions', count: activeCount, badgeColor: '' },
              { id: 'expired', label: 'Expired / Overtime', count: expiredCount, badgeColor: 'bg-red-100 text-red-800' },
              { id: 'completed', label: 'Completed', count: completedTodayCount, badgeColor: '' },
              { id: 'all', label: 'All Sessions', count: sessions.length, badgeColor: '' },
              { id: 'rentals', label: 'Equipment Records', count: rentals.length, badgeColor: '' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#087FA5] text-[#087FA5]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tab.badgeColor ? tab.badgeColor : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, phone, session #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#087FA5] bg-slate-50/50"
          />
        </div>

        {activeTab !== 'rentals' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="all">All Types (Individual & Group)</option>
              <option value="individual">Individual Only</option>
              <option value="group">Group Only</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="all">All Payments</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="unpaid">Unpaid / Pay Later</option>
            </select>

            {/* Date filter */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-xs"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-1"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SESSIONS TABLE OR RENTALS TABLE */}
      {activeTab !== 'rentals' ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Customer / Group</th>
                  <th className="py-3 px-4">Swimmers</th>
                  <th className="py-3 px-4">Slot Times</th>
                  <th className="py-3 px-4">Live Timer</th>
                  <th className="py-3 px-4">Billing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Waves className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No matching sessions found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search or tab filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => {
                    const isFinished = session.status === 'completed' || session.status === 'cancelled';
                    const isGroup = session.type === 'group';

                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">{session.id}</span>
                            {(session.id.startsWith('sess-') || session.id.startsWith('grp-sess-')) && (
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                                title="Created offline. Waiting to synchronize with Supabase."
                              >
                                Pending Sync
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {formatDate(session.entryTime)}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {session.customerName}
                            {isGroup && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#70218C]/15 text-[#70218C]">
                                Group
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {session.customerPhone}
                          </div>
                          {isGroup && session.groupName && (
                            <div className="text-[10px] text-purple-700 font-semibold truncate max-w-[140px]">
                              {session.groupName}
                            </div>
                          )}
                        </td>

                        {/* Swimmers Count */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                            <Users className="w-3 h-3 text-[#087FA5]" />
                            {session.peopleCount}
                          </span>
                        </td>

                        {/* Times */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div>In: {formatTime(session.entryTime)}</div>
                          <div className="text-slate-500">
                            Allotted out: {formatTime(session.scheduledExitTime)}
                          </div>
                          {session.actualExitTime && (
                            <div className="text-emerald-700 font-bold">
                              Exited: {formatTime(session.actualExitTime)}
                            </div>
                          )}
                        </td>

                        {/* Live Timer */}
                        <td className="py-3.5 px-4">
                          <TimerDisplay
                            scheduledExitTime={session.scheduledExitTime}
                            isCompleted={isFinished}
                            size="sm"
                          />
                        </td>

                        {/* Billing */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {formatCurrency(session.totalCharges)}
                          </div>
                          {session.penaltyApplied && (session.penaltyCharges || 0) > 0 && (
                            <div className="text-[10px] text-amber-700 font-semibold">
                              Penalty: {formatCurrency(session.penaltyCharges || 0)} · {session.penaltyIntervals || 0} intervals · {session.penaltyMinutes || 0}m extra
                            </div>
                          )}
                          <div className="text-[10px]">
                            {session.outstandingBalance > 0 ? (
                              <span className="text-[#E12C3D] font-bold">
                                Due: {formatCurrency(session.outstandingBalance)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                Fully Paid
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <SessionStatusBadge status={session.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isFinished && (
                              <>
                                <button
                                  onClick={() =>
                                    openModal('extend_session', { sessionId: session.id })
                                  }
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px] text-slate-700"
                                  title="Extend time"
                                >
                                  + Extend
                                </button>

                                <button
                                  onClick={() =>
                                    openModal('checkout_session', { sessionId: session.id })
                                  }
                                  className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition-all ${
                                    session.outstandingBalance > 0
                                      ? 'bg-[#087FA5] hover:bg-[#066382] text-white shadow-sm'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                  title={
                                    session.outstandingBalance > 0
                                      ? `Collect ₹${session.outstandingBalance} & complete exit`
                                      : 'Check out swimmer'
                                  }
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>{session.outstandingBalance > 0 ? `Pay ₹${session.outstandingBalance} & Exit` : 'Exit'}</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() =>
                                openModal('session_details', { sessionId: session.id })
                              }
                              className="p-1 text-slate-400 hover:text-[#087FA5] rounded"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                openModal('receipt_modal', { sessionId: session.id })
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="Print receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteSession(session)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Delete session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* RENTALS TAB TABLE */
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Equipment Rentals & Sales
              </h3>
              <p className="text-xs text-slate-500">
                Track issued rentals, sold items, and partial returns
              </p>
            </div>
            <button
              onClick={() => openModal('rent_equipment')}
              className="px-3.5 py-1.5 bg-[#087FA5] hover:bg-[#066382] text-white rounded-xl text-xs font-bold shadow-sm"
            >
              + Issue New Rental
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Qty (Issued / Returned)</th>
                  <th className="py-3 px-4">Charges & Deposit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Shirt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No rentals recorded</p>
                      <p className="text-[11px] text-slate-400">Click "+ Issue New Rental" to issue costumes or gear.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map((rental) => {
                    const isFullyReturned = rental.status === 'returned';
                    const isSold = rental.status === 'sold';
                    const pendingQty = rental.quantity - rental.returnedQuantity;

                    return (
                      <tr key={rental.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {rental.id}
                          <div className="text-[10px] text-slate-400 font-sans">
                            {formatTime(rental.issueTimestamp)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {rental.customerName}
                          {rental.sessionId && (
                            <span className="block text-[10px] text-[#087FA5] font-normal font-mono">
                              #{rental.sessionId}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {rental.equipmentName}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">
                            {rental.size || 'Standard'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {isSold ? (
                            <span className="font-bold text-slate-800">{rental.quantity} sold</span>
                          ) : (
                            <>
                              <span className="font-bold text-slate-800">{rental.quantity} issued</span>
                              <span className="text-slate-500 ml-1">
                                ({rental.returnedQuantity} returned
                                {pendingQty > 0 && (
                                  <span className="text-[#E12C3D] font-bold">, {pendingQty} due</span>
                                )}
                                )
                              </span>
                            </>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {isSold ? 'Sale' : 'Fee'}: {formatCurrency(rental.totalRentalAmount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isSold
                                ? 'bg-violet-100 text-violet-800'
                                : rental.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rental.status === 'partial_returned'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isSold
                              ? 'Sold'
                              : rental.status === 'returned'
                              ? 'Fully Returned'
                              : rental.status === 'partial_returned'
                              ? 'Partially Returned'
                              : 'Active Rental'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {!isSold && !isFullyReturned ? (
                            <button
                              onClick={() =>
                                openModal('return_equipment', { rentalId: rental.id })
                              }
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                            >
                              Return Gear
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> {isSold ? 'Sold' : 'Returned'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

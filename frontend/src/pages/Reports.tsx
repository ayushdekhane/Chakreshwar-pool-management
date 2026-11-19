import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Waves,
  Users,
  CreditCard,
  IndianRupee,
  Shirt,
  Clock,
  ArrowRight,
  Receipt,
  Banknote,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { usePwa } from '../hooks/usePwa';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePoolStore } from '../store/usePoolStore';
import { StatCard } from '../components/common/StatCard';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import {
  formatCurrency,
  formatDate,
  formatTime,
  exportToCsv,
  exportToExcel,
} from '../utils';
import { toast } from 'sonner';

export const Reports: React.FC = () => {
  const { isOnline } = usePwa();
  const sessions = usePoolStore((state) => state.sessions);
  const payments = usePoolStore((state) => state.payments);

  // Active Tab: 'daily' | 'monthly'
  const [reportTab, setReportTab] = useState<'daily' | 'monthly'>('daily');

  // Daily Report Date Picker (Defaults to today's date in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Monthly Report Month & Year
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Safe Date Key extractor (handles ISO strings and SQL timestamps)
  const getDateKey = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
  };

  // ==========================================
  // DAILY REPORT DATA COMPUTATION
  // ==========================================
  const dailySessions = useMemo(() => {
    return sessions.filter((s) => getDateKey(s.entryTime) === selectedDate);
  }, [sessions, selectedDate]);

  const dailyPayments = useMemo(() => {
    return payments.filter((p) => getDateKey(p.timestamp) === selectedDate);
  }, [payments, selectedDate]);

  // Daily Summary Metrics
  const dailyIndividualCount = dailySessions.filter((s) => s.type === 'individual').length;
  const dailyGroupCount = dailySessions.filter((s) => s.type === 'group').length;
  const dailyTotalPeople = dailySessions.reduce((acc, s) => acc + s.peopleCount, 0);

  const dailySwimCharges = dailySessions.reduce((acc, s) => acc + s.swimmingCharges, 0);
  const dailyExtCharges = dailySessions.reduce((acc, s) => acc + s.extensionCharges, 0);
  const dailyRentalCharges = dailySessions.reduce((acc, s) => acc + s.rentalCharges, 0);
  const dailyTotalBill = dailySessions.reduce((acc, s) => acc + s.totalCharges, 0);

  const dailyCashCollections = dailyPayments
    .filter((p) => p.method === 'cash')
    .reduce((acc, p) => acc + p.amount, 0);

  const dailyOnlineCollections = dailyPayments
    .filter((p) => p.method !== 'cash')
    .reduce((acc, p) => acc + p.amount, 0);

  // ==========================================
  // MONTHLY REPORT DATA COMPUTATION
  // ==========================================
  // Get days count in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Compute daily breakdown array for all days of the month
  const monthlyDailyBreakdown = useMemo(() => {
    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const daySessions = sessions.filter((s) => getDateKey(s.entryTime) === dayStr);
      const dayPayments = payments.filter((p) => getDateKey(p.timestamp) === dayStr);

      const swimmers = daySessions.reduce((acc, s) => acc + s.peopleCount, 0);
      const indEntries = daySessions.filter((s) => s.type === 'individual').length;
      const grpEntries = daySessions.filter((s) => s.type === 'group').length;

      const swimChg = daySessions.reduce((acc, s) => acc + s.swimmingCharges, 0);
      const extChg = daySessions.reduce((acc, s) => acc + s.extensionCharges, 0);
      const rentChg = daySessions.reduce((acc, s) => acc + s.rentalCharges, 0);
      const totalChg = daySessions.reduce((acc, s) => acc + s.totalCharges, 0);

      const cash = dayPayments
        .filter((p) => p.method === 'cash')
        .reduce((acc, p) => acc + p.amount, 0);
      const online = dayPayments
        .filter((p) => p.method !== 'cash')
        .reduce((acc, p) => acc + p.amount, 0);
      list.push({
        dayNumber: day,
        dateStr: dayStr,
        swimmers,
        individualEntries: indEntries,
        groupEntries: grpEntries,
        swimmingCharges: swimChg,
        extensionCharges: extChg,
        rentalCharges: rentChg,
        totalCharges: totalChg,
        cash,
        online,
      });
    }
    return list;
  }, [sessions, payments, selectedYear, selectedMonth, daysInMonth]);

  // Monthly summary cards totals
  const monthlySwimRevenue = monthlyDailyBreakdown.reduce((acc, d) => acc + d.swimmingCharges, 0);
  const monthlyRentalRevenue = monthlyDailyBreakdown.reduce((acc, d) => acc + d.rentalCharges, 0);
  const monthlyExtRevenue = monthlyDailyBreakdown.reduce((acc, d) => acc + d.extensionCharges, 0);
  const monthlyCollections = monthlyDailyBreakdown.reduce((acc, d) => acc + d.cash + d.online, 0);
  const monthlyTotalSwimmers = monthlyDailyBreakdown.reduce((acc, d) => acc + d.swimmers, 0);
  const monthlyIndSessions = monthlyDailyBreakdown.reduce((acc, d) => acc + d.individualEntries, 0);
  const monthlyGroupSessions = monthlyDailyBreakdown.reduce((acc, d) => acc + d.groupEntries, 0);

  // Unique customers this month
  const monthlyUniqueCustomers = useMemo(() => {
    const custSet = new Set<string>();
    sessions.forEach((s) => {
      const parts = getDateKey(s.entryTime).split('-').map(Number);
      if (parts[0] === selectedYear && parts[1] === selectedMonth + 1) {
        custSet.add(s.customerId);
      }
    });
    return custSet.size;
  }, [sessions, selectedYear, selectedMonth]);

  // ==========================================
  // CHART DATASETS
  // ==========================================
  // 1. Daily Revenue Trend (Recharts AreaChart)
  const revenueTrendData = monthlyDailyBreakdown.map((d) => ({
    day: `Day ${d.dayNumber}`,
    Revenue: d.cash + d.online,
    Swimmers: d.swimmers,
  }));

  // 2. Payment Method Distribution (Recharts PieChart)
  const totalCashMonth = monthlyDailyBreakdown.reduce((acc, d) => acc + d.cash, 0);
  const totalOnlineMonth = monthlyDailyBreakdown.reduce((acc, d) => acc + d.online, 0);

  const paymentMethodPieData = [
    { name: 'Online Collections', value: totalOnlineMonth, color: '#087FA5' },
    { name: 'Cash Counter', value: totalCashMonth, color: '#10B981' },
  ].filter((item) => item.value > 0);

  // 3. Swimming vs Rental vs Extension (Recharts BarChart)
  const revenueCategoryBarData = [
    { category: 'Swimming Admission', Amount: monthlySwimRevenue, fill: '#087FA5' },
    { category: 'Equipment', Amount: monthlyRentalRevenue, fill: '#BE2365' },
    { category: 'Extensions', Amount: monthlyExtRevenue, fill: '#ED6429' },
  ];

  // Export Daily
  const handleExportDailyCsv = () => {
    const rows = dailySessions.map((s) => ({
      'Session ID': s.id,
      Customer: s.customerName,
      Phone: s.customerPhone,
      Type: s.type,
      Swimmers: s.peopleCount,
      'Entry Time': formatTime(s.entryTime),
      'Allotted Exit Time': formatTime(s.scheduledExitTime),
      'Actual Exit Time': s.actualExitTime ? formatTime(s.actualExitTime) : '',
      Lockers: s.lockerNumbers?.join(', ') || '',
      Duration: `${s.durationMinutes} mins`,
      'Swimming Charges': s.swimmingCharges,
      'Extension Charges': s.extensionCharges,
      'Equipment Charges': s.rentalCharges,
      'Total Bill': s.totalCharges,
      'Paid Amount': s.paidAmount,
      'Payment Status': s.paymentStatus,
      'Session Status': s.status,
    }));
    exportToCsv(`Daily_Report_${selectedDate}`, rows);
    toast.success('Daily report exported to CSV!');
  };

  const handleExportMonthlyExcel = () => {
    const rows = monthlyDailyBreakdown.map((d) => ({
      Date: d.dateStr,
      Swimmers: d.swimmers,
      'Individual Entries': d.individualEntries,
      'Group Entries': d.groupEntries,
      'Swimming Charges': d.swimmingCharges,
      'Equipment Charges': d.rentalCharges,
      'Total Charges': d.totalCharges,
      'Cash Received': d.cash,
      'Online Received': d.online,
    }));

    exportToExcel(`Monthly_Report_${months[selectedMonth]}_${selectedYear}`, [
      { sheetName: 'Daily Breakdown', data: rows },
    ]);
    toast.success('Monthly report exported to Excel!');
  };

  // Jump from monthly breakdown row to daily report
  const handleOpenDayReport = (dateStr: string) => {
    setSelectedDate(dateStr);
    setReportTab('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Switched to Daily Report for ${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Financial & Operational Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Audit daily ledger journals, revenue breakdowns, monthly trends, and customer footfalls
          </p>
        </div>

        {/* Global Export & Print Tools */}
        <div className="flex items-center gap-2">
          {reportTab === 'daily' ? (
            <button
              onClick={handleExportDailyCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-subtle"
            >
              <Download className="w-4 h-4 text-[#087FA5]" />
              <span>Export Daily CSV</span>
            </button>
          ) : (
            <button
              onClick={handleExportMonthlyExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl shadow-subtle"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Monthly Excel</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Offline Data Limitation Warning Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 shadow-xs">
          <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Offline Local Report:</strong> Showing metrics calculated from records stored on this device. Complete cloud-wide totals and multi-device reconciliations will be available once connected to the internet.
          </span>
        </div>
      )}

      {/* Two Main Tabs: Daily Report vs Monthly Report */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setReportTab('daily')}
            className={`py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              reportTab === 'daily'
                ? 'border-[#087FA5] text-[#087FA5]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Daily Report & Ledger</span>
          </button>

          <button
            onClick={() => setReportTab('monthly')}
            className={`py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              reportTab === 'monthly'
                ? 'border-[#70218C] text-[#70218C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>2. Monthly Analytics & Breakdown</span>
          </button>
        </div>

        {/* Date / Month Picker based on tab */}
        {reportTab === 'daily' ? (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Selected Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#087FA5]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 pb-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: DAILY REPORT VIEW */}
      {/* ==================================================== */}
      {reportTab === 'daily' && (
        <div className="space-y-6">
          {/* Daily Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-3">
            <StatCard
              title="Total Swimmers"
              value={dailyTotalPeople}
              subtitle="Inside pool today"
              icon={Users}
              iconBgColor="bg-[#087FA5]/10"
              iconColor="text-[#087FA5]"
            />
            <StatCard
              title="Individual Passes"
              value={dailyIndividualCount}
              subtitle="Single swimmers"
              icon={Waves}
              iconBgColor="bg-sky-50"
              iconColor="text-sky-700"
            />
            <StatCard
              title="Group Passes"
              value={dailyGroupCount}
              subtitle="Team sessions"
              icon={Users}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-700"
            />
            <StatCard
              title="Swimming Fees"
              value={formatCurrency(dailySwimCharges)}
              subtitle="Base gate passes"
              icon={IndianRupee}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-700"
            />
            <StatCard
              title="Extensions"
              value={formatCurrency(dailyExtCharges)}
              subtitle="Overtime fees"
              icon={Clock}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-700"
            />
            <StatCard
              title="Rentals"
              value={formatCurrency(dailyRentalCharges)}
              subtitle="Costumes & goggles"
              icon={Shirt}
              iconBgColor="bg-pink-50"
              iconColor="text-pink-700"
            />
            <StatCard
              title="Total Daily Bill"
              value={formatCurrency(dailyTotalBill)}
              subtitle="All billed services"
              icon={CreditCard}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-700"
              accentBorderColor="border-l-[#087FA5]"
            />
            <StatCard
              title="Cash Collections"
              value={formatCurrency(dailyCashCollections)}
              subtitle="Physical counter"
              icon={IndianRupee}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-700"
            />
            <StatCard
              title="Online Collections"
              value={formatCurrency(dailyOnlineCollections)}
              subtitle="UPI, Card & Netbanking"
              icon={Smartphone}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          {/* Daily Operations Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Daily Operations Ledger · {selectedDate}
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological admission register with itemized fees and payment reconciliation
                </p>
              </div>
              <span className="text-xs font-bold text-[#087FA5]">
                {dailySessions.length} Sessions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Entry / Exit Times</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Swim Fee</th>
                    <th className="py-3 px-3">Ext Fee</th>
                    <th className="py-3 px-3">Rental Fee</th>
                    <th className="py-3 px-3">Total Bill</th>
                    <th className="py-3 px-3">Paid</th>
                    <th className="py-3 px-3">Pay Status</th>
                    <th className="py-3 px-3">Session Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySessions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No sessions recorded on {selectedDate}</p>
                        <p className="text-[11px] text-slate-400">
                          Try picking another date or check the demonstration records.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    dailySessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {s.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{s.customerName}</span>
                          <span className="text-[10px] text-slate-500">{s.customerPhone}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div>In: {formatTime(s.entryTime)}</div>
                          <div className="text-slate-400">
                            Allotted out: {formatTime(s.scheduledExitTime)}
                          </div>
                          {s.actualExitTime && (
                            <div className="text-emerald-700 font-bold">
                              Exited: {formatTime(s.actualExitTime)}
                            </div>
                          )}
                          {s.lockerNumbers && s.lockerNumbers.length > 0 && (
                            <div className="text-[#087FA5] font-bold">
                              Lockers: {s.lockerNumbers.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {s.durationMinutes}m ({s.peopleCount} pax)
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {formatCurrency(s.swimmingCharges)}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {formatCurrency(s.extensionCharges)}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {formatCurrency(s.rentalCharges)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatCurrency(s.totalCharges)}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {formatCurrency(s.paidAmount)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.paymentStatus === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <SessionStatusBadge status={s.status} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Payment Transactions Ledger */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#087FA5]" />
                  <span>Daily Payment Collections · {selectedDate}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized ledger of all cash handovers and online payments collected on this day
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                {dailyPayments.length} Transactions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Txn ID</th>
                    <th className="py-3 px-3">Session</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Reference / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <CreditCard className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                        <p className="font-semibold text-slate-600">No payment transactions on {selectedDate}</p>
                        <p className="text-[11px] text-slate-400">
                          Transactions will appear here when recorded or collected at the counter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    dailyPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {p.id.length > 14 ? p.id.slice(0, 8) + '...' : p.id}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {p.sessionId ? (p.sessionId.length > 14 ? p.sessionId.slice(0, 8) + '...' : p.sessionId) : '-'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {p.customerName}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {formatTime(p.timestamp)}
                        </td>
                        <td className="py-3 px-3">
                          {p.method === 'cash' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                              <Banknote className="w-3 h-3" /> Cash
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                              <Smartphone className="w-3 h-3 text-blue-600" /> Online
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-sm text-emerald-700">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {p.referenceNumber || p.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: MONTHLY REPORT & ANALYTICS */}
      {/* ==================================================== */}
      {reportTab === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              title="Monthly Collections"
              value={formatCurrency(monthlyCollections)}
              subtitle="Recorded collections"
              icon={IndianRupee}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              accentBorderColor="border-l-emerald-500"
            />
            <StatCard
              title="Swimming Revenue"
              value={formatCurrency(monthlySwimRevenue)}
              subtitle="Admission passes"
              icon={Waves}
              iconBgColor="bg-[#087FA5]/10"
              iconColor="text-[#087FA5]"
            />
            <StatCard
              title="Rental Revenue"
              value={formatCurrency(monthlyRentalRevenue)}
              subtitle="Costume & gear"
              icon={Shirt}
              iconBgColor="bg-pink-50"
              iconColor="text-pink-700"
            />
            <StatCard
              title="Extension Revenue"
              value={formatCurrency(monthlyExtRevenue)}
              subtitle="Overtime fees"
              icon={Clock}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-700"
            />
            <StatCard
              title="Unique Customers"
              value={monthlyUniqueCustomers}
              subtitle="Individual guests"
              icon={Users}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-700"
            />
            <StatCard
              title="Total Swimmers"
              value={monthlyTotalSwimmers}
              subtitle="Footfall in pool"
              icon={Users}
              iconBgColor="bg-[#087FA5]/10"
              iconColor="text-[#087FA5]"
            />
            <StatCard
              title="Individual Passes"
              value={monthlyIndSessions}
              subtitle="Single entries"
              icon={Waves}
              iconBgColor="bg-sky-50"
              iconColor="text-sky-700"
            />
            <StatCard
              title="Group Passes"
              value={monthlyGroupSessions}
              subtitle="Squad entries"
              icon={Users}
              iconBgColor="bg-[#70218C]/10"
              iconColor="text-[#70218C]"
            />
          </div>

          {/* Recharts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Revenue Trend Chart */}
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#087FA5]" />
                    Daily Revenue Trend ({months[selectedMonth]} {selectedYear})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Net collections across all counter and UPI transactions
                  </p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#087FA5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#087FA5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', borderColor: '#E2E8F0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#087FA5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Distribution PieChart */}
            <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-1">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  Payment Mode Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">UPI vs Cash vs Card Share</p>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), 'Collected']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                {paymentMethodPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Source Breakdown Bar */}
          <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle">
            <h3 className="font-bold text-sm text-slate-800 mb-1">
              Swimming Admission vs Gear Rental vs Time Extensions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Revenue streams comparison for {months[selectedMonth]} {selectedYear}
            </p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueCategoryBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Amount" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DAILY BREAKDOWN TABLE (ALL DAYS OF THE MONTH) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Daily Breakdown Table ({months[selectedMonth]} {selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any day to immediately open its detailed Daily Operations Ledger
                </p>
              </div>
              <span className="text-xs text-[#087FA5] font-bold">
                Showing all {daysInMonth} calendar days
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Swimmers</th>
                    <th className="py-3 px-3">Ind / Grp</th>
                    <th className="py-3 px-3">Swim Fee</th>
                    <th className="py-3 px-3">Rent Fee</th>
                    <th className="py-3 px-3">Total Charges</th>
                    <th className="py-3 px-3">Cash</th>
                    <th className="py-3 px-3">Online</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyDailyBreakdown.map((row) => (
                    <tr
                      key={row.dateStr}
                      className={`hover:bg-[#087FA5]/5 transition-colors cursor-pointer group ${
                        row.swimmers > 0 ? 'bg-white font-medium' : 'bg-slate-50/30 text-slate-400'
                      }`}
                      onClick={() => handleOpenDayReport(row.dateStr)}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-[#087FA5]">
                        {row.dateStr}
                      </td>
                      <td className="py-3 px-3">
                        {row.swimmers > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                            {row.swimmers}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        {row.individualEntries} / {row.groupEntries}
                      </td>
                      <td className="py-3 px-3">
                        {row.swimmingCharges > 0 ? formatCurrency(row.swimmingCharges) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        {row.rentalCharges > 0 ? formatCurrency(row.rentalCharges) : '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {row.totalCharges > 0 ? formatCurrency(row.totalCharges) : '-'}
                      </td>
                      <td className="py-3 px-3 text-emerald-700">
                        {row.cash > 0 ? formatCurrency(row.cash) : '-'}
                      </td>
                      <td className="py-3 px-3 text-blue-700 font-bold">
                        {row.online > 0 ? formatCurrency(row.online) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDayReport(row.dateStr);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087FA5] hover:underline"
                        >
                          <span>Open Day</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

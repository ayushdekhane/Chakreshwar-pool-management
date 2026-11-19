import React, { useState } from 'react';
import {
  Users,
  Search,
  Clock,
  Phone,
  CheckCircle,
  Eye,
  UserCheck,
  Trash2,
  LogOut,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { StatCard } from '../components/common/StatCard';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { TimerDisplay } from '../components/common/TimerDisplay';
import { formatCurrency, formatTime, formatDate } from '../utils';
import { toast } from 'sonner';

export const Groups: React.FC = () => {
  const sessions = usePoolStore((state) => state.sessions);
  const openModal = usePoolStore((state) => state.openModal);
  const completeSession = usePoolStore((state) => state.completeSession);
  const deleteSession = usePoolStore((state) => state.deleteSession);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleDeleteGroup = (group: any) => {
    const groupLabel = group.groupName ? `group "${group.groupName}"` : `group #${group.id}`;
    if (
      window.confirm(
        `Are you sure you want to delete ${groupLabel} (Leader: ${group.customerName}, ${group.peopleCount} members)?\n\nThis will remove this group session, its member passes, and timer.`
      )
    ) {
      deleteSession(group.id);
      toast.success(`Group session ${group.id} deleted.`, {
        description: `${group.peopleCount} members removed from active pool roster.`,
      });
    }
  };

  // Filter only group sessions
  const groupSessions = sessions.filter((s) => s.type === 'group');

  // Summary Metrics
  const totalGroups = groupSessions.length;
  const activeGroups = groupSessions.filter(
    (s) => s.status === 'active' || s.status === 'expiring' || s.status === 'expired'
  ).length;
  const completedGroups = groupSessions.filter((s) => s.status === 'completed').length;
  const totalMembers = groupSessions.reduce((acc, s) => acc + s.peopleCount, 0);

  // Filtered List
  const filteredGroups = groupSessions.filter((group) => {
    if (statusFilter === 'active') {
      if (group.status === 'completed' || group.status === 'cancelled') return false;
    } else if (statusFilter === 'completed') {
      if (group.status !== 'completed') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = group.groupName?.toLowerCase().includes(q) || false;
      const matchLeader = group.customerName.toLowerCase().includes(q);
      const matchPhone = group.customerPhone.includes(q);
      if (!matchName && !matchLeader && !matchPhone) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Group Swims & Squad Passes
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Coordinate multi-swimmer delegations, team practices, and shared pool countdowns
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Groups"
          value={totalGroups}
          subtitle="All registered squads"
          icon={Users}
          iconBgColor="bg-[#70218C]/10"
          iconColor="text-[#70218C]"
        />

        <StatCard
          title="Active Groups"
          value={activeGroups}
          subtitle="Currently in the water"
          icon={Clock}
          iconBgColor="bg-[#087FA5]/10"
          iconColor="text-[#087FA5]"
          onClick={() => setStatusFilter('active')}
        />

        <StatCard
          title="Completed Groups"
          value={completedGroups}
          subtitle="Finished sessions"
          icon={CheckCircle}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-600"
          onClick={() => setStatusFilter('completed')}
        />

        <StatCard
          title="Total Swimmers"
          value={totalMembers}
          subtitle="Members accommodated"
          icon={UserCheck}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search group name, leader name, phone, member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#70218C] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#70218C] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({totalGroups})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'active'
                ? 'bg-[#70218C] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({activeGroups})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'completed'
                ? 'bg-[#70218C] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed ({completedGroups})
          </button>
        </div>
      </div>

      {/* Group Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Leader / Group</th>
                <th className="py-3 px-4">Leader & Contact</th>
                <th className="py-3 px-4">Swimmer Count</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Shared Timer</th>
                <th className="py-3 px-4">Charges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No group swims recorded</p>
                    <p className="text-[11px] text-slate-400">Click "+ New Group Entry" to register a team pass.</p>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const isFinished = group.status === 'completed' || group.status === 'cancelled';

                  return (
                    <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Group Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-sm text-[#70218C]">
                          {group.groupName || 'Swimming Group'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{group.id} · {formatDate(group.entryTime)}
                        </span>
                      </td>

                      {/* Leader */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{group.customerName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {group.customerPhone}
                        </div>
                      </td>

                      {/* Member count & preview */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#70218C]/10 text-[#70218C] font-extrabold text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{group.peopleCount} Swimmers</span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>In: {formatTime(group.entryTime)}</div>
                        <div className="text-slate-500">Allotted out: {formatTime(group.scheduledExitTime)}</div>
                        {group.actualExitTime && (
                          <div className="text-emerald-700 font-bold">
                            Exited: {formatTime(group.actualExitTime)}
                          </div>
                        )}
                      </td>

                      {/* Shared timer */}
                      <td className="py-3.5 px-4">
                        <TimerDisplay
                          scheduledExitTime={group.scheduledExitTime}
                          isCompleted={isFinished}
                          size="sm"
                        />
                      </td>

                      {/* Charges */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(group.totalCharges)}
                        </div>
                        <div className="text-[10px]">
                          {group.outstandingBalance > 0 ? (
                            <span className="text-[#E12C3D] font-bold">
                              Due: {formatCurrency(group.outstandingBalance)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              Paid: {formatCurrency(group.paidAmount)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <SessionStatusBadge status={group.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isFinished && (
                            <>
                              <button
                                onClick={() =>
                                  openModal('extend_session', { sessionId: group.id })
                                }
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px] text-slate-700"
                                title="Extend timer"
                              >
                                + Extend
                              </button>

                              <button
                                onClick={() =>
                                  openModal('checkout_session', { sessionId: group.id })
                                }
                                className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition-all ${
                                  group.outstandingBalance > 0
                                    ? 'bg-[#70218C] hover:bg-[#58186f] text-white shadow-sm'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                                title={
                                  group.outstandingBalance > 0
                                    ? `Collect ₹${group.outstandingBalance} & complete group exit`
                                    : 'Check out group'
                                }
                              >
                                <LogOut className="w-3 h-3" />
                                <span>{group.outstandingBalance > 0 ? `Pay ₹${group.outstandingBalance} & Exit` : 'Exit'}</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() =>
                              openModal('session_details', { sessionId: group.id })
                            }
                            className="p-1 text-slate-400 hover:text-[#70218C] rounded"
                            title="View roster & details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                            title="Delete group session"
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
    </div>
  );
};

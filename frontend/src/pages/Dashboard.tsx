import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  Users,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Shirt,
  ArrowRight,
  TrendingUp,
  Phone,
  CheckCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { StatCard } from '../components/common/StatCard';
import { SessionStatusBadge } from '../components/common/SessionStatusBadge';
import { TimerDisplay } from '../components/common/TimerDisplay';
import { formatCurrency, formatTime, formatDateTime } from '../utils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const sessions = usePoolStore((state) => state.sessions);
  const alerts = usePoolStore((state) => state.alerts);
  const openModal = usePoolStore((state) => state.openModal);
  const completeSession = usePoolStore((state) => state.completeSession);
  const dismissAlert = usePoolStore((state) => state.dismissAlert);

  // Filter active, expiring, expired
  const activeSessions = sessions.filter(
    (s) => s.status === 'active' || s.status === 'expiring'
  );
  const expiredSessions = sessions.filter((s) => s.status === 'expired');
  const expiringSessions = sessions.filter((s) => s.status === 'expiring');

  // Currently Swimming & Total People
  const currentlySwimmingCount = activeSessions.length;
  const totalPeopleInside = activeSessions.reduce((acc, s) => acc + s.peopleCount, 0);

  // Combined active cards list (Active, Expiring, Expired)
  const currentDeckSessions = [...expiringSessions, ...expiredSessions, ...activeSessions.filter(s => s.status === 'active')];

  // Active alerts
  const activeAlerts = alerts.filter((a) => !a.isDismissed);

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Pool Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Live monitor for swimmer timers, admission collections, and equipment rentals
          </p>
        </div>

      </div>

      {/* Dashboard Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          title="Currently Swimming"
          value={currentlySwimmingCount}
          subtitle="Active lane sessions"
          icon={Waves}
          iconBgColor="bg-[#087FA5]/10"
          iconColor="text-[#087FA5]"
          accentBorderColor="border-l-[#087FA5]"
          onClick={() => navigate('/sessions')}
        />

        <StatCard
          title="Total People in Pool"
          value={totalPeopleInside}
          subtitle="Swimmers & members"
          icon={Users}
          iconBgColor="bg-[#70218C]/10"
          iconColor="text-[#70218C]"
          accentBorderColor="border-l-[#70218C]"
          onClick={() => navigate('/sessions')}
        />

        <StatCard
          title="Expiring in 5 Mins"
          value={expiringSessions.length}
          subtitle="Warning window"
          icon={AlertTriangle}
          iconBgColor="bg-[#ED6429]/10"
          iconColor="text-[#ED6429]"
          accentBorderColor="border-l-[#ED6429]"
          onClick={() => navigate('/sessions')}
        />

        <StatCard
          title="Expired Sessions"
          value={expiredSessions.length}
          subtitle="Overtime swimmers"
          icon={AlertOctagon}
          iconBgColor="bg-[#E12C3D]/10"
          iconColor="text-[#E12C3D]"
          accentBorderColor="border-l-[#E12C3D]"
          onClick={() => navigate('/sessions')}
        />

      </div>

      {/* Active Alerts Banner if warnings/expired exist */}
      {activeAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
              Active Pool Deck Alerts ({activeAlerts.length})
            </span>
            <button
              onClick={() => navigate('/sessions')}
              className="text-xs font-bold text-[#087FA5] hover:underline"
            >
              View in Sessions &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeAlerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-xs shadow-subtle"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-800 truncate block">
                    {a.customerName}
                  </span>
                  <p className="text-[11px] text-slate-500 truncate">{a.message}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openModal('extend_session', { sessionId: a.sessionId })}
                    className="px-2 py-1 bg-[#087FA5] text-white font-bold text-[10px] rounded-lg shadow-sm"
                  >
                    + Extend
                  </button>
                  <button
                    onClick={() => dismissAlert(a.id)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] rounded-lg"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Section: Active Swimmers Cards & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <span>Active Pool Deck Sessions</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#087FA5]/10 text-[#087FA5]">
                {currentDeckSessions.length} Swimmers
              </span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Real-time synchronized timers with instant extension & payment controls
            </p>
          </div>


        </div>

        {/* Active Session Cards Grid */}
        {currentDeckSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center shadow-subtle">
            <Waves className="w-12 h-12 text-[#087FA5]/40 mb-3" />
            <h3 className="text-base font-bold text-slate-800">The pool is currently quiet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              No active swimmers in the pool right now. Start check-in to issue passes and start the timer.
            </p>
            <button
              onClick={() => openModal('individual_entry')}
              className="px-4 py-2 bg-[#087FA5] text-white font-bold text-xs rounded-xl shadow-md"
            >
              + Check In Swimmer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDeckSessions.map((session) => {
              const isGroup = session.type === 'group';

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-subtle hover:shadow-card transition-all flex flex-col justify-between ${
                    session.status === 'expired'
                      ? 'border-red-300 ring-1 ring-red-200'
                      : session.status === 'expiring'
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-[#171717] truncate">
                            {session.customerName}
                          </h3>
                          {isGroup && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#70218C]/10 text-[#70218C]">
                              Group
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {session.customerPhone}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Users className="w-3 h-3 text-[#087FA5]" />
                            {session.peopleCount} {session.peopleCount > 1 ? 'people' : 'person'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <SessionStatusBadge status={session.status} size="sm" />
                        {(session.id.startsWith('sess-') || session.id.startsWith('grp-sess-')) && (
                          <span
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                            title="Created offline. Will sync with Supabase when connected."
                          >
                            Pending Sync
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timer & Duration Display */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Remaining Timer
                        </span>
                        <TimerDisplay
                          scheduledExitTime={session.scheduledExitTime}
                          size="md"
                        />
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Slot Schedule
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {formatTime(session.entryTime)} - {formatTime(session.scheduledExitTime)}
                        </span>
                      </div>
                    </div>

                    {/* Financial Pill */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(session.totalCharges)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Paid</span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(session.paidAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Due</span>
                        <span
                          className={`font-extrabold ${
                            session.outstandingBalance > 0 ? 'text-[#E12C3D]' : 'text-slate-600'
                          }`}
                        >
                          {formatCurrency(session.outstandingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openModal('extend_session', { sessionId: session.id })}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors text-center"
                    >
                      + Extend
                    </button>

                    <button
                      onClick={() => openModal('checkout_session', { sessionId: session.id })}
                      className={`flex-1 py-1.5 px-2 font-bold text-[11px] rounded-lg transition-colors text-center shadow-sm flex items-center justify-center gap-1 ${
                        session.outstandingBalance > 0
                          ? 'bg-[#087FA5] hover:bg-[#066382] text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={session.outstandingBalance > 0 ? 'Collect balance and check out' : 'Check out swimmer'}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{session.outstandingBalance > 0 ? `Pay ₹${session.outstandingBalance} & Exit` : 'Check Out'}</span>
                    </button>

                    <button
                      onClick={() => openModal('session_details', { sessionId: session.id })}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg"
                      title="View complete session record"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Clock,
  Plus,
  Users,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  Shield,
  ShieldCheck,
  LogIn,
  LogOut,
  RefreshCw,
  Database,
} from 'lucide-react';
import { usePoolStore } from '../../store/usePoolStore';
import { formatTime, formatDate, cn } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const currentTime = usePoolStore((state) => state.currentTime);
  const settings = usePoolStore((state) => state.settings);
  const alerts = usePoolStore((state) => state.alerts);
  const openModal = usePoolStore((state) => state.openModal);
  const dismissAlert = usePoolStore((state) => state.dismissAlert);
  const dismissAllAlerts = usePoolStore((state) => state.dismissAllAlerts);
  const updateSettings = usePoolStore((state) => state.updateSettings);
  const currentUser = usePoolStore((state) => state.currentUser);
  const isSupabaseLive = usePoolStore((state) => state.isSupabaseLive);
  const isLoadingData = usePoolStore((state) => state.isLoadingData);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setShowUserDropdown(false);
      toast.success('Staff signed out successfully');
    } catch (err: any) {
      toast.error('Sign out error: ' + err.message);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.isDismissed);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-[#E2E8F0] shadow-sm">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
          <span className="font-semibold text-[#087FA5]">Serenity Sports Club</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Swimming Pool Operations</span>
        </div>
      </div>

      {/* Middle/Right: Live Clock & Action Tools */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Digital Clock (IST) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-subtle">
          <div className="relative flex items-center justify-center">
            <Clock className="w-4 h-4 text-[#087FA5]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#171717] tracking-tight font-mono">
              {formatTime(currentTime, settings.timeFormat === '24h')}
            </span>
            <span className="text-[10px] text-slate-500 -mt-0.5">
              {formatDate(currentTime, 'dd MMM')} · IST
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => openModal('individual_entry')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Individual</span>
          </button>

          <button
            onClick={() => openModal('group_entry')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#70218C] hover:bg-[#58186f] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Group</span>
          </button>

        </div>

        {/* Audio Alert Toggle */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() =>
              updateSettings({ soundEnabled: !settings.soundEnabled })
            }
            title={settings.soundEnabled ? 'Mute Alarms' : 'Unmute Alarms'}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
              settings.soundEnabled
                ? 'text-[#087FA5] hover:bg-[#087FA5]/10'
                : 'text-slate-400 hover:bg-slate-200'
            )}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>{settings.soundEnabled ? 'Mute' : 'Unmute'}</span>
          </button>
        </div>

        {/* Alerts Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            title="Expiry & Timer Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-[#E12C3D] rounded-full ring-2 ring-white animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Popover Panel */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-premium border border-[#E2E8F0] overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#171717]">
                    Timer & Expiry Alerts
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                    {activeAlerts.length}
                  </span>
                </div>
                {activeAlerts.length > 0 && (
                  <button
                    onClick={dismissAllAlerts}
                    className="text-xs font-semibold text-[#087FA5] hover:underline"
                  >
                    Dismiss All
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                {activeAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-medium text-slate-600">All clear!</p>
                    <p className="text-[11px] text-slate-400">
                      No active expiry alarms at this moment.
                    </p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-colors',
                        alert.type === 'expired'
                          ? 'bg-red-50/80 border-red-200 text-red-900'
                          : 'bg-amber-50/80 border-amber-200 text-amber-900'
                      )}
                    >
                      {alert.type === 'expired' ? (
                        <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">
                            {alert.customerName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 leading-tight opacity-90">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              openModal('extend_session', { sessionId: alert.sessionId });
                              setShowAlertsDropdown(false);
                            }}
                            className="px-2 py-0.5 bg-white text-slate-800 rounded font-semibold text-[10px] border border-slate-200 hover:bg-slate-100 shadow-sm"
                          >
                            + Extend
                          </button>
                          <button
                            onClick={() => {
                              navigate('/sessions');
                              setShowAlertsDropdown(false);
                            }}
                            className="flex items-center gap-0.5 text-[10px] font-medium text-[#087FA5] hover:underline"
                          >
                            View Session <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                        title="Dismiss alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 bg-slate-50 border-t border-[#E2E8F0] text-center">
                <button
                  onClick={() => {
                    navigate('/sessions');
                    setShowAlertsDropdown(false);
                  }}
                  className="text-xs font-semibold text-[#087FA5] hover:underline"
                >
                  Manage All Active Sessions &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Supabase Refresh Button if configured */}
        {isSupabaseConfigured && (
          <button
            onClick={() => {
              fetchAllData();
              toast.info('Syncing data with Supabase...');
            }}
            disabled={isLoadingData}
            title="Sync with Supabase"
            className="hidden sm:flex items-center justify-center p-2 text-slate-600 hover:text-[#087FA5] hover:bg-slate-100 rounded-xl transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', isLoadingData && 'animate-spin text-[#087FA5]')} />
          </button>
        )}

        {/* Staff Authentication & Desk Status */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-emerald-200 bg-emerald-50/50"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser.email ? currentUser.email.split('@')[0] : 'Staff'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Live
                  </span>
                </div>
              </button>

              {/* Staff Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-premium border border-[#E2E8F0] p-3 z-50">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.email}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Authenticated Staff
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 mb-3 bg-slate-50 p-2 rounded-xl">
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span className="font-semibold text-slate-700">Supabase Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Desk:</span>
                      <span className="font-semibold text-slate-700">Desk #1</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                      Settings & Database Controls
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Staff</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openModal('staff_login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-300 shadow-xs"
              title="Sign in with Supabase staff credentials"
            >
              <LogIn className="w-3.5 h-3.5 text-[#087FA5]" />
              <span className="hidden sm:inline">Staff Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Waves,
  Users,
  CreditCard,
  FileBarChart,
  Tag,
  Settings,
  Plus,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Database,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import { usePoolStore } from '../../store/usePoolStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { cn } from '../../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const sessions = usePoolStore((state) => state.sessions);
  const settings = usePoolStore((state) => state.settings);
  const alerts = usePoolStore((state) => state.alerts);
  const openModal = usePoolStore((state) => state.openModal);
  const updateSettings = usePoolStore((state) => state.updateSettings);
  const triggerAudioTest = usePoolStore((state) => state.triggerAudioTest);
  const resetDemonstrationData = usePoolStore((state) => state.resetDemonstrationData);
  const currentUser = usePoolStore((state) => state.currentUser);
  const isSupabaseLive = usePoolStore((state) => state.isSupabaseLive);
  const isLoadingData = usePoolStore((state) => state.isLoadingData);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);

  // Active counts
  const activeSessionsCount = sessions.filter((s) => s.status === 'active' || s.status === 'expiring').length;
  const expiredCount = sessions.filter((s) => s.status === 'expired').length;
  const activeGroupsCount = sessions.filter((s) => s.type === 'group' && s.status !== 'completed' && s.status !== 'cancelled').length;
  const pendingAlertsCount = alerts.filter((a) => !a.isDismissed).length;

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Sessions',
      path: '/sessions',
      icon: Waves,
      badge: activeSessionsCount > 0 ? activeSessionsCount : null,
      badgeColor: 'bg-[#087FA5] text-white',
    },
    {
      name: 'Groups',
      path: '/groups',
      icon: Users,
      badge: activeGroupsCount > 0 ? activeGroupsCount : null,
      badgeColor: 'bg-[#70218C] text-white',
    },
    {
      name: 'Payments',
      path: '/payments',
      icon: CreditCard,
      badge: null,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileBarChart,
      badge: null,
    },
    {
      name: 'Packages',
      path: '/packages',
      icon: Tag,
      badge: null,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-[#E2E8F0] shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex top-5 items-center gap-3 px-5 py-6 border-b border-[#E2E8F0]">
          <div className="relative flex items-center justify-center  w-10 h-10 rounded-xl bg-gradient-to-br from-[#087FA5] to-[#70218C] text-white shadow-md shadow-[#087FA5]/20 flex-shrink-0">
            <Waves className="w-5 h-5 text-white animate-pulse-subtle" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#EFB33A] border-2 border-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-[#171717] truncate flex items-center gap-1.5">
              {/* {settings.businessName} */}
              Chakreshwar Pool
            </span>
            <span className="text-[11px] font-semibold text-[#64748B] tracking-wider uppercase truncate">
               Pool Arena
            </span>
          </div>
        </div>

        {/* Quick Check-in CTA Button */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openModal('individual_entry');
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#087FA5] hover:bg-[#066382] active:scale-[0.98] text-white font-medium text-xs shadow-md shadow-[#087FA5]/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Individual</span>
            </button>
            <button
              onClick={() => {
                openModal('group_entry');
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#70218C] hover:bg-[#58186f] active:scale-[0.98] text-white font-medium text-xs shadow-md shadow-[#70218C]/20 transition-all"
            >
              <Users className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Group</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-[#087FA5]/10 text-[#087FA5] font-semibold'
                    : 'text-[#64748B] hover:text-[#171717] hover:bg-slate-100/70'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        'w-4.5 h-4.5 transition-colors',
                        isActive
                          ? 'text-[#087FA5]'
                          : 'text-[#64748B] group-hover:text-[#171717]'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== null ? (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-4 h-4 text-[#087FA5] opacity-60" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Live System Alerts Pill if any expired */}
        {expiredCount > 0 && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce" />
              <div className="flex-1 text-xs">
                <span className="font-bold">{expiredCount} Session{expiredCount > 1 ? 's' : ''} Expired!</span>
                <p className="text-[10px] text-red-600">Action required at pool deck</p>
              </div>
            </div>
          </div>
        )}

        {/* Sound alerts & Audio Test Control */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-50 border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateSettings({ soundEnabled: !settings.soundEnabled })
                }
                title={settings.soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
                className={cn(
                  'p-1.5 rounded-lg text-xs font-medium transition-colors',
                  settings.soundEnabled
                    ? 'bg-[#087FA5]/15 text-[#087FA5]'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <span className="text-xs font-medium text-slate-700">
                Audio Alarms
              </span>
            </div>
            <button
              onClick={triggerAudioTest}
              className="text-[11px] font-semibold text-[#087FA5] hover:underline"
            >
              Test Beep
            </button>
          </div>
        </div>

        {/* Database & Staff Auth Status Card */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center justify-between mb-1.5">
            {currentUser ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                <Database className="w-3 h-3 text-emerald-600" />
                Supabase Synced
              </span>
            ) : isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#087FA5] font-semibold text-[10px] border border-blue-200">
                <Database className="w-3 h-3 text-[#087FA5]" />
                Supabase Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Local Demo Mode
              </span>
            )}

            {currentUser && isSupabaseConfigured ? (
              <button
                onClick={() => fetchAllData()}
                disabled={isLoadingData}
                title="Sync records from Supabase"
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#087FA5] transition-colors"
              >
                <RefreshCw className={cn('w-3 h-3', isLoadingData && 'animate-spin')} />
                Sync
              </button>
            ) : (
              <button
                onClick={resetDemonstrationData}
                title="Reset sample pool data"
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#087FA5] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Data
              </button>
            )}
          </div>

          {currentUser ? (
            <p className="text-[10px] text-slate-500 truncate">
              Staff: <span className="font-semibold text-slate-700">{currentUser.email}</span>
            </p>
          ) : isSupabaseConfigured ? (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-400">Auth required for sync</span>
              <button
                onClick={() => {
                  openModal('staff_login');
                  onClose();
                }}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#087FA5] hover:underline"
              >
                <LogIn className="w-2.5 h-2.5" /> Staff Login
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 leading-tight">
              Using in-memory data. Configure Supabase in .env for persistent cloud sync.
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

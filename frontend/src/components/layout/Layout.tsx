import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useGlobalTimer } from '../../hooks/useTimer';
import { usePoolStore } from '../../store/usePoolStore';
import { authService } from '../../services/authService';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { StaffAuthScreen } from '../common/StaffAuthScreen';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { InstallPromptModal } from '../pwa/InstallPromptModal';
import { UpdatePromptModal } from '../pwa/UpdatePromptModal';

// Global Modals
import { IndividualEntryModal } from '../sessions/IndividualEntryModal';
import { GroupEntryModal } from '../groups/GroupEntryModal';
import { ExtendSessionModal } from '../sessions/ExtendSessionModal';
import { SessionDetailsModal } from '../sessions/SessionDetailsModal';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { RentEquipmentModal } from '../sessions/RentEquipmentModal';
import { ReturnEquipmentModal } from '../sessions/ReturnEquipmentModal';
import { PackageModal } from '../packages/PackageModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { StaffLoginModal } from '../common/StaffLoginModal';
import { CheckoutModal } from '../sessions/CheckoutModal';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const initializeOfflineData = usePoolStore((state) => state.initializeOfflineData);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);
  const currentUser = usePoolStore((state) => state.currentUser);
  const setCurrentUser = usePoolStore((state) => state.setCurrentUser);
  const openModal = usePoolStore((state) => state.openModal);

  // Initialize the real-time global timer tick (Asia/Kolkata)
  useGlobalTimer();

  useEffect(() => {
    let isMounted = true;

    // Immediately hydrate from local IndexedDB first for instant rendering
    initializeOfflineData();

    // Check existing staff auth session in Supabase persistent storage
    authService
      .getSession()
      .then((session) => {
        if (!isMounted) return;
        if (session?.user) {
          setCurrentUser(session.user);
          fetchAllData();
        } else {
          setCurrentUser(null);
        }
        setIsCheckingAuth(false);
      })
      .catch((err) => {
        console.error('Session check error:', err);
        if (isMounted) setIsCheckingAuth(false);
      });

    // Listen to real-time auth changes (sign in, token refresh, sign out)
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      const user = session?.user || null;
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setCurrentUser(user);
      if (user && event === 'SIGNED_IN') {
        fetchAllData();
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [initializeOfflineData, fetchAllData, setCurrentUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const queueRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        fetchAllData();
      }, 250);
    };

    const realtimeChannel = supabase
      .channel('staff-live-data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'costume_rentals' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        queueRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        queueRefresh
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Supabase live data channel failed:', error);
        } else if (status === 'TIMED_OUT') {
          console.warn('[Realtime] Supabase live data channel timed out');
        }
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(realtimeChannel);
    };
  }, [currentUser, fetchAllData]);

  // Brief loading screen while verifying staff session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F7F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#087FA5] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-600 tracking-wide">
          Verifying staff authorization...
        </span>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <StaffAuthScreen
        isPasswordRecovery
        onPasswordUpdated={() => setIsPasswordRecovery(false)}
      />
    );
  }

  // Protect counter desk pages: require authenticated staff when Supabase is configured
  if (isSupabaseConfigured && !currentUser) {
    return <StaffAuthScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7F9] text-[#171717]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <OfflineBanner />
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <button
        onClick={() => openModal('individual_entry')}
        className="fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#087FA5] to-[#70218C] text-white shadow-lg shadow-[#087FA5]/30 transition-transform active:scale-95 lg:hidden"
        aria-label="New Check-in"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Mobile Bottom Thumb Navigation */}
      <MobileNav />

      {/* Global Interactive Modals (accessible from any page/button) */}
      <IndividualEntryModal />
      <GroupEntryModal />
      <ExtendSessionModal />
      <SessionDetailsModal />
      <RecordPaymentModal />
      <RentEquipmentModal />
      <ReturnEquipmentModal />
      <PackageModal />
      <ReceiptModal />
      <StaffLoginModal />
      <CheckoutModal />

      {/* PWA Prompts */}
      <InstallPromptModal />
      <UpdatePromptModal />
    </div>
  );
};

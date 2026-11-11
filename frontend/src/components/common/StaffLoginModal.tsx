import React, { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Mail, Key, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { authService } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const StaffLoginModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const closeModal = usePoolStore((state) => state.closeModal);
  const currentUser = usePoolStore((state) => state.currentUser);
  const setCurrentUser = usePoolStore((state) => state.setCurrentUser);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both staff email and password.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await authService.signIn(email, password);
      setCurrentUser(user);
      toast.success('Staff authenticated successfully!', {
        description: `Logged in as ${user?.email}`,
      });
      await fetchAllData();
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
      toast.info('Staff signed out.');
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'staff_login'}
      onClose={closeModal}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#087FA5]" />
          <span>Staff Access & Security</span>
        </div>
      }
      subtitle="Authorized counter desk access protected by Supabase Row Level Security"
      maxWidth="md"
    >
      {currentUser ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Staff Session Active</p>
              <p className="text-emerald-700 mt-0.5">Authenticated as {currentUser.email}</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-mono">ID: {currentUser.id}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          {!isSupabaseConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Configuration Notice:</span> Add your{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code> to connect live authentication.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Staff Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="staff@serenitysportsclub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In as Staff'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};


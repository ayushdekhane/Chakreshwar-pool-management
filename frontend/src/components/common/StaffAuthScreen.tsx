import React, { useState } from 'react';
import {
  Waves,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { usePoolStore } from '../../store/usePoolStore';
import { toast } from 'sonner';

interface StaffAuthScreenProps {
  isPasswordRecovery?: boolean;
  onPasswordUpdated?: () => void;
}

export const StaffAuthScreen: React.FC<StaffAuthScreenProps> = ({
  isPasswordRecovery = false,
  onPasswordUpdated,
}) => {
  const setCurrentUser = usePoolStore((state) => state.setCurrentUser);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(newPassword);
      toast.success('Password updated successfully.');
      onPasswordUpdated?.();
    } catch (err: any) {
      console.error('Password Update Error:', err);
      const message = err?.message || 'Failed to update password. Please request a new reset link.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { user } = await authService.signIn(cleanEmail, password);
      setCurrentUser(user);
      toast.success('Staff authenticated successfully!', {
        description: `Welcome, ${user?.email}`,
      });
      await fetchAllData();
    } catch (err: any) {
      console.error('Authentication Error:', err);
      const message = err?.message || 'Authentication failed. Please verify credentials.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter your staff email above first.');
      return;
    }
    setResetLoading(true);
    try {
      await authService.resetPasswordForEmail(cleanEmail, window.location.origin);
      toast.success('If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#087FA5] to-[#70218C] text-white shadow-lg shadow-[#087FA5]/25 mb-3">
            <Waves className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
CHAKRESHWAR <span className="text-[#087FA5]">POOL</span>
          </h1>
          <p className="text-xs font-semibold text-[#64748B] tracking-wider uppercase mt-0.5">
            {/* Swimming Pool Management System · Staff Portal */}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-[#171717]">
                {isPasswordRecovery ? 'Set a New Password' : 'Staff Desk Sign In'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPasswordRecovery
                  ? 'Choose a new password for your staff account.'
                  : 'Protected by Supabase Row Level Security (RLS)'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Authentication Error:</span>
                <p className="mt-0.5 text-rose-700 leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          {isPasswordRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full px-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5] focus:border-transparent transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showNewPassword ? 'Hide new password' : 'Show new password'}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full px-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5] focus:border-transparent transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white font-bold text-xs shadow-md shadow-[#087FA5]/25 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
          /* Sign-in form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. desk1@chakreshwarpool.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5] focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-[11px] font-semibold text-[#087FA5] hover:underline"
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5] focus:border-transparent transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white font-bold text-xs shadow-md shadow-[#087FA5]/25 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Operations Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          )}

        </div>

        {/* Security Footer Notice */}
        <div className="text-center mt-6 text-[11px] text-slate-400 space-y-1">
          <p>🔒 Authenticated counter staff only · Supabase Row Level Security (RLS) active</p>
          {/* <p className="font-mono text-[10px] text-slate-400">
            Project: {import.meta.env.VITE_SUPABASE_URL || 'rcabboeubmeejsbrbkpk.supabase.co'}
          </p> */}
        </div>
      </div>
    </div>
  );
};

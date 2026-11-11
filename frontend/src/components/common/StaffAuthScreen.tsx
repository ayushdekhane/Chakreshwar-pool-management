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
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { usePoolStore } from '../../store/usePoolStore';
import { toast } from 'sonner';

export const StaffAuthScreen: React.FC = () => {
  const setCurrentUser = usePoolStore((state) => state.setCurrentUser);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegistrationNotice(null);

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
      if (mode === 'signin') {
        const { user } = await authService.signIn(cleanEmail, password);
        setCurrentUser(user);
        toast.success('Staff authenticated successfully!', {
          description: `Welcome, ${user?.email}`,
        });
        await fetchAllData();
      } else {
        const { user, session } = await authService.signUp(cleanEmail, password);
        if (session && user) {
          setCurrentUser(user);
          toast.success('Staff account created & signed in!', {
            description: `Logged in as ${user.email}`,
          });
          await fetchAllData();
        } else {
          setRegistrationNotice(
            `Account registered for ${cleanEmail}! If email confirmation is enabled in your Supabase project, please confirm the user in the Supabase Dashboard before signing in.`
          );
          setMode('signin');
          toast.success('Staff account created! Check confirmation status before signing in.');
        }
      }
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
      await authService.resetPasswordForEmail(cleanEmail);
      toast.success(`Password reset email sent to ${cleanEmail}! Please check your inbox.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const isCredentialError =
    errorMsg?.toLowerCase().includes('invalid login credentials') ||
    errorMsg?.toLowerCase().includes('not confirmed') ||
    errorMsg?.toLowerCase().includes('invalid');

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#087FA5] to-[#70218C] text-white shadow-lg shadow-[#087FA5]/25 mb-3">
            <Waves className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            SERENITY <span className="text-[#087FA5]">SPORTS CLUB</span>
          </h1>
          <p className="text-xs font-semibold text-[#64748B] tracking-wider uppercase mt-0.5">
            Swimming Pool Management System · Staff Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-[#171717]">
                {mode === 'signin' ? 'Staff Desk Sign In' : 'Create Staff Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Protected by Supabase Row Level Security (RLS)
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Registration Notice */}
          {registrationNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Account Created:</span>
                <p className="mt-0.5 text-emerald-700 leading-tight">{registrationNotice}</p>
              </div>
            </div>
          )}

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

          {/* Credential & Email Confirmation Troubleshooting Box */}
          {isCredentialError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Fixing "Invalid login credentials":</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                In Supabase, this error usually happens for two reasons:
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-[11px] space-y-2 font-medium text-slate-800">
                <div>
                  <span className="font-bold text-[#087FA5]">1. Email is Not Confirmed (Most Common):</span>
                  <p className="text-slate-600 mt-0.5">
                    Supabase blocks login if the email is unconfirmed. To confirm immediately: In your{' '}
                    <a
                      href="https://supabase.com/dashboard/project/rcabboeubmeejsbrbkpk/auth/users"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#087FA5] underline"
                    >
                      Supabase Users Dashboard
                    </a>
                    , click the <strong>•••</strong> menu next to <code>{email || 'your email'}</code> and select{' '}
                    <strong>"Confirm user"</strong>.
                  </p>
                </div>
                <div className="pt-1.5 border-t border-slate-100">
                  <span className="font-bold text-[#70218C]">2. Turn Off Email Confirmation for Counter Staff:</span>
                  <p className="text-slate-600 mt-0.5">
                    Go to{' '}
                    <a
                      href="https://supabase.com/dashboard/project/rcabboeubmeejsbrbkpk/auth/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#70218C] underline"
                    >
                      Authentication &gt; Providers &gt; Email
                    </a>
                    , toggle <strong>OFF "Confirm email"</strong>, and click Save. That allows instant staff login.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
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
                  placeholder="e.g. desk1@serenitysports.com"
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
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[11px] font-semibold text-[#087FA5] hover:underline"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
                  <span>{mode === 'signin' ? 'Sign In to Operations Desk' : 'Register Staff Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {mode === 'signin' ? 'New counter staff?' : 'Already have staff access?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg(null);
                setRegistrationNotice(null);
              }}
              className="font-bold text-[#087FA5] hover:underline"
            >
              {mode === 'signin' ? 'Register Staff Account' : 'Back to Sign In'}
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="text-center mt-6 text-[11px] text-slate-400 space-y-1">
          <p>🔒 Authenticated counter staff only · Supabase Row Level Security (RLS) active</p>
          <p className="font-mono text-[10px] text-slate-400">
            Project: {import.meta.env.VITE_SUPABASE_URL || 'rcabboeubmeejsbrbkpk.supabase.co'}
          </p>
        </div>
      </div>
    </div>
  );
};

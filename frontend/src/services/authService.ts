import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export const authService = {
  /**
   * Get current authenticated staff user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Get active staff session
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) return null;
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Staff Sign In with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.error('Staff Sign In Error:', error.message);
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session };
  },

  /**
   * Staff Sign Up (Create a new staff user account)
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet.');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          role: 'staff',
        },
      },
    });

    if (error) {
      console.error('Staff Sign Up Error:', error.message);
      throw new Error(error.message);
    }

    return { user: data.user, session: data.session };
  },

  /**
   * Send password recovery email
   */
  async resetPasswordForEmail(email: string, redirectTo: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check the Supabase environment variables.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Update the password for an authenticated recovery session
   */
  async updatePassword(password: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check the Supabase environment variables.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Resend confirmation email
   */
  async resendConfirmation(email: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Staff Sign Out
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Staff Sign Out Error:', error.message);
      throw new Error(error.message);
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

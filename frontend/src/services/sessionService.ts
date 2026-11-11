import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbSession, DbSessionStatus } from '../types/database';
import { isValidUuid } from '../utils';

export const sessionService = {
  /**
   * Fetch all swimming sessions with joined customer, payments and rentals
   */
  async getSessions(): Promise<DbSession[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers(*),
        payments(*),
        costume_rentals(*)
      `)
      .order('entry_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions from Supabase:', error.message);
      throw error;
    }

    return (data as DbSession[]) || [];
  },

  /**
   * Fetch active swimming sessions currently inside the pool
   */
  async getActiveSessions(): Promise<DbSession[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers(*),
        payments(*),
        costume_rentals(*)
      `)
      .in('status', ['active', 'expired'])
      .order('entry_time', { ascending: false });

    if (error) {
      console.error('Error fetching active sessions:', error.message);
      throw error;
    }

    return (data as DbSession[]) || [];
  },

  /**
   * Fetch sessions by group_code for squad management
   */
  async getSessionsByGroupCode(groupCode: string): Promise<DbSession[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        customer:customers(*),
        payments(*),
        costume_rentals(*)
      `)
      .eq('group_code', groupCode)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching group sessions for code ${groupCode}:`, error.message);
      throw error;
    }

    return (data as DbSession[]) || [];
  },

  /**
   * Start a new swimming session in Supabase.
   * Uses real customer UUID. Let PostgreSQL generate the session UUID.
   */
  async createSession(data: {
    customer_id: string;
    group_code?: string | null;
    group_name?: string | null;
    people_count?: number;
    entry_time: string;
    scheduled_exit_time: string;
    duration_minutes: number;
    session_amount: number;
    costume_used?: boolean;
    status?: DbSessionStatus;
  }): Promise<DbSession> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (!isValidUuid(data.customer_id)) {
      throw new Error(`Invalid customer ID: "${data.customer_id}" is not a valid UUID.`);
    }

    // Omit group-only columns for individual sessions so older schemas remain compatible.
    // Do NOT send custom "id" field - let PostgreSQL generate UUID.
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        customer_id: data.customer_id,
        ...(data.group_code !== undefined ? { group_code: data.group_code } : {}),
        ...(data.group_name !== undefined ? { group_name: data.group_name } : {}),
        ...(data.people_count !== undefined ? { people_count: data.people_count } : {}),
        entry_time: data.entry_time,
        scheduled_exit_time: data.scheduled_exit_time,
        duration_minutes: data.duration_minutes,
        session_amount: data.session_amount,
        costume_used: data.costume_used || false,
        status: data.status || 'active',
      })
      .select(`
        *,
        customer:customers(*)
      `)
      .single();

    if (error) {
      console.error('Error creating session in Supabase:', error.message);
      throw error;
    }

    if (!newSession || !isValidUuid(newSession.id)) {
      throw new Error('Database did not return a valid session UUID.');
    }

    return newSession as DbSession;
  },

  /**
   * Update session details (e.g. extending scheduled exit time, updating status)
   */
  async updateSession(
    id: string,
    updates: Partial<DbSession>
  ): Promise<DbSession> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (!isValidUuid(id)) {
      throw new Error(`Cannot update session: ID "${id}" is not a valid UUID.`);
    }

    // Clean joined relation objects before updating table
    const { customer, customers, payments, costume_rentals, ...cleanUpdates } = updates as any;

    const { data, error } = await supabase
      .from('sessions')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        payments(*),
        costume_rentals(*)
      `)
      .single();

    if (error) {
      console.error(`Error updating session ${id}:`, error.message);
      throw error;
    }

    return data as DbSession;
  },

  /**
   * Mark a session as completed when the swimmer leaves the pool.
   * Preserves historical session and payment records.
   */
  async completeSession(id: string, actualExitTime?: string): Promise<DbSession> {
    if (!isValidUuid(id)) {
      throw new Error(`Cannot complete session: ID "${id}" is not a valid UUID.`);
    }

    const exitTime = actualExitTime || new Date().toISOString();

    let actualDuration: number | null = null;
    if (isSupabaseConfigured) {
      const { data: current } = await supabase
        .from('sessions')
        .select('entry_time')
        .eq('id', id)
        .single();

      if (current?.entry_time) {
        const diffMs = new Date(exitTime).getTime() - new Date(current.entry_time).getTime();
        actualDuration = Math.max(1, Math.round(diffMs / 60000));
      }
    }

    return sessionService.updateSession(id, {
      actual_exit_time: exitTime,
      actual_duration_minutes: actualDuration,
      status: 'completed',
    });
  },

  /**
   * Delete a session from Supabase.
   * Validates UUID before calling database to avoid 22P02 syntax errors.
   */
  async deleteSession(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    if (!isValidUuid(id)) {
      console.warn(`Skipping Supabase delete: "${id}" is not a valid UUID (likely local mock data).`);
      return;
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting session ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Delete all sessions associated with a group_code
   */
  async deleteSessionsByGroupCode(groupCode: string): Promise<void> {
    if (!isSupabaseConfigured || !groupCode) return;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('group_code', groupCode);

    if (error) {
      console.error(`Error deleting sessions for group_code ${groupCode}:`, error.message);
      throw error;
    }
  },
};

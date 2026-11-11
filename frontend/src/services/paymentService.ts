import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbPayment, DbPaymentMethod } from '../types/database';
import { isValidUuid } from '../utils';

export const paymentService = {
  /**
   * Fetch payment transactions
   */
  async getPayments(): Promise<DbPayment[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        session:sessions(
          *,
          customer:customers(*)
        )
      `)
      .eq('transaction_type', 'payment')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments from Supabase:', error.message);
      throw error;
    }

    return (data as DbPayment[]) || [];
  },

  /**
   * Record a payment collection for a swimming session.
   * Uses database UUID for session. Let PostgreSQL generate the payment UUID.
   */
  async addPayment(data: {
    session_id: string;
    amount: number;
    payment_method: DbPaymentMethod;
    notes?: string;
    payment_date?: string;
  }): Promise<DbPayment> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (!isValidUuid(data.session_id)) {
      throw new Error(`Cannot record payment: Session ID "${data.session_id}" is not a valid UUID.`);
    }

    // Do NOT send custom "id" - let PostgreSQL generate UUID via DEFAULT gen_random_uuid()
    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert({
        session_id: data.session_id,
        amount: data.amount,
        payment_method: data.payment_method,
        transaction_type: 'payment',
        payment_date: data.payment_date || new Date().toISOString(),
        notes: data.notes || null,
      })
      .select(`
        *,
        session:sessions(
          *,
          customer:customers(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error recording payment in Supabase:', error.message);
      throw error;
    }

    if (!newPayment || !isValidUuid(newPayment.id)) {
      throw new Error('Database did not return a valid payment transaction UUID.');
    }

    return newPayment as DbPayment;
  },

  /**
   * Delete a transaction record if needed
   */
  async deletePayment(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    if (!isValidUuid(id)) {
      console.warn(`Skipping Supabase delete: "${id}" is not a valid UUID.`);
      return;
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting payment ${id}:`, error.message);
      throw error;
    }
  },
};

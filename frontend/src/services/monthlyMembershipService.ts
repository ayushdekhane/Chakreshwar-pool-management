import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MonthlyMembership, PaymentMethod, PaymentStatus } from '../types';

interface DbMonthlyMembership {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_age: number | null;
  notes: string | null;
  package_id: string;
  package_name: string;
  duration_months: number;
  price: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  start_date: string;
  expiry_date: string;
  created_at: string;
}

const fromDatabase = (row: DbMonthlyMembership): MonthlyMembership => ({
  id: row.id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerAge: row.customer_age || undefined,
  notes: row.notes || undefined,
  packageId: row.package_id,
  packageName: row.package_name,
  durationMonths: row.duration_months,
  price: Number(row.price),
  paidAmount: Number(row.paid_amount),
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method,
  startDate: row.start_date,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
});

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Monthly memberships cannot be saved.');
  }
}

export const monthlyMembershipService = {
  async getAll(): Promise<MonthlyMembership[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('monthly_memberships')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') {
        console.warn('Monthly memberships table is not created yet. Run the Supabase migration.');
        return [];
      }
      throw error;
    }
    return ((data || []) as DbMonthlyMembership[]).map(fromDatabase);
  },

  async create(data: Omit<MonthlyMembership, 'id' | 'createdAt'>): Promise<MonthlyMembership> {
    ensureConfigured();
    const { data: row, error } = await supabase
      .from('monthly_memberships')
      .insert({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_age: data.customerAge || null,
        notes: data.notes || null,
        package_id: data.packageId,
        package_name: data.packageName,
        duration_months: data.durationMonths,
        price: data.price,
        paid_amount: data.paidAmount,
        payment_status: data.paymentStatus,
        payment_method: data.paymentMethod,
        start_date: data.startDate,
        expiry_date: data.expiryDate,
      })
      .select('*')
      .single();
    if (error) throw error;
    return fromDatabase(row as DbMonthlyMembership);
  },

  async remove(id: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('monthly_memberships')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

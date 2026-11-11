import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbCustomer } from '../types/database';
import { isValidUuid } from '../utils';

export const customerService = {
  /**
   * Fetch all registered customers from Supabase
   */
  async getCustomers(): Promise<DbCustomer[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers from Supabase:', error.message);
      throw error;
    }

    return data || [];
  },

  /**
   * Look up existing customer by mobile number
   * Prevents creating duplicate customers
   */
  async getCustomerByMobile(mobile: string): Promise<DbCustomer | null> {
    if (!isSupabaseConfigured) return null;

    const cleanedMobile = mobile.trim();
    if (!cleanedMobile) return null;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('mobile', cleanedMobile)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error looking up customer by mobile "${cleanedMobile}":`, error.message);
      throw error;
    }

    return data;
  },

  /**
   * Register or retrieve existing customer in Supabase
   * Checks for existing mobile number, reuses UUID if found, otherwise lets PostgreSQL generate a new UUID.
   */
  async addCustomer(data: { name: string; mobile: string }): Promise<DbCustomer> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }

    const cleanedMobile = data.mobile.trim();
    const cleanedName = data.name.trim();

    if (!cleanedMobile) {
      throw new Error('Customer mobile number is required.');
    }
    if (!cleanedName) {
      throw new Error('Customer name is required.');
    }

    // 1. Check if customer with this mobile already exists
    const existing = await customerService.getCustomerByMobile(cleanedMobile);
    if (existing && isValidUuid(existing.id)) {
      return existing;
    }

    // 2. Insert new customer without custom ID - PostgreSQL generates UUID via DEFAULT gen_random_uuid()
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: cleanedName,
        mobile: cleanedMobile,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding customer to Supabase:', error.message);
      throw error;
    }

    if (!newCustomer || !isValidUuid(newCustomer.id)) {
      throw new Error('Database did not return a valid customer UUID.');
    }

    return newCustomer;
  },

  /**
   * Update existing customer information
   */
  async updateCustomer(
    id: string,
    data: { name?: string; mobile?: string }
  ): Promise<DbCustomer> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (!isValidUuid(id)) {
      throw new Error(`Cannot update customer: ID "${id}" is not a valid UUID.`);
    }

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating customer ${id}:`, error.message);
      throw error;
    }

    return updatedCustomer;
  },
};

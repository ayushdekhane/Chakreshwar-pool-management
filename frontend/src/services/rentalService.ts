import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbCostumeRental } from '../types/database';
import { isValidUuid } from '../utils';

export const rentalService = {
  /**
   * Fetch all costume and equipment rentals
   */
  async getAllRentals(): Promise<DbCostumeRental[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('costume_rentals')
      .select(`
        *,
        session:sessions(
          *,
          customer:customers(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals from Supabase:', error.message);
      throw error;
    }

    return (data as DbCostumeRental[]) || [];
  },

  /**
   * Fetch rentals for a specific session
   */
  async getRentalsBySession(sessionId: string): Promise<DbCostumeRental[]> {
    if (!isSupabaseConfigured) return [];

    if (!isValidUuid(sessionId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('costume_rentals')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching rentals for session ${sessionId}:`, error.message);
      throw error;
    }

    return (data as DbCostumeRental[]) || [];
  },

  /**
   * Issue a costume or equipment rental for a session.
   * Uses real session UUID. Let PostgreSQL generate the rental UUID.
   */
  async addRental(data: {
    session_id?: string;
    equipment_id?: string;
    item_name: string;
    customer_name?: string;
    size?: string;
    equipment_type: 'rental' | 'sale';
    quantity: number;
    rental_charge: number;
  }): Promise<DbCostumeRental> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (data.session_id && !isValidUuid(data.session_id)) {
      throw new Error(`Cannot add rental: Session ID "${data.session_id}" is not a valid UUID.`);
    }

    // Do NOT send custom "id" - let PostgreSQL generate UUID
    const { data: newRental, error } = await supabase
      .from('costume_rentals')
      .insert({
        session_id: data.session_id || null,
        equipment_id: data.equipment_id,
        item_name: data.item_name,
        customer_name: data.customer_name || null,
        size: data.size,
        equipment_type: data.equipment_type,
        quantity: data.quantity,
        returned_quantity: 0,
        rental_charge: data.rental_charge,
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
      console.error('Error adding rental in Supabase:', error.message);
      throw error;
    }

    if (!newRental || !isValidUuid(newRental.id)) {
      throw new Error('Database did not return a valid rental UUID.');
    }

    // Mark costume_used = true on session
    if (data.session_id) {
      try {
        await supabase
          .from('sessions')
          .update({ costume_used: true })
          .eq('id', data.session_id);
      } catch {
        // non-blocking
      }
    }

    return newRental as DbCostumeRental;
  },

  /**
   * Update returned quantity (supports partial returns)
   * Remaining quantity = quantity - returned_quantity
   */
  async updateRentalReturn(
    rentalId: string,
    returnedQuantity: number
  ): Promise<DbCostumeRental> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    if (!isValidUuid(rentalId)) {
      throw new Error(`Cannot update rental return: Rental ID "${rentalId}" is not a valid UUID.`);
    }

    const { data, error } = await supabase
      .from('costume_rentals')
      .update({ returned_quantity: returnedQuantity })
      .eq('id', rentalId)
      .select(`
        *,
        session:sessions(
          *,
          customer:customers(*)
        )
      `)
      .single();

    if (error) {
      console.error(`Error updating rental return ${rentalId}:`, error.message);
      throw error;
    }

    return data as DbCostumeRental;
  },

  /**
   * Delete a rental record
   */
  async deleteRental(rentalId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    if (!isValidUuid(rentalId)) {
      console.warn(`Skipping Supabase delete: "${rentalId}" is not a valid UUID.`);
      return;
    }

    const { error } = await supabase
      .from('costume_rentals')
      .delete()
      .eq('id', rentalId);

    if (error) {
      console.error(`Error deleting rental ${rentalId}:`, error.message);
      throw error;
    }
  },
};

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Equipment } from '../types';
import { DbRentalEquipment } from '../types/database';

const toEquipment = (row: DbRentalEquipment): Equipment => ({
  id: row.id,
  name: row.name,
  category: row.category,
  sizes: row.sizes,
  defaultRate: Number(row.default_rate),
  defaultDeposit: Number(row.default_deposit),
  totalStock: row.total_stock,
  availableStock: row.available_stock,
});

const toDatabaseRow = (equipment: Equipment) => ({
  id: equipment.id,
  name: equipment.name,
  category: equipment.category,
  sizes: equipment.sizes,
  default_rate: equipment.defaultRate,
  default_deposit: equipment.defaultDeposit,
  total_stock: equipment.totalStock,
  available_stock: equipment.availableStock,
  updated_at: new Date().toISOString(),
});

export const equipmentService = {
  async getAll(): Promise<Equipment[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('rental_equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rental equipment settings:', error.message);
      throw error;
    }

    return ((data || []) as DbRentalEquipment[]).map(toEquipment);
  },

  async save(equipment: Equipment): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('rental_equipment')
      .upsert(toDatabaseRow(equipment), { onConflict: 'id' });

    if (error) {
      console.error(`Error saving rental settings for ${equipment.name}:`, error.message);
      throw error;
    }
  },

  async updateAvailableStock(id: string, availableStock: number): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('rental_equipment')
      .update({ available_stock: availableStock })
      .eq('id', id);

    if (error) {
      console.error(`Error updating available stock for equipment ${id}:`, error.message);
      throw error;
    }
  },
};

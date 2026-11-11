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
  async getAll(defaultEquipment: Equipment[]): Promise<Equipment[]> {
    if (!isSupabaseConfigured) return defaultEquipment;

    const { data, error } = await supabase
      .from('rental_equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rental equipment settings:', error.message);
      throw error;
    }

    const existing = (data || []) as DbRentalEquipment[];
    const existingIds = new Set(existing.map((item) => item.id));
    const missingDefaults = defaultEquipment.filter((item) => !existingIds.has(item.id));

    if (missingDefaults.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('rental_equipment')
        .insert(missingDefaults.map(toDatabaseRow))
        .select('*');

      if (insertError) {
        console.error('Error initializing rental equipment settings:', insertError.message);
        throw insertError;
      }

      existing.push(...((inserted || []) as DbRentalEquipment[]));
    }

    return existing.map(toEquipment);
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

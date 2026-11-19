import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Equipment } from '../types';
import { DbEquipment } from '../types/database';

const toEquipment = (row: DbEquipment): Equipment => ({
  id: row.id,
  name: row.name,
  equipmentType: row.equipment_type ?? 'rental',
  availableForSale: row.available_for_sale ?? row.equipment_type === 'sale',
  saleRate: Number(row.sale_rate ?? row.default_rate),
  sizes: row.sizes,
  defaultRate: Number(row.default_rate),
  defaultDeposit: Number(row.default_deposit),
  totalStock: row.total_stock,
  availableStock: row.available_stock,
});

const toDatabaseRow = (equipment: Equipment) => ({
  id: equipment.id,
  name: equipment.name,
  equipment_type: equipment.equipmentType,
  available_for_sale: equipment.availableForSale ?? equipment.equipmentType === 'sale',
  sale_rate: equipment.saleRate ?? equipment.defaultRate,
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
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rental equipment settings:', error.message);
      throw error;
    }

    return ((data || []) as DbEquipment[]).map(toEquipment);
  },

  async save(equipment: Equipment): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('equipment')
      .upsert(toDatabaseRow(equipment), { onConflict: 'id' });

    if (error) {
      console.error(`Error saving rental settings for ${equipment.name}:`, error.message);
      if (
        error.message.includes('available_for_sale') ||
        error.message.includes('sale_rate')
      ) {
        throw new Error(
          'The database is missing shared rental/sale fields. Run frontend/supabase/equipment_sale_option_migration.sql in the Supabase SQL Editor, then try saving again.'
        );
      }
      throw error;
    }
  },

  async updateAvailableStock(id: string, availableStock: number): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('equipment')
      .update({ available_stock: availableStock })
      .eq('id', id);

    if (error) {
      console.error(`Error updating available stock for equipment ${id}:`, error.message);
      throw error;
    }
  },

  async adjustAvailableStock(id: string, quantityDelta: number): Promise<number> {
    if (!isSupabaseConfigured) return quantityDelta;

    const { data, error } = await supabase.rpc('adjust_equipment_available_stock', {
      p_equipment_id: id,
      p_quantity_delta: quantityDelta,
    });

    if (!error) return Number(data);

    const migrationMissing =
      error.code === 'PGRST202' ||
      error.message.includes('Could not find the function') ||
      error.message.includes('adjust_equipment_available_stock');

    if (!migrationMissing) {
      console.error(`Error adjusting available stock for equipment ${id}:`, error.message);
      throw error;
    }

    const { data: row, error: fetchError } = await supabase
      .from('equipment')
      .select('available_stock,total_stock')
      .eq('id', id)
      .single();

    if (fetchError || !row) throw fetchError || new Error(`Equipment ${id} was not found.`);

    const nextAvailable = row.available_stock + quantityDelta;
    if (nextAvailable < 0 || nextAvailable > row.total_stock) {
      throw new Error(`Insufficient or invalid available stock for equipment ${id}.`);
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('equipment')
      .update({
        available_stock: nextAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('available_stock')
      .single();

    if (updateError || !updatedRow) {
      throw updateError || new Error(`Failed to update equipment ${id}.`);
    }

    return Number(updatedRow.available_stock);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting equipment ${id}:`, error.message);
      throw error;
    }
  },
};

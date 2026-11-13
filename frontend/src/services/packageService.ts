import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Package } from '../types';

interface DbPackage {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
  is_active: boolean;
}

const fromDatabase = (row: DbPackage): Package => ({
  id: row.id,
  name: row.name,
  durationMinutes: row.duration_minutes,
  price: Number(row.price),
  description: row.description,
  isActive: row.is_active,
});

const toDatabase = (pkg: Omit<Package, 'id' | 'swimmersCount'>) => ({
  name: pkg.name.trim(),
  duration_minutes: pkg.durationMinutes,
  price: pkg.price,
  description: pkg.description.trim(),
  is_active: pkg.isActive,
});

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Package changes cannot be saved.');
  }
}

export const packageService = {
  async getAll(): Promise<Package[]> {
    ensureConfigured();

    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching packages from Supabase:', error.message);
      throw error;
    }

    return ((data || []) as DbPackage[]).map(fromDatabase);
  },

  async create(pkg: Omit<Package, 'id' | 'swimmersCount'>): Promise<Package> {
    ensureConfigured();

    const { data, error } = await supabase
      .from('packages')
      .insert(toDatabase(pkg))
      .select('*')
      .single();

    if (error) {
      console.error('Error creating package in Supabase:', error.message);
      throw error;
    }

    return fromDatabase(data as DbPackage);
  },

  async update(id: string, updates: Partial<Omit<Package, 'id' | 'swimmersCount'>>): Promise<void> {
    ensureConfigured();
    const databaseUpdates: Record<string, string | number | boolean> = {};

    if (updates.name !== undefined) databaseUpdates.name = updates.name.trim();
    if (updates.durationMinutes !== undefined) {
      databaseUpdates.duration_minutes = updates.durationMinutes;
    }
    if (updates.price !== undefined) databaseUpdates.price = updates.price;
    if (updates.description !== undefined) {
      databaseUpdates.description = updates.description.trim();
    }
    if (updates.isActive !== undefined) databaseUpdates.is_active = updates.isActive;
    databaseUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('packages').update(databaseUpdates).eq('id', id);
    if (error) {
      console.error(`Error updating package ${id} in Supabase:`, error.message);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    ensureConfigured();

    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) {
      console.error(`Error deleting package ${id} from Supabase:`, error.message);
      throw error;
    }
  },
};

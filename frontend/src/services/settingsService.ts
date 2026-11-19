import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Settings } from '../types';
import { DbAppSettings } from '../types/database';
import { initialSettings } from '../data/mockData';

const SETTINGS_ID = 'default';

export const settingsService = {
  async get(): Promise<Settings | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const savedSettings = (data as DbAppSettings).settings as unknown as Partial<Settings>;
    return { ...initialSettings, ...savedSettings };
  },

  async save(settings: Settings): Promise<void> {
    if (!isSupabaseConfigured) return;

    const row: DbAppSettings = {
      id: SETTINGS_ID,
      settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(row, { onConflict: 'id' });

    if (error) throw error;
  },
};

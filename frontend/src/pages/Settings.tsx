import React, { useEffect, useState } from 'react';
import {
  Building2,
  Tag,
  Bell,
  Shirt,
  Sliders,
  Database,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  Save,
  AlertTriangle,
  ShieldCheck,
  LogIn,
  LogOut,
  RefreshCw,
  Table,
  FileCode,
  Check,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { formatCurrency, cn } from '../utils';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { OfflineStorageSettings } from '../components/settings/OfflineStorageSettings';

export const Settings: React.FC = () => {
  const settings = usePoolStore((state) => state.settings);
  const equipment = usePoolStore((state) => state.equipment);
  const updateEquipment = usePoolStore((state) => state.updateEquipment);
  const updateSettings = usePoolStore((state) => state.updateSettings);
  const triggerAudioTest = usePoolStore((state) => state.triggerAudioTest);
  const resetDemonstrationData = usePoolStore((state) => state.resetDemonstrationData);
  const clearDemonstrationData = usePoolStore((state) => state.clearDemonstrationData);
  const currentUser = usePoolStore((state) => state.currentUser);
  const isSupabaseLive = usePoolStore((state) => state.isSupabaseLive);
  const isLoadingData = usePoolStore((state) => state.isLoadingData);
  const fetchAllData = usePoolStore((state) => state.fetchAllData);
  const openModal = usePoolStore((state) => state.openModal);
  const allState = usePoolStore((state) => state);

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<
    'business' | 'pricing' | 'timer' | 'rentals' | 'preferences' | 'data'
  >('business');
  const [rentalDrafts, setRentalDrafts] = useState<
    Record<string, { name: string; totalStock: string; availableStock: string; defaultRate: string }>
  >(() =>
    Object.fromEntries(
      equipment.map((item) => [
        item.id,
        {
          name: item.name,
          totalStock: String(item.totalStock),
          availableStock: String(item.availableStock),
          defaultRate: String(item.defaultRate),
        },
      ])
    )
  );

  useEffect(() => {
    setRentalDrafts(
      Object.fromEntries(
        equipment.map((item) => [
          item.id,
          {
            name: item.name,
            totalStock: String(item.totalStock),
            availableStock: String(item.availableStock),
            defaultRate: String(item.defaultRate),
          },
        ])
      )
    );
  }, [equipment]);

  // Local form state for business
  const [formData, setFormData] = useState({
    businessName: settings.businessName,
    phone: settings.phone,
    address: settings.address,
    email: settings.email,
    currency: settings.currency,
    timezone: settings.timezone,
    gstNumber: settings.gstNumber,
    baseRatePerHour: settings.baseRatePerHour,
    overtimeRatePer15Min: settings.overtimeRatePer15Min,
    fiveMinuteWarning: settings.fiveMinuteWarning,
    expiryAlarm: settings.expiryAlarm,
    soundEnabled: settings.soundEnabled,
    soundVolume: settings.soundVolume,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    defaultFilter: settings.defaultFilter,
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    toast.success('Settings updated successfully!');
  };

  const handleSaveRental = async (equipmentId: string) => {
    const draft = rentalDrafts[equipmentId];
    if (!draft) return;
    const equipmentItem = equipment.find((item) => item.id === equipmentId);
    if (!equipmentItem) return;

    const values = {
      name: draft.name.trim(),
      totalStock: Number(draft.totalStock),
      availableStock: Number(draft.availableStock),
      defaultRate: Number(draft.defaultRate),
      defaultDeposit: equipmentItem.defaultDeposit,
    };

    if (
      !values.name ||
      Object.entries(draft)
        .filter(([field]) => field !== 'name')
        .some(([, value]) => value.trim() === '') ||
      !Number.isInteger(values.totalStock) ||
      !Number.isInteger(values.availableStock) ||
      values.totalStock < 0 ||
      values.availableStock < 0 ||
      values.availableStock > values.totalStock ||
      !Number.isFinite(values.defaultRate) ||
      values.defaultRate < 0
    ) {
      toast.error('Enter an item name and valid values. Available stock cannot exceed total stock.');
      return;
    }

    try {
      await updateEquipment(equipmentId, values);
      toast.success('Rental settings updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update rental settings.');
    }
  };

  const handleExportJson = () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      club: 'Serenity Sports Club',
      sessions: allState.sessions,
      payments: allState.payments,
      rentals: allState.rentals,
      packages: allState.packages,
      customers: allState.customers,
      equipment: allState.equipment,
      settings: allState.settings,
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Serenity_Pool_Data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Demonstration records exported to JSON!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          System & Club Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Manage club profile, audio alarm thresholds, equipment rental rates, and demonstration data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] overflow-x-auto pb-px">
        {[
          { id: 'business', label: 'Business Profile', icon: Building2 },
          { id: 'pricing', label: 'Base Pricing', icon: Tag },
          { id: 'timer', label: 'Timer & Alarms', icon: Bell },
          { id: 'rentals', label: 'Rental Settings', icon: Shirt },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
          { id: 'data', label: 'Data Management', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#087FA5] text-[#087FA5]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-subtle p-6 max-w-4xl">
        {/* 1. BUSINESS PROFILE */}
        {activeTab === 'business' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Serenity Sports Club Profile
              </h3>
              <p className="text-xs text-slate-500">
                Official branding information displayed on swimmer invoices, receipts, and headers
              </p>
            </div>

            {/* Logo Preview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-sm">
                <img src="/icons/pool-logo.svg" alt="Club Logo" className="w-12 h-12" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Official Club Crest & Emblem
                </span>
                <span className="text-xs text-slate-500">
                  Vector SVG Brandmark · Serenity Sports Club Swimming Operations
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reception Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GST / Tax Identifier
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  disabled
                  value="₹ (Indian Rupee - INR)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST +5:30)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Info</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. BASE PRICING */}
        {activeTab === 'pricing' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Standard Pricing & Overtime Penalties
              </h3>
              <p className="text-xs text-slate-500">
                Default rates used for calculating time extensions and custom admissions
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Base Hourly Rate (₹ per 60 Mins)
                </label>
                <input
                  type="number"
                  value={formData.baseRatePerHour}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      baseRatePerHour: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-base font-extrabold rounded-xl border border-slate-300 text-[#087FA5]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Applied as baseline rate when no custom package is chosen
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Overtime Penalty Rate (₹ per 15 Mins)
                </label>
                <input
                  type="number"
                  value={formData.overtimeRatePer15Min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      overtimeRatePer15Min: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-base font-extrabold rounded-xl border border-slate-300 text-amber-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatically suggested when extending overtime sessions
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Pricing Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. TIMER & ALERTS */}
        {activeTab === 'timer' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Audio Alarms & Expiry Notifications
              </h3>
              <p className="text-xs text-slate-500">
                Configure Web Audio API synthesized tones for the 5-minute warning and session expiry
              </p>
            </div>

            <div className="space-y-4">
              {/* Sound Enable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Sound Alarms Enabled
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Play synthesized chime on warning (5m) and triple beep on session expiry
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.soundEnabled}
                  onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-[#087FA5] focus:ring-[#087FA5]"
                />
              </div>

              {/* 5-Min warning toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    5-Minute Expiry Warning Alert
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Show orange badge and play gentle notification chime
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.fiveMinuteWarning}
                  onChange={(e) =>
                    setFormData({ ...formData, fiveMinuteWarning: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-[#ED6429] focus:ring-[#ED6429]"
                />
              </div>

              {/* Expiry Alarm toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Overtime Expiry Alert
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Trigger urgent alert when scheduled exit time passes 00:00
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.expiryAlarm}
                  onChange={(e) => setFormData({ ...formData, expiryAlarm: e.target.checked })}
                  className="w-5 h-5 rounded text-[#E12C3D] focus:ring-[#E12C3D]"
                />
              </div>

              {/* Volume Slider & Test Button */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    Alarm Volume ({formData.soundVolume}%)
                  </span>
                  <button
                    type="button"
                    onClick={triggerAudioTest}
                    className="flex items-center gap-1 text-xs font-bold text-[#087FA5] hover:underline"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Synthesized Audio</span>
                  </button>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={formData.soundVolume}
                  onChange={(e) =>
                    setFormData({ ...formData, soundVolume: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-[#087FA5]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Alert Preferences</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. RENTAL SETTINGS */}
        {activeTab === 'rentals' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Equipment & Apparel Rental Settings
              </h3>
              <p className="text-xs text-slate-500">
                Edit total stock, available stock, and rental fee for each item.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Total Stock</th>
                    <th className="py-2.5 px-3">Available Stock</th>
                    <th className="py-2.5 px-3">Rental Fee</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipment.map((eq) => (
                    <tr key={eq.id}>
                      {(() => {
                        const draft = rentalDrafts[eq.id] || {
                          name: eq.name,
                          totalStock: String(eq.totalStock),
                          availableStock: String(eq.availableStock),
                          defaultRate: String(eq.defaultRate),
                        };
                        const updateDraft = (
                          field: keyof typeof draft,
                          value: string
                        ) => setRentalDrafts((current) => ({
                          ...current,
                          [eq.id]: { ...draft, [field]: value },
                        }));
                        const inputClass =
                          'w-24 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium';

                        return (
                          <>
                            <td className="py-3 px-3">
                              <input
                                aria-label={`${eq.name} item name`}
                                type="text"
                                value={draft.name}
                                onChange={(event) => updateDraft('name', event.target.value)}
                                className="w-48 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                aria-label={`${eq.name} total stock`}
                                type="number"
                                min={0}
                                step={1}
                                value={draft.totalStock}
                                onChange={(event) => updateDraft('totalStock', event.target.value)}
                                className={inputClass}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                aria-label={`${eq.name} available stock`}
                                type="number"
                                min={0}
                                step={1}
                                value={draft.availableStock}
                                onChange={(event) => updateDraft('availableStock', event.target.value)}
                                className={inputClass}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                aria-label={`${eq.name} rental fee`}
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.defaultRate}
                                onChange={(event) => updateDraft('defaultRate', event.target.value)}
                                className={inputClass}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => handleSaveRental(eq.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#087FA5] text-white text-xs font-bold hover:bg-[#066382]"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </button>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. APPLICATION PREFERENCES */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Display & Formatting Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Personalize operational table views, date styles, and clock formatting
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time Format
                </label>
                <select
                  value={formData.timeFormat}
                  onChange={(e) =>
                    setFormData({ ...formData, timeFormat: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="12h">12-Hour (07:30 PM)</option>
                  <option value="24h">24-Hour (19:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date Format
                </label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="dd/MM/yyyy">DD/MM/YYYY (Indian Standard)</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD (ISO)</option>
                  <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        )}

        {/* 6. DATA MANAGEMENT & SUPABASE DATABASE */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Supabase Database & Data Controls
              </h3>
              <p className="text-xs text-slate-500">
                Manage cloud database synchronization, staff authentication, schema status, and demonstration data.
              </p>
            </div>

            {/* Supabase Connection & Staff Auth Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#087FA5]/10 text-[#087FA5] flex items-center justify-center font-bold">
                    <Database className="w-5 h-5 text-[#087FA5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        Supabase Database Status
                      </span>
                      {isSupabaseConfigured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Demo Mode (.env not configured)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {import.meta.env.VITE_SUPABASE_URL
                        ? import.meta.env.VITE_SUPABASE_URL.replace(/(https:\/\/[^.]+).*/, '$1.supabase.co')
                        : 'https://placeholder.supabase.co'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSupabaseConfigured && (
                    <button
                      onClick={() => {
                        fetchAllData();
                        toast.info('Synchronizing all records from Supabase...');
                      }}
                      disabled={isLoadingData}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isLoadingData && 'animate-spin text-[#087FA5]')} />
                      <span>{isLoadingData ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  )}

                  {currentUser ? (
                    <button
                      onClick={async () => {
                        await authService.signOut();
                        toast.success('Staff signed out');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Staff Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openModal('staff_login')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white text-xs font-semibold shadow-xs transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Staff Sign In</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Staff Authentication & RLS Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Staff Access & RLS Security
                  </span>
                  {currentUser ? (
                    <div className="space-y-1">
                      <p className="text-slate-600">
                        Signed in as: <span className="font-bold text-slate-900">{currentUser.email}</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Authenticated staff session valid for Row Level Security (RLS) operations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-slate-600">
                        Status: <span className="font-semibold text-amber-700">Not authenticated</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sign in with staff credentials to unlock authenticated RLS read/write access to the Supabase tables.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-[#087FA5]" />
                    Database Schema File
                  </span>
                  <p className="text-slate-600">
                    File: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">frontend/supabase/schema.sql</code>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Contains table creation statements, foreign keys, performance indexes, and RLS policies for authenticated staff.
                  </p>
                </div>
              </div>

              {/* 4 Dedicated Supabase Tables */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Database Tables (4 Core Tables):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono">customers</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Table</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      id, name, mobile, created_at. Indexed on mobile.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono">sessions</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Table</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Individual swimmers & groups (group_code), entry/exit timestamps.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono">payments</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Table</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Payment transactions linked to session_id, multi-channel payment method.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono">costume_rentals</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Table</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Item name, quantity, returned_quantity for partial returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Offline Database (IndexedDB) & PWA Storage */}
            <OfflineStorageSettings />

            {/* In-Memory / Demonstration Controls */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Demonstration & Backup Actions
              </h4>
              <p className="text-xs text-slate-500">
                Quick backup tools and fallback mock dataset resets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Export All Records (JSON)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Download a full JSON dump of current sessions, payments, and rentals
                  </span>
                </div>
                <button
                  onClick={handleExportJson}
                  className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON Dump</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-xs text-emerald-900 block">
                    Reset Demonstration Records
                  </span>
                  <span className="text-[11px] text-emerald-700 block mt-1">
                    Reload realistic sample swimmers, active timers, expired alerts, and rentals
                  </span>
                </div>
                <button
                  onClick={() => {
                    resetDemonstrationData();
                    toast.success('Demonstration data successfully reset to fresh sample state!');
                  }}
                  className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Sample Application</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-red-600 block">Clear All Records</span>
                <span className="text-[11px] text-slate-500">
                  Empties all session cards and payments for a clean blank canvas
                </span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Clear all in-memory pool sessions and transactions?')) {
                    clearDemonstrationData();
                    toast.info('All demonstration records cleared.');
                  }
                }}
                className="flex items-center gap-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

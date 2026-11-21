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
  Plus,
  AlertTriangle,
  ShieldCheck,
  LogIn,
  LogOut,
  RefreshCw,
  Table,
  FileCode,
  Check,
  LockKeyhole,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { formatCurrency, cn, normalizeNonNegativeInput } from '../utils';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { OfflineStorageSettings } from '../components/settings/OfflineStorageSettings';

const EQUIPMENT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const normalizeEquipmentSizes = (sizes: string[]) => {
  const selectedSizes = new Set(sizes.map((size) => size.trim().toUpperCase()));
  return EQUIPMENT_SIZE_OPTIONS.filter((size) => selectedSizes.has(size));
};

export const Settings: React.FC = () => {
  const settings = usePoolStore((state) => state.settings);
  const sessions = usePoolStore((state) => state.sessions);
  const packages = usePoolStore((state) => state.packages);
  const updatePackage = usePoolStore((state) => state.updatePackage);
  const equipment = usePoolStore((state) => state.equipment);
  const updateEquipment = usePoolStore((state) => state.updateEquipment);
  const addEquipment = usePoolStore((state) => state.addEquipment);
  const deleteEquipment = usePoolStore((state) => state.deleteEquipment);
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
    'business' | 'pricing' | 'timer' | 'lockers' | 'rentals' | 'sales' | 'preferences' | 'data'
  >('business');
  const [rentalDrafts, setRentalDrafts] = useState<
    Record<string, {
      name: string;
      totalStock: string;
      availableStock: string;
      defaultRate: string;
      saleRate: string;
      availableForSale: boolean;
      sizes: string[];
      sizeNotApplicable: boolean;
    }>
  >(() =>
    Object.fromEntries(
      equipment.map((item) => [
        item.id,
        {
          name: item.name,
          totalStock: String(item.totalStock),
          availableStock: String(item.availableStock),
          defaultRate: String(item.defaultRate),
          saleRate: String(item.saleRate ?? item.defaultRate),
          availableForSale: item.availableForSale ?? item.equipmentType === 'sale',
          sizes: normalizeEquipmentSizes(item.sizes),
          sizeNotApplicable: normalizeEquipmentSizes(item.sizes).length === 0,
        },
      ])
    )
  );
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    totalStock: '',
    availableStock: '',
    defaultRate: '',
    saleRate: '',
    availableForSale: false,
    sizes: [] as string[],
    sizeNotApplicable: false,
  });
  const [lockerPackagePrices, setLockerPackagePrices] = useState<Record<string, string>>({});

  useEffect(() => {
    setLockerPackagePrices(
      Object.fromEntries(
        packages.map((pkg) => [pkg.id, String(pkg.lockerPrice ?? 0)])
      )
    );
  }, [packages]);

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
            saleRate: String(item.saleRate ?? item.defaultRate),
            availableForSale: item.availableForSale ?? item.equipmentType === 'sale',
            sizes: normalizeEquipmentSizes(item.sizes),
            sizeNotApplicable: normalizeEquipmentSizes(item.sizes).length === 0,
          },
        ])
      )
    );
  }, [equipment]);

  useEffect(() => {
    setFormData({
      businessName: settings.businessName,
      phone: settings.phone,
      address: settings.address,
      email: settings.email,
      currency: settings.currency,
      timezone: settings.timezone,
      gstNumber: settings.gstNumber,
      penaltyEnabled: settings.penaltyEnabled,
      penaltyAfterMinutes: settings.penaltyAfterMinutes,
      penaltyAmount: settings.penaltyAmount,
      fiveMinuteWarning: settings.fiveMinuteWarning,
      expiryAlarm: settings.expiryAlarm,
      soundEnabled: settings.soundEnabled,
      soundVolume: settings.soundVolume,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      defaultFilter: settings.defaultFilter,
      lockerCount: settings.lockerCount,
    });
  }, [settings]);

  // Local form state for business
  const [formData, setFormData] = useState({
    businessName: settings.businessName,
    phone: settings.phone,
    address: settings.address,
    email: settings.email,
    currency: settings.currency,
    timezone: settings.timezone,
    gstNumber: settings.gstNumber,
    penaltyEnabled: settings.penaltyEnabled,
    penaltyAfterMinutes: settings.penaltyAfterMinutes,
    penaltyAmount: settings.penaltyAmount,
    fiveMinuteWarning: settings.fiveMinuteWarning,
    expiryAlarm: settings.expiryAlarm,
    soundEnabled: settings.soundEnabled,
    soundVolume: settings.soundVolume,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    defaultFilter: settings.defaultFilter,
    lockerCount: settings.lockerCount,
  });

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeTab === 'lockers') {
      const requestedLockerCount = Number(formData.lockerCount);
      const allocatedLockerNumbers = sessions
        .filter((session) =>
          session.status === 'active' ||
          session.status === 'expiring' ||
          session.status === 'expired'
        )
        .flatMap((session) => session.lockerNumbers || []);
      const highestAllocatedLocker = Math.max(0, ...allocatedLockerNumbers);
      if (
        !Number.isInteger(requestedLockerCount) ||
        requestedLockerCount < highestAllocatedLocker
      ) {
        toast.error(
          `Locker count cannot be lower than currently allocated locker #${highestAllocatedLocker}.`
        );
        return;
      }

      try {
        await Promise.all(
          packages.map((pkg) => {
            const lockerPrice = Number(lockerPackagePrices[pkg.id] ?? pkg.lockerPrice ?? 0);
            if (!Number.isFinite(lockerPrice) || lockerPrice < 0) {
              throw new Error(`Enter a valid locker price for ${pkg.name}.`);
            }
            return updatePackage(pkg.id, { lockerPrice });
          })
        );
        await updateSettings(formData);
        toast.success('Locker count and package locker prices updated successfully!');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save locker settings.');
      }
      return;
    }
    void updateSettings(formData)
      .then(() => toast.success('Settings updated successfully!'))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to save settings.'));
  };

  const handleSaveRental = async (equipmentId: string) => {
    const draft = rentalDrafts[equipmentId];
    if (!draft) return;
    const equipmentItem = equipment.find((item) => item.id === equipmentId);
    if (!equipmentItem) return;

    const values = {
      name: draft.name.trim(),
      equipmentType: equipmentItem.equipmentType,
      totalStock: Number(draft.totalStock),
      availableStock: Number(draft.availableStock),
      defaultRate: equipmentItem.equipmentType === 'rental'
        ? Number(draft.defaultRate)
        : Number(draft.saleRate),
      saleRate: Number(draft.saleRate),
      availableForSale: equipmentItem.equipmentType === 'sale' || draft.availableForSale,
      defaultDeposit: 0,
      sizes: draft.sizeNotApplicable ? [] : normalizeEquipmentSizes(draft.sizes),
    };

    if (
      !values.name ||
      [draft.totalStock, draft.availableStock].some((value) => value.trim() === '') ||
      (equipmentItem.equipmentType === 'rental' && draft.defaultRate.trim() === '') ||
      ((equipmentItem.equipmentType === 'sale' || draft.availableForSale) && draft.saleRate.trim() === '') ||
      !Number.isInteger(values.totalStock) ||
      !Number.isInteger(values.availableStock) ||
      values.totalStock < 0 ||
      values.availableStock < 0 ||
      values.availableStock > values.totalStock ||
      !Number.isFinite(values.defaultRate) || values.defaultRate < 0 ||
      !Number.isFinite(values.saleRate) || values.saleRate < 0 ||
      (!draft.sizeNotApplicable && draft.sizes.length === 0)
    ) {
      toast.error('Enter an item name, valid values, and select available sizes or mark size not applicable.');
      return;
    }

    try {
      await updateEquipment(equipmentId, values);
      toast.success(`${values.equipmentType === 'rental' ? 'Rental' : 'Sell'} equipment settings updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update rental settings.');
    }
  };

  const handleDeleteEquipment = async (equipmentId: string, equipmentName: string) => {
    if (!window.confirm(`Delete ${equipmentName} from equipment inventory?`)) return;

    try {
      await deleteEquipment(equipmentId);
      toast.success(`${equipmentName} deleted from equipment inventory.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete equipment.');
    }
  };

  const handleAddEquipment = async (event: React.FormEvent) => {
    event.preventDefault();
    const totalStock = Number(newEquipment.totalStock);
    const availableStock = Number(newEquipment.availableStock);
    const defaultRate = Number(newEquipment.defaultRate);
    const equipmentType = activeTab === 'rentals' ? 'rental' : 'sale';

    if (
      !newEquipment.name.trim() ||
      !newEquipment.totalStock.trim() ||
      !newEquipment.availableStock.trim() ||
      !newEquipment.defaultRate.trim() ||
      !Number.isInteger(totalStock) ||
      !Number.isInteger(availableStock) ||
      totalStock < 0 ||
      availableStock < 0 ||
      availableStock > totalStock ||
      !Number.isFinite(defaultRate) ||
      defaultRate < 0 ||
      (equipmentType === 'rental' &&
        newEquipment.availableForSale &&
        (!newEquipment.saleRate.trim() ||
          !Number.isFinite(Number(newEquipment.saleRate)) ||
          Number(newEquipment.saleRate) < 0)) ||
      (!newEquipment.sizeNotApplicable && newEquipment.sizes.length === 0)
    ) {
      toast.error('Enter a name, valid stock and price, and select available sizes or mark size not applicable.');
      return;
    }

    try {
      await addEquipment({
        name: newEquipment.name,
        equipmentType,
        sizes: newEquipment.sizeNotApplicable ? [] : newEquipment.sizes,
        defaultRate,
        saleRate: equipmentType === 'sale'
          ? defaultRate
          : (newEquipment.availableForSale ? Number(newEquipment.saleRate) : 0),
        availableForSale: equipmentType === 'sale' || newEquipment.availableForSale,
        defaultDeposit: 0,
        totalStock,
        availableStock,
      });
      setNewEquipment({
        name: '',
        totalStock: '',
        availableStock: '',
        defaultRate: '',
        saleRate: '',
        availableForSale: false,
        sizes: [],
        sizeNotApplicable: false,
      });
      toast.success(`${equipmentType === 'rental' ? 'Rental' : 'Sell'} equipment added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add equipment.');
    }
  };

  const handleExportJson = () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      club: settings.businessName,
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
    const safeBusinessName = settings.businessName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    a.download = `${safeBusinessName || 'Pool'}_Data_${new Date().toISOString().split('T')[0]}.json`;
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
          Manage club profile, alarms, rental and sell equipment, and demonstration data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] overflow-x-auto pb-px">
        {[
          { id: 'business', label: 'Business Profile', icon: Building2 },
          { id: 'pricing', label: 'Penalty Settings', icon: Tag },
          { id: 'timer', label: 'Timer & Alarms', icon: Bell },
          { id: 'lockers', label: 'Lockers', icon: LockKeyhole },
          { id: 'rentals', label: 'Rental Equipment', icon: Shirt },
          { id: 'sales', label: 'Sell Equipment', icon: Tag },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
          { id: 'data', label: 'Data Management', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              if (tab.id === 'rentals' || tab.id === 'sales') {
                setNewEquipment((current) => ({
                  ...current,
                  equipmentType: tab.id === 'rentals' ? 'rental' : 'sale',
                }));
              }
            }}
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
                {settings.businessName} Profile
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
                  Vector SVG Brandmark · {settings.businessName} Operations
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
                Penalty Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure when an overtime penalty starts and the flat amount charged
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="block text-xs font-bold text-slate-900">Apply Overtime Penalty</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Enable to charge a penalty after the configured overtime period
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.penaltyEnabled}
                onChange={(event) =>
                  setFormData({ ...formData, penaltyEnabled: event.target.checked })
                }
                className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Penalty Interval (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formData.penaltyAfterMinutes}
                  disabled={!formData.penaltyEnabled}
                  onChange={(e) => {
                    const value = normalizeNonNegativeInput(e.target.value, 0);
                    if (e.target.value !== '' && Number(e.target.value) < 0) {
                      toast.error('Penalty interval cannot be negative.');
                    }
                    setFormData({
                      ...formData,
                      penaltyAfterMinutes: parseInt(value, 10) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 text-base font-extrabold rounded-xl border border-slate-300 text-amber-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Charge the penalty once per completed interval of overtime
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Penalty Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.penaltyAmount}
                  disabled={!formData.penaltyEnabled}
                  onChange={(e) => {
                    const value = normalizeNonNegativeInput(e.target.value, 0);
                    if (e.target.value !== '' && Number(e.target.value) < 0) {
                      toast.error('Penalty amount cannot be negative.');
                    }
                    setFormData({
                      ...formData,
                      penaltyAmount: parseFloat(value) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 text-base font-extrabold rounded-xl border border-slate-300 text-amber-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  One flat penalty is added once at checkout
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Penalty Settings</span>
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

        {activeTab === 'lockers' && (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Locker System</h3>
              <p className="text-xs text-slate-500">
                Configure the total number of lockers available for customer allocation.
                Occupied lockers remain locked until the session checkout confirms key return.
              </p>
            </div>
            <label className="block max-w-xs text-xs font-bold text-slate-700">
              Number of lockers
              <input
                type="number"
                min={0}
                step={1}
                value={formData.lockerCount}
                onChange={(event) =>
                  {
                    const value = normalizeNonNegativeInput(event.target.value, 0);
                    if (event.target.value !== '' && Number(event.target.value) < 0) {
                      toast.error('Locker count cannot be negative.');
                    }
                    setFormData({ ...formData, lockerCount: Math.max(0, Number(value) || 0) });
                  }
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </label>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Locker Price by Package</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set a different locker price for each regular or monthly package.
                </p>
              </div>
              {packages.length === 0 ? (
                <p className="text-xs text-slate-500">No packages are available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
                    >
                      <span className="block mb-1">
                        {pkg.name}
                        <span className="ml-1 text-[10px] font-semibold text-slate-400">
                          ({pkg.packageKind === 'monthly' ? 'Monthly' : 'Regular'})
                        </span>
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={lockerPackagePrices[pkg.id] ?? '0'}
                          onChange={(event) => {
                            const value = normalizeNonNegativeInput(event.target.value, 0);
                            if (event.target.value !== '' && Number(event.target.value) < 0) {
                              toast.error(`Locker price for ${pkg.name} cannot be negative.`);
                            }
                            setLockerPackagePrices((current) => ({
                              ...current,
                              [pkg.id]: value,
                            }));
                          }
                          }
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087FA5] text-white text-xs font-bold hover:bg-[#066382]"
            >
              <Save className="w-4 h-4" />
              Save Locker Settings
            </button>
          </form>
        )}

        {/* 5. RENTAL SETTINGS */}
        {(activeTab === 'rentals' || activeTab === 'sales') && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {activeTab === 'rentals' ? 'Rental Equipment Settings' : 'Sell Equipment Settings'}
              </h3>
              <p className="text-xs text-slate-500">
                Manage item sizes, stock, and {activeTab === 'rentals' ? 'rental fee' : 'sale price'}.
              </p>
            </div>

            <form
              onSubmit={handleAddEquipment}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50"
            >
              <label className="text-xs font-semibold text-slate-700">
                Equipment name *
                <input
                  required
                  value={newEquipment.name}
                  onChange={(event) => setNewEquipment({ ...newEquipment, name: event.target.value })}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-normal"
                  placeholder="e.g. Swimming goggles"
                />
              </label>
              <fieldset className="sm:col-span-2 text-xs font-semibold text-slate-700">
                <legend>Available sizes *</legend>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {EQUIPMENT_SIZE_OPTIONS.map((size) => (
                    <label key={size} className="inline-flex items-center gap-1.5 font-normal">
                      <input
                        type="checkbox"
                        checked={newEquipment.sizes.includes(size)}
                        disabled={newEquipment.sizeNotApplicable}
                        onChange={(event) =>
                          setNewEquipment((current) => ({
                            ...current,
                            sizes: event.target.checked
                              ? [...current.sizes, size]
                              : current.sizes.filter((item) => item !== size),
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#087FA5] focus:ring-[#087FA5]"
                      />
                      {size}
                    </label>
                  ))}
                  <label className="inline-flex items-center gap-1.5 font-semibold">
                    <input
                      type="checkbox"
                      checked={newEquipment.sizeNotApplicable}
                      onChange={(event) =>
                        setNewEquipment((current) => ({
                          ...current,
                          sizeNotApplicable: event.target.checked,
                          sizes: event.target.checked ? [] : current.sizes,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#087FA5] focus:ring-[#087FA5]"
                    />
                    Size not applicable
                  </label>
                </div>
              </fieldset>
              <label className="text-xs font-semibold text-slate-700">
                Total stock *
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={newEquipment.totalStock}
                  onChange={(event) => {
                    const value = normalizeNonNegativeInput(event.target.value, 0);
                    if (event.target.value !== '' && Number(event.target.value) < 0) toast.error('Total stock cannot be negative.');
                    setNewEquipment({ ...newEquipment, totalStock: value });
                  }}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Available stock *
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={newEquipment.availableStock}
                  onChange={(event) => {
                    const value = normalizeNonNegativeInput(event.target.value, 0);
                    if (event.target.value !== '' && Number(event.target.value) < 0) toast.error('Available stock cannot be negative.');
                    setNewEquipment({ ...newEquipment, availableStock: value });
                  }}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-normal"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                {activeTab === 'rentals' ? 'Rental fee' : 'Sale price'} *
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={newEquipment.defaultRate}
                  onChange={(event) => {
                    const value = normalizeNonNegativeInput(event.target.value, 0);
                    if (event.target.value !== '' && Number(event.target.value) < 0) toast.error('Price cannot be negative.');
                    setNewEquipment({ ...newEquipment, defaultRate: value });
                  }}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-normal"
                />
              </label>
              {activeTab === 'rentals' && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newEquipment.availableForSale}
                    onChange={(event) =>
                      setNewEquipment((current) => ({
                        ...current,
                        availableForSale: event.target.checked,
                        saleRate: event.target.checked ? current.saleRate : '',
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#087FA5]"
                  />
                  Also available for sale
                </label>
              )}
              {activeTab === 'rentals' && newEquipment.availableForSale && (
                <label className="text-xs font-semibold text-slate-700">
                  Sale price *
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={newEquipment.saleRate}
                    onChange={(event) => {
                      const value = normalizeNonNegativeInput(event.target.value, 0);
                      if (event.target.value !== '' && Number(event.target.value) < 0) toast.error('Sale price cannot be negative.');
                      setNewEquipment({ ...newEquipment, saleRate: value });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-normal"
                  />
                </label>
              )}
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087FA5] text-white text-xs font-bold hover:bg-[#066382]"
                >
                  <Plus className="w-4 h-4" />
                  Add {activeTab === 'rentals' ? 'Rental' : 'Sell'} Equipment
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Equipment Type</th>
                    <th className="py-2.5 px-3">Available Sizes</th>
                    <th className="py-2.5 px-3">Total Stock</th>
                    <th className="py-2.5 px-3">Available Stock</th>
                    <th className="py-2.5 px-3">{activeTab === 'rentals' ? 'Rental Fee' : 'Sale Price'}</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipment.filter((eq) =>
                    activeTab === 'rentals'
                      ? eq.equipmentType === 'rental'
                      : eq.equipmentType === 'sale' || eq.availableForSale
                  ).map((eq) => (
                    <tr key={eq.id}>
                      {(() => {
                        const draft = rentalDrafts[eq.id] || {
                          name: eq.name,
                          totalStock: String(eq.totalStock),
                          availableStock: String(eq.availableStock),
                          defaultRate: String(eq.defaultRate),
                          saleRate: String(eq.saleRate ?? eq.defaultRate),
                          availableForSale: eq.availableForSale ?? eq.equipmentType === 'sale',
                          sizes: normalizeEquipmentSizes(eq.sizes),
                          sizeNotApplicable: normalizeEquipmentSizes(eq.sizes).length === 0,
                        };
                        const updateDraft = (
                          field: 'name' | 'totalStock' | 'availableStock' | 'defaultRate' | 'saleRate',
                          value: string
                        ) => {
                          const normalizedValue = field === 'name'
                            ? value
                            : normalizeNonNegativeInput(value, 0);
                          if (
                            field !== 'name' &&
                            value !== '' &&
                            Number(value) < 0
                          ) {
                            toast.error(`${eq.name} values cannot be negative.`);
                          }
                          setRentalDrafts((current) => ({
                            ...current,
                            [eq.id]: { ...draft, [field]: normalizedValue },
                          }));
                        };
                        const updateSize = (size: string, checked: boolean) =>
                          setRentalDrafts((current) => {
                            const currentDraft = current[eq.id] || draft;
                            const selectedSizes = new Set(currentDraft.sizes);
                            if (checked) selectedSizes.add(size);
                            else selectedSizes.delete(size);

                            return {
                              ...current,
                              [eq.id]: {
                                ...currentDraft,
                                sizeNotApplicable: false,
                                sizes: EQUIPMENT_SIZE_OPTIONS.filter((item) => selectedSizes.has(item)),
                              },
                            };
                          });
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
                              {eq.equipmentType === 'rental' ? (
                                <div className="space-y-1">
                                  <span className="block">Rental</span>
                                  <label className="inline-flex items-center gap-1 whitespace-nowrap text-[11px]">
                                    <input
                                      type="checkbox"
                                      checked={draft.availableForSale}
                                      onChange={(event) =>
                                        setRentalDrafts((current) => ({
                                          ...current,
                                          [eq.id]: {
                                            ...draft,
                                            availableForSale: event.target.checked,
                                          },
                                        }))
                                      }
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#087FA5]"
                                      aria-label={`${eq.name} also available for sale`}
                                    />
                                    Sell also
                                  </label>
                                </div>
                              ) : (
                                <span>{eq.availableForSale ? 'Rental + Sell' : 'Sell'}</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="grid w-44 grid-cols-3 gap-x-1 gap-y-1">
                                {EQUIPMENT_SIZE_OPTIONS.map((size) => (
                                  <label key={size} className="inline-flex items-center gap-1 whitespace-nowrap font-normal">
                                    <input
                                      type="checkbox"
                                      checked={draft.sizes.includes(size)}
                                      disabled={draft.sizeNotApplicable}
                                      onChange={(event) => updateSize(size, event.target.checked)}
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#087FA5]"
                                      aria-label={`${eq.name} size ${size} available`}
                                    />
                                    {size}
                                  </label>
                                ))}
                                <label className="inline-flex items-center gap-1 whitespace-nowrap font-semibold">
                                  <input
                                    type="checkbox"
                                    checked={draft.sizeNotApplicable}
                                    onChange={(event) =>
                                      setRentalDrafts((current) => {
                                        const currentDraft = current[eq.id] || draft;
                                        return {
                                          ...current,
                                          [eq.id]: {
                                            ...currentDraft,
                                            sizeNotApplicable: event.target.checked,
                                            sizes: event.target.checked ? [] : currentDraft.sizes,
                                          },
                                        };
                                      })
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#087FA5]"
                                    aria-label={`${eq.name} size not applicable`}
                                  />
                                  N/A
                                </label>
                              </div>
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
                              <div className="flex flex-col gap-1.5">
                                {activeTab === 'rentals' && (
                                  <label className="block whitespace-nowrap text-[10px] text-slate-500">
                                    Rental price
                                    <input
                                      aria-label={`${eq.name} rental price`}
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={draft.defaultRate}
                                      onChange={(event) => updateDraft('defaultRate', event.target.value)}
                                      className={`${inputClass} mt-0.5 block`}
                                    />
                                  </label>
                                )}
                                {(activeTab === 'sales' || draft.availableForSale) && (
                                  <label className="block whitespace-nowrap text-[10px] text-slate-500">
                                    Sell price
                                  <input
                                    aria-label={`${eq.name} sell price`}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={draft.saleRate}
                                    onChange={(event) => updateDraft('saleRate', event.target.value)}
                                      className={`${inputClass} mt-0.5 block`}
                                  />
                                </label>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveRental(eq.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#087FA5] text-white text-xs font-bold hover:bg-[#066382]"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                  aria-label={`Delete ${eq.name}`}
                                  title={`Delete ${eq.name}`}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                  {equipment.filter((eq) =>
                    activeTab === 'rentals'
                      ? eq.equipmentType === 'rental'
                      : eq.equipmentType === 'sale' || eq.availableForSale
                  ).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No {activeTab === 'rentals' ? 'rental' : 'sell'} equipment configured.
                      </td>
                    </tr>
                  )}
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
                  <p className="text-[11px] text-amber-700">
                    Existing Supabase projects must run frontend/supabase/equipment_inventory_migration.sql once before using the new equipment inventory.
                  </p>
                </div>
              </div>

              {/* 4 Dedicated Supabase Tables */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Database Tables:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
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

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 font-mono">equipment</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">Table</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Inventory, rental or sale type, rates, and available stock.
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

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tag, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';

export const PackageModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedPackage = usePoolStore((state) => state.selectedPackage);
  const selectedPackageKind = usePoolStore((state) => state.selectedPackageKind);
  const closeModal = usePoolStore((state) => state.closeModal);
  const addPackage = usePoolStore((state) => state.addPackage);
  const updatePackage = usePoolStore((state) => state.updatePackage);

  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(100);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [packageKind, setPackageKind] = useState<'regular' | 'monthly'>('regular');
  const [durationMonths, setDurationMonths] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedPackage) {
      setName(selectedPackage.name);
      setDurationMinutes(selectedPackage.durationMinutes);
      setPrice(selectedPackage.price);
      setDescription(selectedPackage.description);
      setIsActive(selectedPackage.isActive);
      setPackageKind(selectedPackage.packageKind || 'regular');
      setDurationMonths(selectedPackage.durationMonths || 1);
    } else {
      setName('');
      setDurationMinutes(selectedPackageKind === 'monthly' ? 43200 : 60);
      setPrice(100);
      setDescription('');
      setIsActive(true);
      setPackageKind(selectedPackageKind || 'regular');
      setDurationMonths(1);
    }
  }, [selectedPackage, selectedPackageKind]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Package name is required.');
      return;
    }
    if (
      (packageKind === 'monthly' && durationMonths <= 0) ||
      (packageKind !== 'monthly' && durationMinutes <= 0) ||
      price < 0
    ) {
      toast.error('Duration and price must be valid positive values.');
      return;
    }

    setSaving(true);
    try {
      if (selectedPackage) {
        await updatePackage(selectedPackage.id, {
          name,
          price,
          description,
          isActive,
          packageKind,
          durationMonths: packageKind === 'monthly' ? durationMonths : undefined,
          durationMinutes: packageKind === 'monthly'
            ? durationMonths * 30 * 24 * 60
            : durationMinutes,
        });
        toast.success(`Package "${name}" updated!`);
      } else {
        await addPackage({
          name,
          price,
          description,
          isActive,
          packageKind,
          durationMonths: packageKind === 'monthly' ? durationMonths : undefined,
          durationMinutes: packageKind === 'monthly'
            ? durationMonths * 30 * 24 * 60
            : durationMinutes,
        });
        toast.success(`New package "${name}" created!`);
      }

      closeModal();
    } catch (err: any) {
      console.error('Package save failed:', err);
      toast.error(err?.message || 'Failed to save package to Supabase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'package_modal'}
      onClose={closeModal}
      title={selectedPackage ? 'Edit Swimming Package' : 'Create Pricing Package'}
      subtitle="Configure duration, admission pricing and availability"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Package Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Early Bird Splash (45 Mins)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {packageKind === 'monthly' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Months) *
              </label>
              <input
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-bold text-[#087FA5] rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Package Category *
          </label>
          <select
            value={packageKind}
            onChange={(e) => setPackageKind(e.target.value as 'regular' | 'monthly')}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
          >
            <option value="regular">Regular Package</option>
            <option value="monthly">Monthly Package</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Brief notes about lane access, age limits, or perks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#087FA5]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="pkgActiveCheck"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#087FA5] focus:ring-[#087FA5]"
          />
          <label htmlFor="pkgActiveCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
            Active for public booking & counter check-in
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {saving ? 'Saving...' : selectedPackage ? 'Save Changes' : 'Create Package'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

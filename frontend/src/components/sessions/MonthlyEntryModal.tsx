import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency, normalizeNonNegativeInput } from '../../utils';

export const MonthlyEntryModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const selectedPackage = usePoolStore((state) => state.selectedPackage);
  const closeModal = usePoolStore((state) => state.closeModal);
  const allPackages = usePoolStore((state) => state.packages);
  const packages = useMemo(
    () =>
      allPackages.filter(
        (pkg) => pkg.isActive && pkg.packageKind === 'monthly'
      ),
    [allPackages]
  );
  const createMonthlyMembership = usePoolStore((state) => state.createMonthlyMembership);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAge, setCustomerAge] = useState('');
  const [packageId, setPackageId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPkg = packages.find((pkg) => pkg.id === packageId);

  useEffect(() => {
    if (activeModal !== 'monthly_entry') return;

    const initialPackage = selectedPackage?.packageKind === 'monthly'
      ? selectedPackage
      : packages[0];
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAge('');
    setPackageId(initialPackage?.id || '');
    setPaidAmount(initialPackage?.price || 0);
    setPaymentStatus('paid');
    setPaymentMethod('cash');
    setNotes('');
  }, [activeModal, selectedPackage, packages]);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaidAmount(selectedPkg?.price || 0);
    } else if (paymentStatus === 'unpaid') {
      setPaidAmount(0);
    }
  }, [paymentStatus, selectedPkg]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (customerName.trim().length < 2) {
      toast.error('Customer name must be at least 2 characters.');
      return;
    }
    if (!/^\d{10}$/.test(customerPhone)) {
      toast.error('Phone number should be 10 digits.');
      return;
    }
    if (!selectedPkg) {
      toast.error('Select a monthly package.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date();
      const expiryDate = new Date(
        startDate.getTime() + (selectedPkg.durationMonths || 1) * 30 * 24 * 60 * 60 * 1000
      );
      await createMonthlyMembership({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAge: customerAge ? Number(customerAge) : undefined,
        notes: notes.trim() || undefined,
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        durationMonths: selectedPkg.durationMonths || 1,
        price: selectedPkg.price,
        paymentStatus,
        paidAmount,
        paymentMethod,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      });
      toast.success(`${customerName.trim()} registered for ${selectedPkg.name}.`);
      closeModal();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to register monthly package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'monthly_entry'}
      onClose={closeModal}
      title="Monthly Package Registration"
      subtitle="Register a customer for a monthly membership"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                inputMode="numeric"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="9845011223"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Age
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={customerAge}
            onChange={(event) => {
              const value = normalizeNonNegativeInput(event.target.value, 1);
              if (event.target.value !== '' && Number(event.target.value) < 1) {
                toast.error('Age must be 1 or greater.');
              }
              setCustomerAge(value);
            }}
            placeholder="Optional"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Select Monthly Package *
          </label>
          {packages.length === 0 ? (
            <p className="text-xs text-amber-700">
              No active monthly packages are available. Create one from the Monthly page.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageId(pkg.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    packageId === pkg.id
                      ? 'border-[#087FA5] bg-[#087FA5]/10 ring-2 ring-[#087FA5]/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#087FA5]" />
                    <span className="font-bold text-sm text-slate-900">{pkg.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {pkg.durationMonths || 1} {(pkg.durationMonths || 1) === 1 ? 'month' : 'months'}
                  </p>
                  <p className="text-lg font-extrabold text-[#087FA5] mt-2">
                    {formatCurrency(pkg.price)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as 'paid' | 'partial' | 'unpaid')}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
            >
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paid Amount
            </label>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(event) => {
                const value = normalizeNonNegativeInput(event.target.value, 0);
                if (event.target.value !== '' && Number(event.target.value) < 0) {
                  toast.error('Paid amount cannot be negative.');
                }
                setPaidAmount(Number(value) || 0);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'online')}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional membership notes"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || packages.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl disabled:opacity-70"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Register Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

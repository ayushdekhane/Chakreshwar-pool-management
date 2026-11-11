import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, Phone, Clock, Shirt, PlusCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';

const schema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Enter a valid 10-digit phone number'),
  packageId: z.string().min(1, 'Please select a package'),
  customDuration: z.union([z.number().min(10).max(360), z.nan()]).optional(),
  customAmount: z.union([z.number().min(0), z.nan()]).optional(),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
  paidAmount: z.number().min(0),
  paymentMethod: z.enum(['cash', 'online']),
  paymentRef: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type SelectedAccessory = { quantity: number; size: string };

export const IndividualEntryModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const closeModal = usePoolStore((state) => state.closeModal);
  const packages = usePoolStore((state) => state.packages.filter((p) => p.isActive));
  const equipment = usePoolStore((state) => state.equipment);
  const createIndividualSession = usePoolStore((state) => state.createIndividualSession);

  const [isCustomPkg, setIsCustomPkg] = useState(false);
  const [selectedAccessories, setSelectedAccessories] = useState<
    Record<string, SelectedAccessory>
  >({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      packageId: packages[0]?.id || 'pkg-60',
      customDuration: undefined,
      customAmount: undefined,
      paymentStatus: 'paid',
      paidAmount: packages[0]?.price || 100,
      paymentMethod: 'cash',
      paymentRef: '',
    },
  });

  const selectedPkgId = watch('packageId');
  const watchCustomDuration = watch('customDuration');
  const watchCustomAmount = watch('customAmount');
  const watchPaymentStatus = watch('paymentStatus');

  // Selected package
  const selectedPkg = packages.find((p) => p.id === selectedPkgId);

  // Compute bill
  const swimCharge = isCustomPkg ? (watchCustomAmount || 0) : (selectedPkg?.price || 100);
  const rentalCharge = equipment.reduce((total, item) => {
    const rental = selectedAccessories[item.id];
    return total + item.defaultRate * (rental?.quantity || 0);
  }, 0);
  const totalBill = swimCharge + rentalCharge;

  // Auto update paid amount when bill changes if full payment is selected
  useEffect(() => {
    if (watchPaymentStatus === 'paid') {
      setValue('paidAmount', totalBill);
    } else if (watchPaymentStatus === 'unpaid') {
      setValue('paidAmount', 0);
    }
  }, [totalBill, watchPaymentStatus, setValue]);

  const onSubmit = async (data: FormData) => {
    const rentalItems = equipment
      .filter((item) => selectedAccessories[item.id])
      .map((item) => ({
        equipmentId: item.id,
        size: selectedAccessories[item.id].size,
        quantity: selectedAccessories[item.id].quantity,
        pricePerItem: item.defaultRate,
        deposit: item.defaultDeposit * selectedAccessories[item.id].quantity,
      }));

    if (rentalItems.some((rental) => {
      const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
      return (
        !Number.isInteger(rental.quantity) ||
        rental.quantity < 1 ||
        rental.quantity > (item?.availableStock || 0)
      );
    })) {
      toast.error('The selected accessory quantity exceeds available stock.');
      return;
    }

    try {
      const session = await createIndividualSession({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        packageId: data.packageId,
        customDuration: isCustomPkg ? data.customDuration : undefined,
        customAmount: isCustomPkg ? data.customAmount : undefined,
        paymentStatus: data.paymentStatus,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef,
        rentals: rentalItems,
      });

      toast.success(`Check-in successful for ${session.customerName}!`, {
        description: `Session #${session.id} active. Timer started.`,
      });
      reset();
      setSelectedAccessories({});
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create session. Please check fields.');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'individual_entry'}
      onClose={closeModal}
      title="Individual Swimmer Check-In"
      subtitle="Issue pool entry pass and start the live duration timer"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Guest Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Vikram Aditya"
                {...register('customerName')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
              />
            </div>
            {errors.customerName && (
              <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="+91 98450 11223"
                {...register('customerPhone')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087FA5]"
              />
            </div>
            {errors.customerPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.customerPhone.message}</p>
            )}
          </div>
        </div>

        {/* Swimming Package Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Swimming Package
            </label>
            <button
              type="button"
              onClick={() => setIsCustomPkg(!isCustomPkg)}
              className="text-xs font-bold text-[#087FA5] hover:underline"
            >
              {isCustomPkg ? '← Choose Standard Package' : '+ Custom Duration/Rate'}
            </button>
          </div>

          {!isCustomPkg ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setValue('packageId', pkg.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#087FA5] bg-[#087FA5]/10 ring-2 ring-[#087FA5]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {pkg.name}
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-sm font-extrabold text-[#087FA5]">
                        {formatCurrency(pkg.price)}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {pkg.durationMinutes}m
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Custom Duration (Minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  {...register('customDuration', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Custom Charge (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  {...register('customAmount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Equipment Rental Add-on */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-[#087FA5]" /> Add Equipment Rentals
            </span>
            <span className="text-xs font-bold text-[#087FA5]">
              +{formatCurrency(rentalCharge)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            {equipment.map((item) => {
              const rental = selectedAccessories[item.id];
              return (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col items-stretch gap-2 rounded-lg bg-white border border-slate-200 p-2.5"
                >
                  <label className="flex min-w-0 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(rental)}
                      disabled={item.availableStock < 1}
                      onChange={(event) => {
                        setSelectedAccessories((current) => {
                          if (event.target.checked) {
                            return {
                              ...current,
                              [item.id]: {
                                quantity: 1,
                                size: item.sizes[0] || 'Standard',
                              },
                            };
                          }
                          const next = { ...current };
                          delete next[item.id];
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded text-[#087FA5] focus:ring-[#087FA5]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Price: {formatCurrency(item.defaultRate)} each · Available stock: {item.availableStock}
                      </span>
                    </span>
                  </label>
                  {rental && (
                    <div className="flex items-center gap-2">
                      {item.sizes.length > 1 && (
                        <select
                          aria-label={`${item.name} size`}
                          value={rental.size}
                          onChange={(event) =>
                            setSelectedAccessories((current) => ({
                              ...current,
                              [item.id]: { ...current[item.id], size: event.target.value },
                            }))
                          }
                          className="min-w-0 flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          {item.sizes.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      )}
                      <input
                        aria-label={`${item.name} quantity`}
                        type="number"
                        min={1}
                        max={item.availableStock}
                        step={1}
                        value={rental.quantity}
                        onChange={(event) => {
                          const quantity = Number(event.target.value);
                          setSelectedAccessories((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
                            },
                          }));
                        }}
                        className="w-16 shrink-0 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Collection & Summary */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
            <span>Swimming Charge: {formatCurrency(swimCharge)}</span>
            {rentalCharge > 0 && <span>Rental: {formatCurrency(rentalCharge)}</span>}
            <span className="text-sm font-bold text-[#EFB33A]">
              Total Bill: {formatCurrency(totalBill)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                {...register('paymentStatus')}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-[#087FA5]"
              >
                <option value="paid">Pay Now (Full Payment - {formatCurrency(totalBill)})</option>
                <option value="unpaid">🏊 Swim First, Pay on Exit</option>
                <option value="partial">Partial Advance Payment</option>
              </select>
            </div>

            {watchPaymentStatus !== 'unpaid' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    {...register('paidAmount', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 flex items-center p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                🏊‍♂️ Swimmer will swim first. Total ₹{totalBill} will be checked & collected upon leaving the pool.
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#087FA5] hover:bg-[#066382] rounded-xl shadow-md shadow-[#087FA5]/25 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Confirm & Start Swimming</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

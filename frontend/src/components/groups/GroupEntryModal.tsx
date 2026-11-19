import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Phone, User, Clock, CheckCircle2, LockKeyhole } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LockerSelector } from '../common/LockerSelector';
import { usePoolStore } from '../../store/usePoolStore';
import { formatCurrency } from '../../utils';

const schema = z.object({
  leaderName: z.string().trim().min(2, 'Leader name required'),
  leaderPhone: z.string().regex(/^\d{10}$/, 'Phone number should be 10 digits'),
  packageId: z.string().min(1, 'Please select a package'),
  customDuration: z.union([z.number().min(15).max(360), z.nan()]).optional(),
  memberCount: z.number().int().min(2, 'At least 2 swimmers are required'),
  totalPrice: z.number().min(0),
  initialPayment: z.number().min(0),
  paymentMethod: z.enum(['cash', 'online']),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type SelectedAccessory = {
  equipmentId: string;
  transactionType: 'rental' | 'sale';
  quantity: number;
  size?: string;
};

const getAccessoryKey = (equipmentId: string, type: 'rental' | 'sale') =>
  `${equipmentId}:${type}`;

export const GroupEntryModal: React.FC = () => {
  const activeModal = usePoolStore((state) => state.activeModal);
  const closeModal = usePoolStore((state) => state.closeModal);
  const packages = usePoolStore((state) => state.packages.filter((p) => p.isActive));
  const equipment = usePoolStore((state) => state.equipment);
  const sessions = usePoolStore((state) => state.sessions);
  const settings = usePoolStore((state) => state.settings);
  const createGroupSession = usePoolStore((state) => state.createGroupSession);
  const [selectedAccessories, setSelectedAccessories] = useState<
    Record<string, SelectedAccessory>
  >({});
  const [equipmentType, setEquipmentType] = useState<'rental' | 'sale'>('rental');
  const [wantsLocker, setWantsLocker] = useState(false);
  const [selectedLockers, setSelectedLockers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const defaultPkg = packages[0];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaderName: '',
      leaderPhone: '',
      packageId: defaultPkg?.id || '',
      customDuration: undefined,
      memberCount: 2,
      totalPrice: (defaultPkg?.price || 0) * 2,
      initialPayment: (defaultPkg?.price || 0) * 2,
      paymentMethod: 'cash',
      paymentRef: '',
      notes: '',
    },
  });

  const watchPkgId = watch('packageId');
  const memberCount = watch('memberCount');
  const selectedPkg = packages.find((p) => p.id === watchPkgId);

  const calculatedTotal =
    Number.isInteger(memberCount) && memberCount >= 2
      ? (selectedPkg?.price || 0) * memberCount
      : 0;
  const equipmentTotal = Object.values(selectedAccessories).reduce((total, selection) => {
    const item = equipment.find((candidate) => candidate.id === selection.equipmentId);
    const rate = selection.transactionType === 'sale'
      ? item?.saleRate ?? item?.defaultRate ?? 0
      : item?.defaultRate ?? 0;
    return total + rate * selection.quantity;
  }, 0);
  const groupTotal = calculatedTotal + equipmentTotal;
  const previousGroupTotal = useRef(groupTotal);

  useEffect(() => {
    if (packages.length > 0 && !packages.some((pkg) => pkg.id === getValues('packageId'))) {
      const nextPackage = packages[0];
      const nextTotal = nextPackage.price * getValues('memberCount');
      setValue('packageId', nextPackage.id);
      setValue('totalPrice', nextTotal);
      setValue('initialPayment', nextTotal);
    }
  }, [getValues, packages, setValue]);

  useEffect(() => {
    const initialPayment = getValues('initialPayment');
    setValue('totalPrice', calculatedTotal);
    if (initialPayment === previousGroupTotal.current) {
      setValue('initialPayment', groupTotal);
    }
    previousGroupTotal.current = groupTotal;
  }, [calculatedTotal, getValues, groupTotal, equipmentTotal, setValue]);

  useEffect(() => {
    if (activeModal === 'group_entry') {
      setSelectedAccessories({});
      setEquipmentType('rental');
      setWantsLocker(false);
      setSelectedLockers([]);
    }
  }, [activeModal]);

  const onSubmit = async (data: FormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (!selectedPkg) {
      toast.error('Create and activate a package before registering a group.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }
    if (wantsLocker && selectedLockers.length === 0) {
      toast.error('Select at least one available locker or turn off the locker option.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const rentalItems = Object.values(selectedAccessories).map((selection) => {
      const item = equipment.find((candidate) => candidate.id === selection.equipmentId);
      return {
        equipmentId: selection.equipmentId,
        transactionType: selection.transactionType,
        size: selection.size,
        quantity: selection.quantity,
        pricePerItem: selection.transactionType === 'sale'
          ? item?.saleRate ?? item?.defaultRate ?? 0
          : item?.defaultRate ?? 0,
      };
    });

    if (rentalItems.some((rental) => {
      const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
      return !Number.isInteger(rental.quantity) || rental.quantity > (item?.availableStock || 0);
    })) {
      toast.error('The selected accessory quantity exceeds available stock.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const quantityByEquipment = rentalItems.reduce<Record<string, number>>((totals, rental) => {
      totals[rental.equipmentId] = (totals[rental.equipmentId] || 0) + rental.quantity;
      return totals;
    }, {});
    const exceedsCombinedStock = Object.entries(quantityByEquipment).some(([equipmentId, quantity]) => {
      const item = equipment.find((candidate) => candidate.id === equipmentId);
      return quantity > (item?.availableStock || 0);
    });
    if (exceedsCombinedStock) {
      toast.error('The combined rental and sale quantity exceeds available stock.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      const session = await createGroupSession({
        leaderName: data.leaderName,
        leaderPhone: data.leaderPhone,
        memberCount: data.memberCount,
        packageId: data.packageId,
        customDuration: data.customDuration,
        totalPrice: data.totalPrice,
        initialPayment: data.initialPayment,
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef,
        notes: data.notes,
        rentals: rentalItems,
        lockerNumbers: wantsLocker ? selectedLockers : [],
      });

      toast.success(`Group for ${session.customerName} checked in!`, {
        description: `${session.peopleCount} members under shared ${session.durationMinutes}m timer.`,
      });
      reset();
      setSelectedAccessories({});
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create group session.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'group_entry'}
      onClose={closeModal}
      title="Group Entry Check-In"
      subtitle="Register multiple swimmers under a single leader with a synchronized group timer"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsLocker}
              onChange={(event) => {
                setWantsLocker(event.target.checked);
                if (!event.target.checked) setSelectedLockers([]);
              }}
              className="w-4 h-4 rounded accent-[#70218C]"
            />
            <LockKeyhole className="w-4 h-4 text-[#70218C]" />
            Group wants locker(s)
          </label>
          {wantsLocker && (
            <div className="mt-3">
              <LockerSelector
                sessions={sessions}
                settings={settings}
                selectedLockers={selectedLockers}
                onChange={setSelectedLockers}
                accentClassName="text-[#70218C]"
              />
            </div>
          )}
        </div>
        {/* Group & Leader Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leader Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Rajesh Sharma"
                {...register('leaderName')}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
            </div>
            {errors.leaderName && (
              <p className="text-xs text-red-500 mt-1">{errors.leaderName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leader Phone *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="9900244321"
                {...register('leaderPhone')}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
            </div>
            {errors.leaderPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.leaderPhone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Number of Swimmers *
          </label>
          <input
            type="number"
            min={2}
            step={1}
            {...register('memberCount', { valueAsNumber: true })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
          />
          {errors.memberCount && (
            <p className="text-xs text-red-500 mt-1">{errors.memberCount.message}</p>
          )}
        </div>

        {/* Group Equipment */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-700">Add Equipment for the Group</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Optional. Select equipment and the quantity.
              </p>
            </div>
            <span className="text-xs font-bold text-[#70218C]">
              Equipment total: {formatCurrency(equipmentTotal)}
            </span>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
  Equipment type
  <select
    value={equipmentType}
    onChange={(event) =>
      setEquipmentType(event.target.value as 'rental' | 'sale')
    }
    className="ml-3 px-2 pr-15 py-2 rounded-lg border border-slate-300 bg-white"
  >
    <option value="rental">Rental equipment</option>
    <option value="sale">Sell equipment</option>
  </select>
</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {equipment
              .filter((item) =>
                equipmentType === 'rental'
                  ? item.equipmentType === 'rental'
                  : item.equipmentType === 'sale' || item.availableForSale
              )
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((item) => {
              const accessoryKey = getAccessoryKey(item.id, equipmentType);
              const selectedAccessory = selectedAccessories[accessoryKey];
              const quantity = selectedAccessory?.quantity || 0;
              const isSelected = quantity > 0;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${
                    isSelected ? 'border-[#70218C] bg-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="flex min-w-0 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={item.availableStock < 1}
                      onChange={(event) => {
                        setSelectedAccessories((current) => {
                          if (event.target.checked) {
                            return {
                              ...current,
                              [accessoryKey]: {
                                equipmentId: item.id,
                                transactionType: equipmentType,
                                quantity: 1,
                                size: item.sizes[0],
                              },
                            };
                          }
                          const next = { ...current };
                          delete next[accessoryKey];
                          return next;
                        });
                      }}
                      className="accent-[#70218C]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {equipmentType === 'rental' ? 'Rental fee' : 'Sale price'}: {formatCurrency(equipmentType === 'sale' ? item.saleRate ?? item.defaultRate : item.defaultRate)} each · Available stock: {item.availableStock}
                      </span>
                    </span>
                  </label>
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {item.sizes.length > 1 && (
                        <select
                          aria-label={`${item.name} size`}
                          value={selectedAccessory.size}
                          onChange={(event) =>
                            setSelectedAccessories((current) => ({
                              ...current,
                              [accessoryKey]: { ...current[accessoryKey], size: event.target.value },
                            }))
                          }
                          className="max-w-24 px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          {item.sizes.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      )}
                      {item.sizes.length === 1 && (
                        <span className="text-xs text-slate-600">{item.sizes[0]}</span>
                      )}
                      {item.sizes.length === 0 && (
                        <span className="text-xs text-slate-500">N/A</span>
                      )}
                      <input
                        aria-label={`${item.name} quantity`}
                        type="number"
                        min={1}
                        max={item.availableStock}
                        step={1}
                        value={quantity}
                        onChange={(event) => {
                          const nextQuantity = Number(event.target.value);
                          setSelectedAccessories((current) => ({
                            ...current,
                            [accessoryKey]: {
                              ...current[accessoryKey],
                              quantity: Number.isInteger(nextQuantity) && nextQuantity > 0
                                ? nextQuantity
                                : 1,
                            },
                          }));
                        }}
                        className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold"
                      />
                    </div>
                  )}
                </div>
              );
              })}
          </div>
        </div>

        {/* Package Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Shared Swimming Package ({selectedPkg?.durationMinutes ?? '—'} mins per member)
          </label>
          {packages.length === 0 && (
            <p className="mb-2 text-xs text-amber-700">
              No active packages are available. Create and activate one in Packages first.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setValue('packageId', pkg.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  watchPkgId === pkg.id
                    ? 'border-[#70218C] bg-[#70218C]/10 ring-2 ring-[#70218C]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 truncate">{pkg.name}</div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-extrabold text-[#70218C]">
                    {formatCurrency(pkg.price)} / head
                  </span>
                  <span className="text-[11px] text-slate-500">{pkg.durationMinutes}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing & Group Payment */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
            <span>
              {memberCount} Members × {formatCurrency(selectedPkg?.price || 0)}
            </span>
            <span className="text-sm font-extrabold text-[#EFB33A]">
              Group Total: {formatCurrency(groupTotal)}
            </span>
          </div>

          {/* Quick Pay Choice: Pay Now vs Swim First */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValue('initialPayment', groupTotal)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                watch('initialPayment') > 0
                  ? 'bg-[#70218C] text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pay Now ({formatCurrency(groupTotal)})
            </button>
            <button
              type="button"
              onClick={() => setValue('initialPayment', 0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                watch('initialPayment') === 0
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🏊 Swim First, Pay on Exit (₹0 now)
            </button>
          </div>

          {watch('initialPayment') === 0 ? (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              🏊‍♂️ Group will swim first. Total {formatCurrency(groupTotal)} will be checked & collected upon leaving the pool.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Payment (₹)
                </label>
                <input
                  type="number"
                  {...register('initialPayment', { valueAsNumber: true })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction Ref / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Desk Receipt"
                  {...register('paymentRef')}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedPkg || isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#70218C] hover:bg-[#58186f] rounded-xl shadow-md shadow-[#70218C]/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Group Session...' : 'Confirm & Start Group Session'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

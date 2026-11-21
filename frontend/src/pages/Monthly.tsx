import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Edit2, IndianRupee, Plus, User, Phone, CheckCircle2, Trash2, Eye, Clock, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { usePoolStore } from '../store/usePoolStore';
import { formatCurrency, normalizeNonNegativeInput } from '../utils';
import { Package } from '../types';

export const Monthly: React.FC = () => {
  const packages = usePoolStore((state) => state.packages);
  const monthlyMemberships = usePoolStore((state) => state.monthlyMemberships);
  const openModal = usePoolStore((state) => state.openModal);
  const addPackage = usePoolStore((state) => state.addPackage);
  const updatePackage = usePoolStore((state) => state.updatePackage);
  const archivePackage = usePoolStore((state) => state.archivePackage);
  const deleteMonthlyMembership = usePoolStore((state) => state.deleteMonthlyMembership);
  const seedStarted = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const monthlyPackages = packages.filter((pkg) => pkg.packageKind === 'monthly');
  const registrations = [...monthlyMemberships].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    if (seedStarted.current || packages.length === 0) return;
    seedStarted.current = true;

    const defaults: Array<{ name: string; price: number }> = [
      { name: 'Coaching', price: 3500 },
      { name: 'Regular Swimming', price: 2000 },
    ];

    defaults.forEach(async (item) => {
      if (!packages.some((pkg) => pkg.packageKind === 'monthly' && pkg.name === item.name)) {
        try {
          await addPackage({
            name: item.name,
            durationMinutes: 43200,
            price: item.price,
            description: item.name === 'Coaching'
              ? '30-day monthly swimming coaching package.'
              : '30-day regular monthly swimming package.',
            isActive: true,
            packageKind: 'monthly',
            durationMonths: 1,
          });
        } catch (error: any) {
          console.error('Monthly package seed failed:', error);
        }
      }
    });
  }, [addPackage, packages]);

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setEditedPrice(String(pkg.price));
  };

  const savePrice = async (pkg: Package) => {
    const price = Number(editedPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid monthly package price.');
      return;
    }
    try {
      await updatePackage(pkg.id, { price });
      setEditingId(null);
      toast.success(`${pkg.name} price updated.`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update monthly package price.');
    }
  };

  const deletePackage = async (pkg: Package) => {
    if (!window.confirm(`Delete monthly package "${pkg.name}"?`)) return;

    try {
      await archivePackage(pkg.id);
      toast.success(`Monthly package "${pkg.name}" deleted.`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete monthly package.');
    }
  };

  const deleteCustomer = async (membershipId: string, customerName: string) => {
    if (!window.confirm(`Delete monthly customer "${customerName}"?`)) return;

    try {
      await deleteMonthlyMembership(membershipId);
      toast.success(`${customerName} removed from monthly packages.`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete monthly customer.');
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));

  const printCustomerBill = (membership: (typeof registrations)[number]) => {
    const printWindow = window.open('', '_blank', 'width=720,height=800');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the monthly bill.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Monthly Package Bill - ${membership.customerName}</title>
          <style>
            @page { size: 80mm auto; margin: 3mm; }
            * { box-sizing: border-box; }
            body {
              width: 74mm;
              margin: 0 auto;
              font-family: Arial, sans-serif;
              color: #1e293b;
              font-size: 10px;
            }
            .header { border-bottom: 1px dashed #334155; padding-bottom: 6px; margin-bottom: 8px; text-align: center; }
            h1 { margin: 0 0 3px; font-size: 16px; }
            .muted { color: #64748B; font-size: 9px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 8px; }
            .box { border: 1px solid #dbe3ea; border-radius: 4px; padding: 5px; }
            .label { color: #64748B; font-size: 8px; text-transform: uppercase; font-weight: bold; }
            .value { margin-top: 3px; font-size: 9px; font-weight: bold; overflow-wrap: anywhere; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 5px 2px; text-align: left; font-size: 9px; }
            th { background: #f8fafc; }
            .total { text-align: right; font-size: 13px; font-weight: bold; color: #087FA5; margin-top: 7px; }
            @media print { body { width: 74mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Package Bill</h1>
            <div class="muted">Chakreshwar Pool</div>
          </div>
          <div class="grid">
            <div class="box">
              <div class="label">Customer Name</div>
              <div class="value">${membership.customerName}</div>
            </div>
            <div class="box">
              <div class="label">Phone Number</div>
              <div class="value">${membership.customerPhone}</div>
            </div>
            <div class="box">
              <div class="label">Start Date</div>
              <div class="value">${formatDate(membership.startDate)}</div>
            </div>
            <div class="box">
              <div class="label">Expiry Date</div>
              <div class="value">${formatDate(membership.expiryDate)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Package</th><th>Duration</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${membership.packageName}</td>
                <td>${membership.durationMonths} month(s)</td>
                <td>${formatCurrency(membership.price)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">Total: ${formatCurrency(membership.price)}</div>
          <div class="muted" style="margin-top: 12px;">
            Payment status: ${membership.paymentStatus} | Paid: ${formatCurrency(membership.paidAmount)}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getRemainingDays = (expiryValue: string) => {
    const millisecondsRemaining =
      new Date(expiryValue).getTime() - Date.now();
    return Math.max(0, Math.ceil(millisecondsRemaining / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Monthly Packages
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Sell 30-day coaching and regular swimming memberships
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal('package_modal', { packageKind: 'monthly' })}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white font-bold text-xs shadow-md shadow-[#087FA5]/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#087FA5]/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#087FA5]" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900">{pkg.name}</h2>
                  <p className="text-xs text-slate-500">
                    {pkg.durationMonths || 1} {(pkg.durationMonths || 1) === 1 ? 'month' : 'months'} membership
                  </p>
                </div>
              </div>

              {editingId === pkg.id ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      value={editedPrice}
                      onChange={(e) => {
                        const value = normalizeNonNegativeInput(e.target.value, 0);
                        if (e.target.value !== '' && Number(e.target.value) < 0) {
                          toast.error('Package price cannot be negative.');
                        }
                        setEditedPrice(value);
                      }}
                      className="w-28 pl-7 pr-2 py-2 text-sm font-bold rounded-lg border border-slate-300"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => savePrice(pkg)}
                    className="p-2 rounded-lg bg-[#087FA5] text-white"
                    title="Save price"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#087FA5]">{formatCurrency(pkg.price)}</div>
                    <button
                      type="button"
                      onClick={() => startEdit(pkg)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#087FA5]"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit price
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePackage(pkg)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title={`Delete ${pkg.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => openModal('monthly_entry', { pkg })}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Buy {pkg.name} Package
            </button>
          </div>
        ))}
      </div>

      {monthlyPackages.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">
          Loading monthly packages...
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Monthly Package Customers</h2>
        </div>

        {registrations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No monthly package customers yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {registrations.map((membership) => (
              <div key={membership.id}>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <User className="w-4 h-4 text-[#087FA5]" />
                      {membership.customerName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {membership.customerPhone}
                      <span className="mx-1">•</span>
                      {membership.packageName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <div className="text-left sm:text-right mr-1">
                      <div className="font-extrabold text-[#087FA5]">{formatCurrency(membership.price)}</div>
                      <div className="text-[11px] text-slate-500">
                        {getRemainingDays(membership.expiryDate)} days remaining
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCustomerId(selectedCustomerId === membership.id ? null : membership.id)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold text-[#087FA5] hover:bg-[#087FA5]/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => printCustomerBill(membership)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#087FA5] hover:bg-[#087FA5]/10"
                      title={`Print bill for ${membership.customerName}`}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomer(membership.id, membership.customerName)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title={`Delete ${membership.customerName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedCustomerId === membership.id && (
                  <div className="mx-5 mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Customer</p>
                        <p className="font-bold text-slate-800 mt-1">{membership.customerName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{membership.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Package</p>
                        <p className="font-bold text-slate-800 mt-1">{membership.packageName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(membership.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Membership Period</p>
                        <p className="font-bold text-slate-800 mt-1">{formatDate(membership.startDate)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Expires {formatDate(membership.expiryDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Time Remaining</p>
                        <p className="flex items-center gap-1 font-extrabold text-[#087FA5] mt-1">
                          <Clock className="w-4 h-4" />
                          {getRemainingDays(membership.expiryDate)} days
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {membership.paymentStatus === 'paid'
                            ? 'Fully paid'
                            : `${formatCurrency(membership.paidAmount)} paid`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

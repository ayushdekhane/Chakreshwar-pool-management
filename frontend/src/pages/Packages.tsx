import React, { useState } from 'react';
import {
  Tag,
  Clock,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { usePoolStore } from '../store/usePoolStore';
import { formatCurrency } from '../utils';
import { Package } from '../types';
import { toast } from 'sonner';

export const Packages: React.FC = () => {
  const packages = usePoolStore((state) => state.packages);
  const openModal = usePoolStore((state) => state.openModal);
  const togglePackageActive = usePoolStore((state) => state.togglePackageActive);
  const archivePackage = usePoolStore((state) => state.archivePackage);

  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredPackages = packages.filter((pkg) => {
    if (filterActive === 'active') return pkg.isActive;
    if (filterActive === 'inactive') return !pkg.isActive;
    return true;
  });

  const handleToggle = (pkg: Package) => {
    togglePackageActive(pkg.id);
    toast.info(`Package "${pkg.name}" is now ${pkg.isActive ? 'Inactive' : 'Active'}.`);
  };

  const handleArchive = (pkg: Package) => {
    if (window.confirm(`Are you sure you want to remove package "${pkg.name}"?`)) {
      archivePackage(pkg.id);
      toast.success(`Package "${pkg.name}" deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Swimming Pricing & Admission Packages
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Configure hourly rates, 30m / 60m / 90m durations, and custom club session packages
          </p>
        </div>

        <button
          onClick={() => openModal('package_modal')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white font-bold text-xs shadow-md shadow-[#087FA5]/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Package</span>
        </button>
      </div>

      {/* Package Filter Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterActive('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterActive === 'all'
              ? 'bg-[#087FA5] text-white'
              : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Packages ({packages.length})
        </button>
        <button
          onClick={() => setFilterActive('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterActive === 'active'
              ? 'bg-[#087FA5] text-white'
              : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active for Public Check-in ({packages.filter((p) => p.isActive).length})
        </button>
        <button
          onClick={() => setFilterActive('inactive')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filterActive === 'inactive'
              ? 'bg-[#087FA5] text-white'
              : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
          }`}
        >
          Archived / Inactive ({packages.filter((p) => !p.isActive).length})
        </button>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-2xl p-5 border shadow-subtle hover:shadow-card transition-all flex flex-col justify-between ${
              pkg.isActive ? 'border-[#E2E8F0]' : 'border-slate-200 bg-slate-50/50 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    pkg.isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {pkg.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Pass
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Inactive
                    </>
                  )}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal('package_modal', { pkg })}
                    className="p-1.5 text-slate-400 hover:text-[#087FA5] rounded-lg hover:bg-slate-100"
                    title="Edit package"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(pkg)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                    title="Remove package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">{pkg.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{pkg.description}</p>

              <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Duration
                  </span>
                  <div className="flex items-center gap-1 font-bold text-slate-800 text-sm">
                    <Clock className="w-4 h-4 text-[#087FA5]" />
                    <span>{pkg.durationMinutes} Minutes</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Admission Fee
                  </span>
                  <div className="font-extrabold text-xl text-[#087FA5]">
                    {formatCurrency(pkg.price)}
                  </div>
                </div>
              </div>

              {pkg.swimmersCount !== undefined && pkg.swimmersCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{pkg.swimmersCount} swimmers admitted under this pass</span>
                </div>
              )}
            </div>

            {/* Toggle Switch */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Public Counter Booking:</span>
              <button
                type="button"
                onClick={() => handleToggle(pkg)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  pkg.isActive ? 'bg-[#087FA5]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pkg.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


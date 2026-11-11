import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import {
  Session,
  PaymentRecord,
  RentalItem,
  Package,
  Customer,
  Equipment,
  Settings,
  AlertNotification,
  SessionStatus,
  PaymentMethod,
} from '../types';
import {
  DbCustomer,
  DbSession,
  DbPayment,
  DbCostumeRental,
  DbPaymentMethod,
} from '../types/database';
import {
  initialSettings,
  initialPackages,
  initialEquipment,
  initialCustomers,
  generateInitialDemonstrationData,
} from '../data/mockData';
import { calculateTimeRemaining, playAlertSound, isValidUuid } from '../utils';
import { customerService } from '../services/customerService';
import { sessionService } from '../services/sessionService';
import { paymentService } from '../services/paymentService';
import { rentalService } from '../services/rentalService';
import { equipmentService } from '../services/equipmentService';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

interface PoolStore {
  // Data
  sessions: Session[];
  payments: PaymentRecord[];
  rentals: RentalItem[];
  packages: Package[];
  customers: Customer[];
  equipment: Equipment[];
  settings: Settings;
  alerts: AlertNotification[];
  currentTime: Date;

  // Supabase & Auth status
  isSupabaseLive: boolean;
  isLoadingData: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  fetchAllData: () => Promise<void>;

  // Active Modals & Selection
  activeModal:
    | 'individual_entry'
    | 'group_entry'
    | 'record_payment'
    | 'rent_equipment'
    | 'return_equipment'
    | 'extend_session'
    | 'session_details'
    | 'package_modal'
    | 'receipt_modal'
    | 'staff_login'
    | 'checkout_session'
    | null;
  selectedSessionId: string | null;
  selectedRentalId: string | null;
  selectedPaymentId: string | null;
  selectedPackage: Package | null;

  // Modal actions
  openModal: (
    modal: PoolStore['activeModal'],
    payload?: {
      sessionId?: string;
      rentalId?: string;
      paymentId?: string;
      pkg?: Package;
    }
  ) => void;
  closeModal: () => void;

  // Timer Tick & Alerts
  tickTimer: () => void;
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
  triggerAudioTest: () => void;

  // Session Operations
  createIndividualSession: (data: {
    customerName: string;
    customerPhone: string;
    customerAge?: number;
    notes?: string;
    packageId: string;
    customDuration?: number;
    customAmount?: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    paidAmount: number;
    paymentMethod?: PaymentRecord['method'];
    paymentRef?: string;
    rentals?: {
      equipmentId: string;
      size?: string;
      quantity: number;
      pricePerItem: number;
      deposit: number;
    }[];
  }) => Promise<Session>;

  createGroupSession: (data: {
    leaderName: string;
    leaderPhone: string;
    memberCount: number;
    packageId: string;
    customDuration?: number;
    totalPrice: number;
    initialPayment: number;
    paymentMethod?: PaymentRecord['method'];
    paymentRef?: string;
    notes?: string;
    rentals?: {
      equipmentId: string;
      size?: string;
      quantity: number;
      pricePerItem: number;
      securityDeposit: number;
    }[];
  }) => Promise<Session>;

  extendSession: (
    sessionId: string,
    minutesToAdd: number,
    charge: number,
    notes?: string
  ) => Promise<void>;

  completeSession: (sessionId: string) => Promise<void>;
  checkoutAndPaySession: (data: {
    sessionId: string;
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Payment Operations
  recordPayment: (data: {
    sessionId: string;
    customerId?: string;
    customerName?: string;
    amount: number;
    method: PaymentRecord['method'];
    referenceNumber?: string;
    notes?: string;
  }) => Promise<PaymentRecord>;

  deletePayment: (paymentId: string) => Promise<void>;

  // Rental Operations
  issueRental: (data: {
    sessionId?: string;
    customerId?: string;
    customerName: string;
    equipmentId: string;
    size?: string;
    quantity: number;
    pricePerItem: number;
    securityDeposit: number;
    notes?: string;
  }) => Promise<RentalItem>;

  processReturn: (
    rentalId: string,
    returnedQuantity: number,
    notes?: string
  ) => Promise<void>;
  deleteRental: (rentalId: string) => Promise<void>;

  // Package Operations
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (id: string, pkg: Partial<Package>) => void;
  togglePackageActive: (id: string) => void;
  archivePackage: (id: string) => void;
  updateEquipment: (
    id: string,
    updates: Pick<
      Equipment,
      'name' | 'totalStock' | 'availableStock' | 'defaultRate' | 'defaultDeposit'
    >
  ) => Promise<void>;

  // Customer Operations
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalVisits'>) => Promise<Customer>;

  // Settings & Demo Reset
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetDemonstrationData: () => void;
  clearDemonstrationData: () => void;
}

const initialDemo = generateInitialDemonstrationData();

function mapDbPaymentMethod(dbMethod: DbPaymentMethod | string): PaymentMethod {
  if (dbMethod === 'cash') return 'cash';
  return 'online';
}

function mapFrontendPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  if (method === 'cash') return 'cash';
  return 'other';
}

function transformDbData(
  dbSessions: DbSession[],
  dbPayments: DbPayment[],
  dbRentals: DbCostumeRental[],
  dbCustomers: DbCustomer[]
) {
  const customerVisitMap = new Map<string, number>();
  dbSessions.forEach((s) => {
    customerVisitMap.set(s.customer_id, (customerVisitMap.get(s.customer_id) || 0) + 1);
  });

  const customers: Customer[] = dbCustomers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.mobile,
    createdAt: c.created_at,
    totalVisits: customerVisitMap.get(c.id) || 1,
  }));

  const payments: PaymentRecord[] = dbPayments
    .filter((p) => p.transaction_type === 'payment')
    .map((p) => {
      const sess = p.session || dbSessions.find((s) => s.id === p.session_id);
      const cust = sess?.customer || dbCustomers.find((c) => c.id === sess?.customer_id);

      return {
        id: p.id,
        sessionId: p.session_id,
        customerId: sess?.customer_id || '',
        customerName: cust?.name || 'Guest Swimmer',
        amount: Number(p.amount),
        method: mapDbPaymentMethod(p.payment_method),
        referenceNumber: p.notes || undefined,
        timestamp: p.payment_date || p.created_at,
        notes: p.notes || undefined,
        status: 'success',
      };
    });

  const rentals: RentalItem[] = dbRentals.map((r) => {
    const sess = r.session || dbSessions.find((s) => s.id === r.session_id);
    const cust = sess?.customer || dbCustomers.find((c) => c.id === sess?.customer_id);
    const isReturned = r.returned_quantity >= r.quantity;
    const isPartial = r.returned_quantity > 0 && !isReturned;

    return {
      id: r.id,
      sessionId: r.session_id,
      customerId: sess?.customer_id,
      customerName: cust?.name || 'Pool Guest',
      equipmentId:
        initialEquipment.find((item) => item.name === r.item_name)?.id || 'eq-costume-men',
      equipmentName: r.item_name,
      quantity: r.quantity,
      returnedQuantity: r.returned_quantity,
      pricePerItem: Number(r.rental_charge) / Math.max(1, r.quantity),
      totalRentalAmount: Number(r.rental_charge),
      securityDeposit: 50 * r.quantity,
      issueTimestamp: r.created_at,
      status: isReturned ? 'returned' : isPartial ? 'partial_returned' : 'active',
    };
  });

  const groupCodeMap = new Map<string, DbSession[]>();
  dbSessions.forEach((s) => {
    if (s.group_code) {
      const existing = groupCodeMap.get(s.group_code) || [];
      existing.push(s);
      groupCodeMap.set(s.group_code, existing);
    }
  });

  const sessions: Session[] = dbSessions.map((s) => {
    const cust = s.customer || dbCustomers.find((c) => c.id === s.customer_id);
    const sessionPayments = payments.filter((p) => p.sessionId === s.id);
    const sessionRentals = rentals.filter((r) => r.sessionId === s.id);

    const paidSum = sessionPayments.reduce((sum, p) => sum + p.amount, 0);

    const rentalCharges = sessionRentals.reduce((sum, r) => sum + r.totalRentalAmount, 0);
    const swimmingCharges = Number(s.session_amount);
    const totalCharges = swimmingCharges + rentalCharges;
    const outstanding = Math.max(0, totalCharges - paidSum);

    const isGroup = Boolean(s.group_code);
    const groupMembersDb = isGroup ? groupCodeMap.get(s.group_code!) || [s] : [];
    return {
      id: s.id,
      type: isGroup ? 'group' : 'individual',
      customerId: s.customer_id,
      customerName: cust?.name || 'Guest Swimmer',
      customerPhone: cust?.mobile || '',
      groupName: s.group_name || s.group_code || undefined,
      groupCode: s.group_code || undefined,
      peopleCount: isGroup ? Math.max(s.people_count || 0, groupMembersDb.length, 1) : 1,
      packageId: 'pkg-standard',
      packageName: `${s.duration_minutes} Mins Session`,
      durationMinutes: s.duration_minutes,
      entryTime: s.entry_time,
      scheduledExitTime: s.scheduled_exit_time,
      actualExitTime: s.actual_exit_time || undefined,
      status: s.status as SessionStatus,
      swimmingCharges,
      extensionCharges: 0,
      rentalCharges,
      totalCharges,
      paidAmount: paidSum,
      outstandingBalance: outstanding,
      paymentStatus: paidSum >= totalCharges ? 'paid' : paidSum > 0 ? 'partial' : 'unpaid',
      extensions: [],
      rentals: sessionRentals,
      payments: sessionPayments,
    };
  });

  return { customers, sessions, payments, rentals };
}

export const usePoolStore = create<PoolStore>((set, get) => ({
  sessions: initialDemo.sessions,
  payments: initialDemo.payments,
  rentals: initialDemo.rentals,
  packages: initialPackages,
  customers: initialCustomers,
  equipment: initialEquipment,
  settings: initialSettings,
  alerts: [],
  currentTime: new Date(),

  isSupabaseLive: isSupabaseConfigured,
  isLoadingData: false,
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  activeModal: null,
  selectedSessionId: null,
  selectedRentalId: null,
  selectedPaymentId: null,
  selectedPackage: null,

  openModal: (modal, payload) =>
    set({
      activeModal: modal,
      selectedSessionId: payload?.sessionId || null,
      selectedRentalId: payload?.rentalId || null,
      selectedPaymentId: payload?.paymentId || null,
      selectedPackage: payload?.pkg || null,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      selectedSessionId: null,
      selectedRentalId: null,
      selectedPaymentId: null,
      selectedPackage: null,
    }),

  fetchAllData: async () => {
    if (!isSupabaseConfigured) return;

    // Do not attempt authenticated fetch if no staff session is present
    const user = get().currentUser;
    if (!user) {
      return;
    }

    set({ isLoadingData: true });
    try {
      const [dbCustomers, dbSessions, dbPayments, dbRentals, equipment] = await Promise.all([
        customerService.getCustomers(),
        sessionService.getSessions(),
        paymentService.getPayments(),
        rentalService.getAllRentals(),
        equipmentService.getAll(initialEquipment),
      ]);

      const transformed = transformDbData(
        dbSessions,
        dbPayments,
        dbRentals,
        dbCustomers
      );

      set({
        customers: transformed.customers,
        sessions: transformed.sessions,
        payments: transformed.payments,
        rentals: transformed.rentals,
        equipment,
        isSupabaseLive: true,
      });
    } catch (err: any) {
      console.error('Error synchronizing data with Supabase:', err.message);
      if (err.status === 401 || err.message?.includes('JWT') || err.message?.includes('unauthorized')) {
        set({ currentUser: null });
      }
    } finally {
      set({ isLoadingData: false });
    }
  },

  triggerAudioTest: () => {
    const { settings } = get();
    if (settings.soundEnabled) {
      playAlertSound('warning', settings.soundVolume);
      setTimeout(() => {
        playAlertSound('expired', settings.soundVolume);
      }, 700);
    }
  },

  tickTimer: () => {
    const now = new Date();
    const { sessions, alerts, settings } = get();
    const newAlerts = [...alerts];
    let hasWarningTriggered = false;
    let hasExpiredTriggered = false;

    const updatedSessions = sessions.map((sess) => {
      if (sess.status === 'completed' || sess.status === 'cancelled') {
        return sess;
      }

      const { isExpired, isExpiringSoon } = calculateTimeRemaining(sess.scheduledExitTime);
      let newStatus: SessionStatus = sess.status;

      if (isExpired) {
        newStatus = 'expired';
        const alertExists = newAlerts.some(
          (a) => a.sessionId === sess.id && a.type === 'expired' && !a.isDismissed
        );
        if (!alertExists && sess.status !== 'expired') {
          newAlerts.unshift({
            id: `alert-exp-${sess.id}-${Date.now()}`,
            sessionId: sess.id,
            customerName: sess.customerName,
            type: 'expired',
            message: `Session for ${sess.customerName} (${sess.type === 'group' ? sess.groupName || 'Group' : 'Individual'}) has EXPIRED!`,
            timestamp: now.toISOString(),
            isDismissed: false,
          });
          hasExpiredTriggered = true;
        }
      } else if (isExpiringSoon) {
        newStatus = 'expiring';
        const alertExists = newAlerts.some(
          (a) => a.sessionId === sess.id && a.type === 'expiring_soon' && !a.isDismissed
        );
        if (!alertExists && sess.status === 'active') {
          newAlerts.unshift({
            id: `alert-warn-${sess.id}-${Date.now()}`,
            sessionId: sess.id,
            customerName: sess.customerName,
            type: 'expiring_soon',
            message: `Session for ${sess.customerName} ends in under 5 minutes.`,
            timestamp: now.toISOString(),
            isDismissed: false,
          });
          hasWarningTriggered = true;
        }
      } else {
        newStatus = 'active';
      }

      if (newStatus !== sess.status) {
        return { ...sess, status: newStatus };
      }
      return sess;
    });

    if (settings.soundEnabled) {
      if (hasExpiredTriggered && settings.expiryAlarm) {
        playAlertSound('expired', settings.soundVolume);
      } else if (hasWarningTriggered && settings.fiveMinuteWarning) {
        playAlertSound('warning', settings.soundVolume);
      }
    }

    set({
      currentTime: now,
      sessions: updatedSessions,
      alerts: newAlerts,
    });
  },

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, isDismissed: true } : a)),
    })),

  dismissAllAlerts: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, isDismissed: true })),
    })),

  addCustomer: async (custData) => {
    const dbCust = await customerService.addCustomer({
      name: custData.name,
      mobile: custData.phone,
    });

    const newCust: Customer = {
      id: dbCust.id,
      name: dbCust.name,
      phone: dbCust.mobile,
      createdAt: dbCust.created_at,
      totalVisits: 1,
    };

    set((state) => ({
      customers: [newCust, ...state.customers.filter((c) => c.phone !== newCust.phone && c.id !== newCust.id)],
    }));

    return newCust;
  },

  createIndividualSession: async (data) => {
    const now = new Date();
    const pkg = get().packages.find((p) => p.id === data.packageId);
    const duration = data.customDuration || pkg?.durationMinutes || 60;
    const swimCharge = data.customAmount !== undefined ? data.customAmount : (pkg?.price || 100);
    const equipment = get().equipment;
    const selectedRentals = (data.rentals || []).map((rental) => {
      const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
      if (!item) {
        throw new Error(`Selected accessory "${rental.equipmentId}" is not available.`);
      }
      if (
        !Number.isInteger(rental.quantity) ||
        rental.quantity < 1 ||
        rental.quantity > item.availableStock
      ) {
        throw new Error(`Requested quantity for ${item.name} exceeds available stock.`);
      }
      if (!Number.isFinite(rental.pricePerItem) || rental.pricePerItem < 0) {
        throw new Error(`Invalid rental rate for ${item.name}.`);
      }
      return {
        ...rental,
        pricePerItem: item.defaultRate,
        deposit: item.defaultDeposit * rental.quantity,
        item,
      };
    });

    let cust = await get().addCustomer({
      name: data.customerName,
      phone: data.customerPhone,
      age: data.customerAge,
      notes: data.notes,
    });

    const scheduledExit = new Date(now.getTime() + duration * 60000).toISOString();

    const dbSession = await sessionService.createSession({
      customer_id: cust.id,
      entry_time: now.toISOString(),
      scheduled_exit_time: scheduledExit,
      duration_minutes: duration,
      session_amount: swimCharge,
      costume_used: selectedRentals.length > 0,
      status: 'active',
    });

    const sessionId = dbSession.id;

    const sessionRentals: RentalItem[] = [];
    for (const rental of selectedRentals) {
      const totalRental = rental.pricePerItem * rental.quantity;
      const dbRental = await rentalService.addRental({
        session_id: sessionId,
        item_name: rental.item.name,
        quantity: rental.quantity,
        rental_charge: totalRental,
      });
      await equipmentService.updateAvailableStock(
        rental.item.id,
        rental.item.availableStock - rental.quantity
      );

      sessionRentals.push({
        id: dbRental.id,
        sessionId,
        customerId: cust.id,
        customerName: cust.name,
        equipmentId: rental.item.id,
        equipmentName: rental.item.name,
        size: rental.size || 'Standard',
        quantity: rental.quantity,
        returnedQuantity: 0,
        pricePerItem: rental.pricePerItem,
        totalRentalAmount: totalRental,
        securityDeposit: rental.deposit,
        issueTimestamp: now.toISOString(),
        status: 'active',
      });
    }

    const rentalCharge = sessionRentals.reduce(
      (total, rental) => total + rental.totalRentalAmount,
      0
    );
    const totalCharges = swimCharge + rentalCharge;
    const paidAmount = data.paymentStatus === 'paid' ? totalCharges : (data.paidAmount || 0);
    const outstanding = Math.max(0, totalCharges - paidAmount);

    const sessionPayments: PaymentRecord[] = [];
    if (paidAmount > 0) {
      const dbPayment = await paymentService.addPayment({
        session_id: sessionId,
        amount: paidAmount,
        payment_method: mapFrontendPaymentMethod(data.paymentMethod || 'cash'),
        notes: data.paymentRef || 'Check-in admission payment',
      });

      const newPayment: PaymentRecord = {
        id: dbPayment.id,
        sessionId,
        customerId: cust.id,
        customerName: cust.name,
        amount: paidAmount,
        method: data.paymentMethod || 'cash',
        referenceNumber: data.paymentRef || `COUNTER-${Date.now().toString().slice(-4)}`,
        timestamp: now.toISOString(),
        status: 'success',
        notes: 'Initial session check-in payment',
      };
      sessionPayments.push(newPayment);
    }

    const newSession: Session = {
      id: sessionId,
      type: 'individual',
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAge: data.customerAge,
      peopleCount: 1,
      packageId: data.packageId,
      packageName: pkg?.name || 'Custom Package',
      durationMinutes: duration,
      entryTime: now.toISOString(),
      scheduledExitTime: scheduledExit,
      status: 'active',
      swimmingCharges: swimCharge,
      extensionCharges: 0,
      rentalCharges: rentalCharge,
      totalCharges,
      paidAmount,
      outstandingBalance: outstanding,
      paymentStatus:
        paidAmount >= totalCharges ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      notes: data.notes,
      extensions: [],
      rentals: sessionRentals,
      payments: sessionPayments,
    };

    set((state) => {
      const rentalQuantities = new Map<string, number>();
      sessionRentals.forEach((rental) => {
        rentalQuantities.set(
          rental.equipmentId,
          (rentalQuantities.get(rental.equipmentId) || 0) + rental.quantity
        );
      });
      return {
        sessions: [newSession, ...state.sessions],
        rentals: [...sessionRentals, ...state.rentals],
        payments: [...sessionPayments, ...state.payments],
        equipment: state.equipment.map((item) => ({
          ...item,
          availableStock: Math.max(
            0,
            item.availableStock - (rentalQuantities.get(item.id) || 0)
          ),
        })),
      };
    });

    return newSession;
  },

  createGroupSession: async (data) => {
    const now = new Date();
    const pkg = get().packages.find((p) => p.id === data.packageId);
    const duration = data.customDuration || pkg?.durationMinutes || 60;
    const scheduledExit = new Date(now.getTime() + duration * 60000).toISOString();
    const groupCode = `GRP-${crypto.randomUUID()}`;
    const groupName = data.leaderName;
    const equipment = get().equipment;
    const selectedRentals = (data.rentals || []).map((rental) => {
      const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
      if (!item) {
        throw new Error(`Selected accessory "${rental.equipmentId}" is not available.`);
      }
      if (
        !Number.isInteger(rental.quantity) ||
        rental.quantity < 1 ||
        rental.quantity > item.availableStock
      ) {
        throw new Error(`Requested quantity for ${item.name} exceeds available stock.`);
      }
      if (!Number.isFinite(rental.pricePerItem) || rental.pricePerItem < 0) {
        throw new Error(`Invalid rental rate for ${item.name}.`);
      }
      return {
        ...rental,
        pricePerItem: item.defaultRate,
        securityDeposit: item.defaultDeposit * rental.quantity,
        item,
      };
    });
    const rentalCharge = selectedRentals.reduce(
      (total, rental) => total + rental.pricePerItem * rental.quantity,
      0
    );

    const leaderCust = await get().addCustomer({
      name: data.leaderName,
      phone: data.leaderPhone,
      notes: `Group Leader: ${groupName}`,
    });

    const leaderDbSession = await sessionService.createSession({
      customer_id: leaderCust.id,
      group_code: groupCode,
      group_name: groupName,
      people_count: data.memberCount,
      entry_time: now.toISOString(),
      scheduled_exit_time: scheduledExit,
      duration_minutes: duration,
      session_amount: data.totalPrice,
      costume_used: selectedRentals.length > 0,
      status: 'active',
    });

    const groupRentals: RentalItem[] = [];
    for (const rental of selectedRentals) {
      const totalRentalAmount = rental.pricePerItem * rental.quantity;
      const dbRental = await rentalService.addRental({
        session_id: leaderDbSession.id,
        item_name: rental.item.name,
        quantity: rental.quantity,
        rental_charge: totalRentalAmount,
      });
      await equipmentService.updateAvailableStock(
        rental.item.id,
        rental.item.availableStock - rental.quantity
      );
      groupRentals.push({
        id: dbRental.id,
        sessionId: leaderDbSession.id,
        customerId: leaderCust.id,
        customerName: data.leaderName,
        equipmentId: rental.item.id,
        equipmentName: rental.item.name,
        size: rental.size || rental.item.sizes[0] || 'Standard',
        quantity: rental.quantity,
        returnedQuantity: 0,
        pricePerItem: rental.pricePerItem,
        totalRentalAmount,
        securityDeposit: rental.securityDeposit,
        issueTimestamp: now.toISOString(),
        status: 'active',
      });
    }

    const sessionPayments: PaymentRecord[] = [];
    if (data.initialPayment > 0) {
      const dbPayment = await paymentService.addPayment({
        session_id: leaderDbSession.id,
        amount: data.initialPayment,
        payment_method: mapFrontendPaymentMethod(data.paymentMethod || 'cash'),
        notes: `Group Pass led by ${groupName} (${data.memberCount} members)`,
      });

      const newPayment: PaymentRecord = {
        id: dbPayment.id,
        sessionId: leaderDbSession.id,
        customerId: leaderCust.id,
        customerName: data.leaderName,
        amount: data.initialPayment,
        method: data.paymentMethod || 'cash',
        referenceNumber: data.paymentRef || `GRP-${Date.now().toString().slice(-4)}`,
        timestamp: now.toISOString(),
        status: 'success',
        notes: `Initial payment for group led by ${groupName}`,
      };
      sessionPayments.push(newPayment);
    }

    const totalCharges = data.totalPrice + rentalCharge;
    const paidAmount = data.initialPayment;
    const outstanding = Math.max(0, totalCharges - paidAmount);

    const primaryGroupSession: Session = {
      id: leaderDbSession.id,
      type: 'group',
      customerId: leaderCust.id,
      customerName: data.leaderName,
      customerPhone: data.leaderPhone,
      groupName,
      groupCode,
      peopleCount: data.memberCount,
      packageId: data.packageId,
      packageName: pkg?.name || 'Group Package',
      durationMinutes: duration,
      entryTime: now.toISOString(),
      scheduledExitTime: scheduledExit,
      status: 'active',
      swimmingCharges: data.totalPrice,
      extensionCharges: 0,
      rentalCharges: rentalCharge,
      totalCharges,
      paidAmount,
      outstandingBalance: outstanding,
      paymentStatus:
        paidAmount >= totalCharges ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      notes: data.notes,
      extensions: [],
      rentals: groupRentals,
      payments: sessionPayments,
    };

    set((state) => {
      const rentalQuantities = new Map<string, number>();
      groupRentals.forEach((rental) => {
        rentalQuantities.set(
          rental.equipmentId,
          (rentalQuantities.get(rental.equipmentId) || 0) + rental.quantity
        );
      });
      return {
        sessions: [primaryGroupSession, ...state.sessions],
        payments: [...sessionPayments, ...state.payments],
        rentals: [...groupRentals, ...state.rentals],
        equipment: state.equipment.map((item) => ({
          ...item,
          availableStock: Math.max(
            0,
            item.availableStock - (rentalQuantities.get(item.id) || 0)
          ),
        })),
      };
    });

    return primaryGroupSession;
  },

  extendSession: async (sessionId, minutesToAdd, charge, notes) => {
    const now = new Date();
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const currentExit = new Date(session.scheduledExitTime);
    const baseTime = currentExit.getTime() < now.getTime() ? now.getTime() : currentExit.getTime();
    const newExitTime = new Date(baseTime + minutesToAdd * 60000).toISOString();
    const newDuration = session.durationMinutes + minutesToAdd;
    const newTotal = session.totalCharges + charge;

    await sessionService.updateSession(sessionId, {
      scheduled_exit_time: newExitTime,
      duration_minutes: newDuration,
      session_amount: newTotal - session.rentalCharges,
    });

    const newExtension = {
      id: `EXT-${Date.now().toString().slice(-5)}`,
      minutesAdded: minutesToAdd,
      charge,
      timestamp: now.toISOString(),
      notes: notes || `Extended by ${minutesToAdd} mins`,
    };

    const newExtensionCharges = session.extensionCharges + charge;
    const newOutstanding = Math.max(0, newTotal - session.paidAmount);

    const updatedSession: Session = {
      ...session,
      durationMinutes: newDuration,
      scheduledExitTime: newExitTime,
      status: 'active',
      extensionCharges: newExtensionCharges,
      totalCharges: newTotal,
      outstandingBalance: newOutstanding,
      paymentStatus: newOutstanding === 0 ? 'paid' : 'partial',
      extensions: [...session.extensions, newExtension],
    };

    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
    }));
  },

  completeSession: async (sessionId) => {
    const now = new Date().toISOString();
    if (isValidUuid(sessionId) && isSupabaseConfigured) {
      await sessionService.completeSession(sessionId, now);
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'completed', actualExitTime: now } : s
      ),
    }));
  },

  checkoutAndPaySession: async ({ sessionId, amount, method, referenceNumber, notes }) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const now = new Date().toISOString();

    // 1. Record exit payment if amount > 0
    if (amount > 0) {
      await get().recordPayment({
        sessionId,
        customerId: session.customerId,
        customerName: session.customerName,
        amount,
        method,
        referenceNumber: referenceNumber || `EXIT-${Date.now().toString().slice(-4)}`,
        notes: notes || 'Exit checkout payment',
      });
    }

    // 2. Mark session as completed
    if (isValidUuid(sessionId) && isSupabaseConfigured) {
      await sessionService.completeSession(sessionId, now);
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'completed', actualExitTime: now } : s
      ),
    }));
  },

  cancelSession: async (sessionId) => {
    if (isValidUuid(sessionId) && isSupabaseConfigured) {
      await sessionService.updateSession(sessionId, { status: 'completed' });
    }
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'cancelled' } : s
      ),
    }));
  },

  deleteSession: async (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const sessionsToRemove = session?.groupCode
      ? get().sessions.filter((item) => item.groupCode === session.groupCode)
      : session
        ? [session]
        : [];

    if (isSupabaseConfigured) {
      if (session?.groupCode) {
        await sessionService.deleteSessionsByGroupCode(session.groupCode);
      } else if (isValidUuid(sessionId)) {
        await sessionService.deleteSession(sessionId);
      }
    }

    if (isSupabaseConfigured) {
      const stockToRestore = new Map<string, number>();
      sessionsToRemove.forEach((sessionToRemove) => {
        sessionToRemove.rentals.forEach((rental) => {
          const unreturned = rental.quantity - rental.returnedQuantity;
          if (unreturned > 0) {
            stockToRestore.set(
              rental.equipmentId,
              (stockToRestore.get(rental.equipmentId) || 0) + unreturned
            );
          }
        });
      });
      for (const [equipmentId, quantity] of stockToRestore) {
        const equipment = get().equipment.find((item) => item.id === equipmentId);
        if (equipment) {
          await equipmentService.updateAvailableStock(
            equipmentId,
            Math.min(equipment.totalStock, equipment.availableStock + quantity)
          );
        }
      }
    }

    const sessionIdsToDelete = session?.groupCode
      ? get().sessions
          .filter((item) => item.groupCode === session.groupCode)
          .map((item) => item.id)
      : [sessionId];

    set((state) => {
      let updatedEquipment = state.equipment;
      sessionsToRemove.forEach((sessionToRemove) => {
        sessionToRemove.rentals.forEach((rnt) => {
          const unreturned = rnt.quantity - rnt.returnedQuantity;
          if (unreturned > 0) {
            updatedEquipment = updatedEquipment.map((eq) =>
              eq.id === rnt.equipmentId
                ? { ...eq, availableStock: Math.min(eq.totalStock, eq.availableStock + unreturned) }
                : eq
            );
          }
        });
      });

      return {
        sessions: state.sessions.filter((s) => !sessionIdsToDelete.includes(s.id)),
        rentals: state.rentals.filter((r) => !sessionIdsToDelete.includes(r.sessionId || '')),
        payments: state.payments.filter((p) => !sessionIdsToDelete.includes(p.sessionId)),
        alerts: state.alerts.filter((a) => !sessionIdsToDelete.includes(a.sessionId)),
        equipment: updatedEquipment,
      };
    });
  },

  recordPayment: async (data) => {
    const now = new Date();
    let targetCustName = data.customerName || '';
    if (!targetCustName && data.sessionId) {
      const sess = get().sessions.find((s) => s.id === data.sessionId);
      if (sess) targetCustName = sess.customerName;
    }

    const dbPayment = await paymentService.addPayment({
      session_id: data.sessionId,
      amount: data.amount,
      payment_method: mapFrontendPaymentMethod(data.method),
      notes: data.notes || data.referenceNumber,
    });

    const newPayment: PaymentRecord = {
      id: dbPayment.id,
      sessionId: data.sessionId,
      customerId: data.customerId || '',
      customerName: targetCustName,
      amount: data.amount,
      method: data.method,
      referenceNumber: data.referenceNumber || `REF-${Date.now().toString().slice(-5)}`,
      timestamp: now.toISOString(),
      status: 'success',
      notes: data.notes,
    };

    set((state) => {
      const updatedSessions = state.sessions.map((s) => {
        if (s.id === data.sessionId) {
          const newPaid = s.paidAmount + data.amount;
          const newOutstanding = Math.max(0, s.totalCharges - newPaid);
          return {
            ...s,
            paidAmount: newPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: newOutstanding === 0 ? ('paid' as const) : ('partial' as const),
            payments: [...s.payments, newPayment],
          };
        }
        return s;
      });

      return {
        payments: [newPayment, ...state.payments],
        sessions: updatedSessions,
      };
    });

    return newPayment;
  },

  deletePayment: async (paymentId) => {
    if (isValidUuid(paymentId) && isSupabaseConfigured) {
      try {
        await paymentService.deletePayment(paymentId);
      } catch (err: any) {
        console.warn('Could not delete payment from Supabase (proceeding with local update):', err?.message);
      }
    }

    set((state) => {
      const payment = state.payments.find((p) => p.id === paymentId);
      if (!payment) return state;

      const remainingPayments = state.payments.filter((p) => p.id !== paymentId);

      const updatedSessions = state.sessions.map((s) => {
        if (s.id === payment.sessionId) {
          const sessPayments = remainingPayments.filter((p) => p.sessionId === s.id);
          const newPaid = sessPayments.reduce((sum, p) => sum + p.amount, 0);
          const newOutstanding = Math.max(0, s.totalCharges - newPaid);
          const newPaymentStatus =
            newOutstanding === 0 ? ('paid' as const) : newPaid > 0 ? ('partial' as const) : ('unpaid' as const);

          return {
            ...s,
            paidAmount: newPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: newPaymentStatus,
            payments: sessPayments,
          };
        }
        return s;
      });

      return {
        payments: remainingPayments,
        sessions: updatedSessions,
      };
    });
  },

  issueRental: async (data) => {
    const now = new Date();
    const eq = get().equipment.find((e) => e.id === data.equipmentId);
    if (!eq) throw new Error('Selected accessory is not available.');
    if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > eq.availableStock) {
      throw new Error(`Requested quantity for ${eq.name} exceeds available stock.`);
    }
    const totalAmount = data.pricePerItem * data.quantity;

    let dbRentalId = `rnt-${Date.now()}`;
    if (data.sessionId && isValidUuid(data.sessionId) && isSupabaseConfigured) {
      const dbRental = await rentalService.addRental({
        session_id: data.sessionId,
        item_name: eq?.name || data.equipmentId,
        quantity: data.quantity,
        rental_charge: totalAmount,
      });
      dbRentalId = dbRental.id;
      await equipmentService.updateAvailableStock(
        eq.id,
        eq.availableStock - data.quantity
      );
    }

    const newRental: RentalItem = {
      id: dbRentalId,
      sessionId: data.sessionId,
      customerId: data.customerId,
      customerName: data.customerName,
      equipmentId: data.equipmentId,
      equipmentName: eq?.name || 'Equipment',
      size: data.size || 'Standard',
      quantity: data.quantity,
      returnedQuantity: 0,
      pricePerItem: data.pricePerItem,
      totalRentalAmount: totalAmount,
      securityDeposit: data.securityDeposit,
      issueTimestamp: now.toISOString(),
      status: 'active',
      notes: data.notes,
    };

    set((state) => {
      const updatedEquipment = state.equipment.map((e) =>
        e.id === data.equipmentId
          ? { ...e, availableStock: Math.max(0, e.availableStock - data.quantity) }
          : e
      );

      let updatedSessions = state.sessions;
      if (data.sessionId) {
        updatedSessions = state.sessions.map((s) => {
          if (s.id === data.sessionId) {
            const newRentalCharges = s.rentalCharges + totalAmount;
            const newTotal = s.totalCharges + totalAmount;
            const newOutstanding = Math.max(0, newTotal - s.paidAmount);
            return {
              ...s,
              rentalCharges: newRentalCharges,
              totalCharges: newTotal,
              outstandingBalance: newOutstanding,
              rentals: [...s.rentals, newRental],
            };
          }
          return s;
        });
      }

      return {
        equipment: updatedEquipment,
        rentals: [newRental, ...state.rentals],
        sessions: updatedSessions,
      };
    });

    return newRental;
  },

  processReturn: async (rentalId, returnedQty, notes) => {
    const now = new Date();
    const currentRental = get().rentals.find((r) => r.id === rentalId);
    if (!currentRental) return;

    const newReturnedQty = currentRental.returnedQuantity + returnedQty;
    if (isValidUuid(rentalId) && isSupabaseConfigured) {
      await rentalService.updateRentalReturn(rentalId, newReturnedQty);
      const equipment = get().equipment.find((item) => item.id === currentRental.equipmentId);
      if (equipment) {
        await equipmentService.updateAvailableStock(
          equipment.id,
          Math.min(equipment.totalStock, equipment.availableStock + returnedQty)
        );
      }
    }

    set((state) => {
      const isFullyReturned = newReturnedQty >= currentRental.quantity;
      const newStatus: RentalItem['status'] = isFullyReturned
        ? 'returned'
        : 'partial_returned';

      const updatedRental: RentalItem = {
        ...currentRental,
        returnedQuantity: newReturnedQty,
        status: newStatus,
        returnTimestamp: isFullyReturned ? now.toISOString() : currentRental.returnTimestamp,
        notes: notes ? `${currentRental.notes ? currentRental.notes + ' | ' : ''}${notes}` : currentRental.notes,
      };

      const updatedEquipment = state.equipment.map((e) =>
        e.id === currentRental.equipmentId
          ? { ...e, availableStock: Math.min(e.totalStock, e.availableStock + returnedQty) }
          : e
      );

      const updatedRentals = state.rentals.map((r) =>
        r.id === rentalId ? updatedRental : r
      );

      const updatedSessions = state.sessions.map((s) => {
        if (s.id === currentRental.sessionId) {
          return {
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? updatedRental : r)),
          };
        }
        return s;
      });

      return {
        equipment: updatedEquipment,
        rentals: updatedRentals,
        sessions: updatedSessions,
      };
    });
  },

  deleteRental: async (rentalId) => {
    const rental = get().rentals.find((item) => item.id === rentalId);
    if (isValidUuid(rentalId) && isSupabaseConfigured) {
      await rentalService.deleteRental(rentalId);
      if (rental) {
        const equipment = get().equipment.find((item) => item.id === rental.equipmentId);
        const unreturned = rental.quantity - rental.returnedQuantity;
        if (equipment && unreturned > 0) {
          await equipmentService.updateAvailableStock(
            equipment.id,
            Math.min(equipment.totalStock, equipment.availableStock + unreturned)
          );
        }
      }
    }

    set((state) => {
      const rental = state.rentals.find((r) => r.id === rentalId);
      if (!rental) return state;

      const unreturned = rental.quantity - rental.returnedQuantity;
      const updatedEquipment = state.equipment.map((e) =>
        e.id === rental.equipmentId && unreturned > 0
          ? { ...e, availableStock: Math.min(e.totalStock, e.availableStock + unreturned) }
          : e
      );

      const updatedSessions = state.sessions.map((s) => {
        if (s.id === rental.sessionId) {
          const newRentalCharges = Math.max(0, s.rentalCharges - rental.totalRentalAmount);
          const newTotal = Math.max(0, s.totalCharges - rental.totalRentalAmount);
          const newOutstanding = Math.max(0, newTotal - s.paidAmount);
          return {
            ...s,
            rentalCharges: newRentalCharges,
            totalCharges: newTotal,
            outstandingBalance: newOutstanding,
            rentals: s.rentals.filter((r) => r.id !== rentalId),
          };
        }
        return s;
      });

      return {
        rentals: state.rentals.filter((r) => r.id !== rentalId),
        equipment: updatedEquipment,
        sessions: updatedSessions,
      };
    });
  },

  addPackage: (pkgData) => {
    const newPkg: Package = {
      ...pkgData,
      id: `pkg-${Date.now().toString().slice(-5)}`,
      swimmersCount: 0,
    };
    set((state) => ({ packages: [...state.packages, newPkg] }));
  },

  updatePackage: (id, updates) =>
    set((state) => ({
      packages: state.packages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  togglePackageActive: (id) =>
    set((state) => ({
      packages: state.packages.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    })),

  archivePackage: (id) =>
    set((state) => ({
      packages: state.packages.filter((p) => p.id !== id),
    })),

  updateEquipment: async (id, updates) => {
    if (
      !updates.name.trim() ||
      !Number.isInteger(updates.totalStock) ||
      !Number.isInteger(updates.availableStock) ||
      updates.totalStock < 0 ||
      updates.availableStock < 0 ||
      updates.availableStock > updates.totalStock ||
      !Number.isFinite(updates.defaultRate) ||
      updates.defaultRate < 0 ||
      !Number.isFinite(updates.defaultDeposit) ||
      updates.defaultDeposit < 0
    ) {
      throw new Error('Enter a valid item name, stock, rental fee, and security deposit.');
    }

    const equipment = get().equipment.find((item) => item.id === id);
    if (!equipment) throw new Error('Equipment item was not found.');
    await equipmentService.save({ ...equipment, ...updates, name: updates.name.trim() });

    set((state) => ({
      equipment: state.equipment.map((item) =>
        item.id === id ? { ...item, ...updates, name: updates.name.trim() } : item
      ),
    }));
  },

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  resetDemonstrationData: () => {
    const freshDemo = generateInitialDemonstrationData();
    set({
      sessions: freshDemo.sessions,
      payments: freshDemo.payments,
      rentals: freshDemo.rentals,
      packages: initialPackages,
      customers: initialCustomers,
      equipment: initialEquipment,
      settings: initialSettings,
      alerts: [],
    });
  },

  clearDemonstrationData: () => {
    set({
      sessions: [],
      payments: [],
      rentals: [],
      alerts: [],
    });
  },
}));

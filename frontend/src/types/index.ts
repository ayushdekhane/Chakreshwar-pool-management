export type SessionStatus = 'active' | 'expiring' | 'expired' | 'completed' | 'cancelled';
export type SessionType = 'individual' | 'group';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'online' | 'gpay' | 'phonepe' | 'paytm' | 'other';
export type RentalStatus = 'active' | 'returned' | 'partial_returned';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  age?: number;
  notes?: string;
  createdAt: string;
  totalVisits: number;
}

export interface Package {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  isActive: boolean;
  isCustom?: boolean;
  swimmersCount?: number;
}

export interface ExtensionRecord {
  id: string;
  minutesAdded: number;
  charge: number;
  timestamp: string;
  notes?: string;
}

export interface RentalItem {
  id: string;
  sessionId?: string;
  customerId?: string;
  customerName: string;
  equipmentId: string;
  equipmentName: string;
  size?: string;
  quantity: number;
  returnedQuantity: number;
  pricePerItem: number;
  totalRentalAmount: number;
  securityDeposit: number;
  issueTimestamp: string;
  returnTimestamp?: string;
  status: RentalStatus;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  timestamp: string;
  notes?: string;
  status: 'success';
}

export interface Session {
  id: string;
  type: SessionType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAge?: number;
  groupName?: string;
  groupCode?: string;
  peopleCount: number;
  packageId: string;
  packageName: string;
  durationMinutes: number;
  entryTime: string; // ISO String
  scheduledExitTime: string; // ISO String
  actualExitTime?: string; // ISO String
  status: SessionStatus;
  swimmingCharges: number;
  extensionCharges: number;
  rentalCharges: number;
  totalCharges: number;
  paidAmount: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  extensions: ExtensionRecord[];
  rentals: RentalItem[];
  payments: PaymentRecord[];
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  defaultRate: number;
  defaultDeposit: number;
  totalStock: number;
  availableStock: number;
}

export interface AlertNotification {
  id: string;
  sessionId: string;
  customerName: string;
  type: 'expiring_soon' | 'expired';
  message: string;
  timestamp: string;
  isDismissed: boolean;
}

export interface Settings {
  businessName: string;
  phone: string;
  address: string;
  email: string;
  currency: string;
  timezone: string;
  gstNumber: string;
  baseRatePerHour: number;
  overtimeRatePer15Min: number;
  fiveMinuteWarning: boolean;
  expiryAlarm: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultFilter: string;
}

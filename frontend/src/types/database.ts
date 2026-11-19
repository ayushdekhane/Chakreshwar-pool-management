export interface DbCustomer {
  id: string;
  name: string;
  mobile: string;
  created_at: string;
}

export type DbSessionStatus = 'active' | 'expired' | 'completed';
export type DbEquipmentType = 'rental' | 'sale';

export interface DbSession {
  id: string;
  customer_id: string;
  group_code: string | null;
  group_name?: string | null;
  people_count?: number;
  package_id?: string | null;
  package_name?: string | null;
  entry_time: string;
  scheduled_exit_time: string;
  actual_exit_time: string | null;
  locker_numbers?: number[] | null;
  duration_minutes: number;
  actual_duration_minutes: number | null;
  session_amount: number;
  costume_used: boolean;
  penalty_charge?: number;
  penalty_applied?: boolean;
  penalty_minutes?: number;
  penalty_intervals?: number;
  status: DbSessionStatus;
  created_at: string;
  // Joins
  customer?: DbCustomer;
  customers?: DbCustomer;
  payments?: DbPayment[];
  costume_rentals?: DbCostumeRental[];
}

export type DbPaymentMethod = 'cash' | 'online' | 'google_pay' | 'phonepe' | 'paytm' | 'other';
export type DbTransactionType = 'payment';

export interface DbPayment {
  id: string;
  session_id: string;
  amount: number;
  payment_method: DbPaymentMethod;
  transaction_type: DbTransactionType;
  payment_date: string;
  notes: string | null;
  created_at: string;
  session?: DbSession;
  sessions?: DbSession;
}

export interface DbCostumeRental {
  id: string;
  session_id: string | null;
  equipment_id?: string | null;
  item_name: string;
  customer_name?: string | null;
  size?: string | null;
  equipment_type?: DbEquipmentType;
  quantity: number;
  returned_quantity: number;
  rental_charge: number;
  created_at: string;
  session?: DbSession;
  sessions?: DbSession;
}

export interface DbEquipment {
  id: string;
  name: string;
  equipment_type: DbEquipmentType;
  available_for_sale: boolean;
  sale_rate: number;
  sizes: string[];
  default_rate: number;
  default_deposit: number;
  total_stock: number;
  available_stock: number;
  updated_at: string;
}

export interface DbAppSettings {
  id: string;
  settings: unknown;
  updated_at: string;
}

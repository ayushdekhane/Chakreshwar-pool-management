export interface DbCustomer {
  id: string;
  name: string;
  mobile: string;
  created_at: string;
}

export type DbSessionStatus = 'active' | 'expired' | 'completed';

export interface DbSession {
  id: string;
  customer_id: string;
  group_code: string | null;
  group_name?: string | null;
  people_count?: number;
  entry_time: string;
  scheduled_exit_time: string;
  actual_exit_time: string | null;
  duration_minutes: number;
  actual_duration_minutes: number | null;
  session_amount: number;
  costume_used: boolean;
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
  session_id: string;
  item_name: string;
  quantity: number;
  returned_quantity: number;
  rental_charge: number;
  created_at: string;
  session?: DbSession;
  sessions?: DbSession;
}

export interface DbRentalEquipment {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  default_rate: number;
  default_deposit: number;
  total_stock: number;
  available_stock: number;
  updated_at: string;
}

import {
  DbCustomer,
  DbSessionStatus,
  DbPaymentMethod,
  DbTransactionType,
  DbRentalEquipment,
} from '../../types/database';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

export interface LocalSyncMetadata {
  _syncStatus: SyncStatus;
  _localOnly: boolean;
  _lastSyncedAt?: string;
  _syncError?: string | null;
}

export type LocalCustomer = DbCustomer & LocalSyncMetadata;

export interface LocalSession extends LocalSyncMetadata {
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
}

export interface LocalPayment extends LocalSyncMetadata {
  id: string;
  session_id: string;
  amount: number;
  payment_method: DbPaymentMethod;
  transaction_type: DbTransactionType;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface LocalCostumeRental extends LocalSyncMetadata {
  id: string;
  session_id: string;
  item_name: string;
  quantity: number;
  returned_quantity: number;
  rental_charge: number;
  created_at: string;
}

export type LocalRentalEquipment = DbRentalEquipment & { _lastSyncedAt?: string };

export type QueueEntityType = 'customer' | 'session' | 'payment' | 'rental' | 'equipment';
export type QueueOperation = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string; // Queue entry UUID
  entityType: QueueEntityType;
  entityId: string; // The ID of the record (e.g. session.id, payment.id)
  operation: QueueOperation;
  payload: Record<string, any>; // Clean payload for Supabase
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: number;
  lastError?: string | null;
  createdAt: string;
  dependencyId?: string | null; // e.g., session depends on customer ID
  idempotencyKey: string;
}

export interface SyncMetadataRecord {
  key: string;
  value: any;
  updatedAt: string;
}

export interface StorageStats {
  customersCount: number;
  sessionsCount: number;
  paymentsCount: number;
  rentalsCount: number;
  equipmentCount: number;
  pendingQueueCount: number;
  failedQueueCount: number;
  lastSyncedAt: string | null;
  isStorageHealthy: boolean;
  storageEstimate?: {
    usage?: number;
    quota?: number;
  };
}

export interface SyncResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ id: string; error: string; entityType: string }>;
}

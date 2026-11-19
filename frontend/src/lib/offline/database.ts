import Dexie, { Table } from 'dexie';
import {
  LocalCustomer,
  LocalSession,
  LocalPayment,
  LocalCostumeRental,
  LocalEquipment,
  SyncQueueItem,
  SyncMetadataRecord,
} from './sync-types';

export class SerenityOfflineDb extends Dexie {
  customers!: Table<LocalCustomer, string>;
  sessions!: Table<LocalSession, string>;
  payments!: Table<LocalPayment, string>;
  costume_rentals!: Table<LocalCostumeRental, string>;
  equipment!: Table<LocalEquipment, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  sync_metadata!: Table<SyncMetadataRecord, string>;

  constructor() {
    super('serenity_sports_club_offline');

    this.version(1).stores({
      customers: 'id, mobile, name, created_at, _syncStatus, _localOnly',
      sessions: 'id, customer_id, group_code, status, entry_time, scheduled_exit_time, _syncStatus, _localOnly',
      payments: 'id, session_id, payment_date, payment_method, _syncStatus, _localOnly',
      costume_rentals: 'id, session_id, item_name, _syncStatus, _localOnly',
      rental_equipment: 'id, name, updated_at',
      sync_queue: 'id, entityType, entityId, operation, status, attempts, createdAt, dependencyId, idempotencyKey',
      sync_metadata: 'key, updatedAt',
    });

    this.version(2)
      .stores({
        customers: 'id, mobile, name, created_at, _syncStatus, _localOnly',
        sessions: 'id, customer_id, group_code, status, entry_time, scheduled_exit_time, _syncStatus, _localOnly',
        payments: 'id, session_id, payment_date, payment_method, _syncStatus, _localOnly',
        costume_rentals: 'id, session_id, item_name, _syncStatus, _localOnly',
        equipment: 'id, name, updated_at',
        rental_equipment: 'id, name, updated_at',
        sync_queue: 'id, entityType, entityId, operation, status, attempts, createdAt, dependencyId, idempotencyKey',
        sync_metadata: 'key, updatedAt',
      })
      .upgrade(async (transaction) => {
        const oldEquipment = await transaction.table('rental_equipment').toArray();
        await transaction.table('equipment').bulkPut(oldEquipment);
        await transaction.table('rental_equipment').clear();
      });

    this.version(3).stores({
      customers: 'id, mobile, name, created_at, _syncStatus, _localOnly',
      sessions: 'id, customer_id, group_code, status, entry_time, scheduled_exit_time, _syncStatus, _localOnly',
      payments: 'id, session_id, payment_date, payment_method, _syncStatus, _localOnly',
      costume_rentals: 'id, session_id, item_name, _syncStatus, _localOnly',
      equipment: 'id, name, updated_at',
      rental_equipment: null,
      sync_queue: 'id, entityType, entityId, operation, status, attempts, createdAt, dependencyId, idempotencyKey',
      sync_metadata: 'key, updatedAt',
    });
  }
}

export const offlineDb = new SerenityOfflineDb();

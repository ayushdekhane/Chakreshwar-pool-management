import { offlineDb } from './database';
import { syncQueue } from './sync-queue';
import {
  LocalCustomer,
  LocalSession,
  LocalPayment,
  LocalCostumeRental,
  LocalEquipment,
  StorageStats,
} from './sync-types';
import {
  DbCustomer,
  DbSession,
  DbPayment,
  DbCostumeRental,
  DbEquipment,
} from '../../types/database';

export const offlineStorage = {
  /**
   * Load previously persisted data from IndexedDB
   */
  async hydrateOfflineData(): Promise<{
    customers: LocalCustomer[];
    sessions: LocalSession[];
    payments: LocalPayment[];
    rentals: LocalCostumeRental[];
    equipment: LocalEquipment[];
  }> {
    const [customers, sessions, payments, rentals, equipment] = await Promise.all([
      offlineDb.customers.toArray(),
      offlineDb.sessions.toArray(),
      offlineDb.payments.toArray(),
      offlineDb.costume_rentals.toArray(),
      offlineDb.equipment.toArray(),
    ]);

    return { customers, sessions, payments, rentals, equipment };
  },

  /**
   * Cache Supabase snapshot into IndexedDB.
   * Crucial rule: Never overwrite local records that have pending offline mutations!
   */
  async saveSnapshotToStorage(data: {
    customers: DbCustomer[];
    sessions: DbSession[];
    payments: DbPayment[];
    rentals: DbCostumeRental[];
    equipment: DbEquipment[];
  }): Promise<void> {
    const pendingItems = await syncQueue.getProcessableItems();
    const pendingCustomerIds = new Set(
      pendingItems.filter((i) => i.entityType === 'customer').map((i) => i.entityId)
    );
    const pendingSessionIds = new Set(
      pendingItems.filter((i) => i.entityType === 'session').map((i) => i.entityId)
    );
    const pendingPaymentIds = new Set(
      pendingItems.filter((i) => i.entityType === 'payment').map((i) => i.entityId)
    );
    const pendingRentalIds = new Set(
      pendingItems.filter((i) => i.entityType === 'rental').map((i) => i.entityId)
    );
    const pendingEquipmentIds = new Set(
      pendingItems
        .filter((i) => i.entityType === 'equipment' && i.operation === 'update')
        .map((i) => i.entityId)
    );
    const pendingEquipmentDeleteIds = new Set(
      pendingItems
        .filter((i) => i.entityType === 'equipment' && i.operation === 'delete')
        .map((i) => i.entityId)
    );

    const now = new Date().toISOString();

    await offlineDb.transaction(
      'rw',
      [
        offlineDb.customers,
        offlineDb.sessions,
        offlineDb.payments,
        offlineDb.costume_rentals,
        offlineDb.equipment,
      ],
      async () => {
        // 1. Customers
        for (const cust of data.customers) {
          if (!pendingCustomerIds.has(cust.id)) {
            await offlineDb.customers.put({
              ...cust,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: now,
            });
          }
        }

        // 2. Sessions
        for (const sess of data.sessions) {
          if (!pendingSessionIds.has(sess.id)) {
            const { customer, customers, payments, costume_rentals, ...sessionRow } = sess;
            await offlineDb.sessions.put({
              ...sessionRow,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: now,
            });
          }
        }

        // 3. Payments
        for (const pay of data.payments) {
          if (!pendingPaymentIds.has(pay.id)) {
            const { session, sessions, ...paymentRow } = pay;
            await offlineDb.payments.put({
              ...paymentRow,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: now,
            });
          }
        }

        // 4. Rentals
        for (const rent of data.rentals) {
          if (!pendingRentalIds.has(rent.id)) {
            const { session, sessions, ...rentalRow } = rent;
            await offlineDb.costume_rentals.put({
              ...rentalRow,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: now,
            });
          }
        }

        // 5. Equipment
        const remoteEquipmentIds = new Set(data.equipment.map((item) => item.id));
        const cachedEquipment = await offlineDb.equipment.toArray();
        for (const item of cachedEquipment) {
          if (
            pendingEquipmentDeleteIds.has(item.id) ||
            (!remoteEquipmentIds.has(item.id) && !pendingEquipmentIds.has(item.id))
          ) {
            await offlineDb.equipment.delete(item.id);
          }
        }
        for (const eq of data.equipment) {
          if (!pendingEquipmentIds.has(eq.id)) {
            await offlineDb.equipment.put({
              ...eq,
              _lastSyncedAt: now,
            });
          }
        }

        // Remove stale cache records that are absent from the server snapshot.
        // This prevents deleted database entries from reappearing after a refresh.
        const remoteCustomerIds = new Set(data.customers.map((item) => item.id));
        const remoteSessionIds = new Set(data.sessions.map((item) => item.id));
        const remotePaymentIds = new Set(data.payments.map((item) => item.id));
        const remoteRentalIds = new Set(data.rentals.map((item) => item.id));

        const [cachedCustomers, cachedSessions, cachedPayments, cachedRentals] =
          await Promise.all([
            offlineDb.customers.toArray(),
            offlineDb.sessions.toArray(),
            offlineDb.payments.toArray(),
            offlineDb.costume_rentals.toArray(),
          ]);

        await offlineDb.customers.bulkDelete(
          cachedCustomers
            .filter((item) => !remoteCustomerIds.has(item.id) && !pendingCustomerIds.has(item.id))
            .map((item) => item.id)
        );
        await offlineDb.sessions.bulkDelete(
          cachedSessions
            .filter((item) => !remoteSessionIds.has(item.id) && !pendingSessionIds.has(item.id))
            .map((item) => item.id)
        );
        await offlineDb.payments.bulkDelete(
          cachedPayments
            .filter((item) => !remotePaymentIds.has(item.id) && !pendingPaymentIds.has(item.id))
            .map((item) => item.id)
        );
        await offlineDb.costume_rentals.bulkDelete(
          cachedRentals
            .filter((item) => !remoteRentalIds.has(item.id) && !pendingRentalIds.has(item.id))
            .map((item) => item.id)
        );
      }
    );
  },

  /**
   * Save a single customer offline
   */
  async saveLocalCustomer(customer: LocalCustomer): Promise<void> {
    await offlineDb.customers.put(customer);
  },

  /**
   * Save a single session offline
   */
  async saveLocalSession(session: LocalSession): Promise<void> {
    await offlineDb.sessions.put(session);
  },

  /**
   * Save a single payment offline
   */
  async saveLocalPayment(payment: LocalPayment): Promise<void> {
    await offlineDb.payments.put(payment);
  },

  /**
   * Save a single rental offline
   */
  async saveLocalRental(rental: LocalCostumeRental): Promise<void> {
    await offlineDb.costume_rentals.put(rental);
  },

  async saveLocalEquipment(equipment: DbEquipment): Promise<void> {
    await offlineDb.equipment.put({
      ...equipment,
      _lastSyncedAt: new Date().toISOString(),
    });
  },

  async deleteLocalEquipment(id: string): Promise<void> {
    await offlineDb.equipment.delete(id);
  },

  /**
   * Gather comprehensive storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    let isStorageHealthy = true;
    try {
      const [
        customersCount,
        sessionsCount,
        paymentsCount,
        rentalsCount,
        equipmentCount,
        queueCounts,
        lastSyncMeta,
      ] = await Promise.all([
        offlineDb.customers.count(),
        offlineDb.sessions.count(),
        offlineDb.payments.count(),
        offlineDb.costume_rentals.count(),
        offlineDb.equipment.count(),
        syncQueue.getCounts(),
        offlineDb.sync_metadata.get('last_successful_sync'),
      ]);

      let storageEstimate: { usage?: number; quota?: number } | undefined;
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          storageEstimate = {
            usage: estimate.usage,
            quota: estimate.quota,
          };
        } catch {
          // ignore estimate error
        }
      }

      return {
        customersCount,
        sessionsCount,
        paymentsCount,
        rentalsCount,
        equipmentCount,
        pendingQueueCount: queueCounts.pending,
        failedQueueCount: queueCounts.failed,
        lastSyncedAt: lastSyncMeta ? lastSyncMeta.value : null,
        isStorageHealthy,
        storageEstimate,
      };
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      return {
        customersCount: 0,
        sessionsCount: 0,
        paymentsCount: 0,
        rentalsCount: 0,
        equipmentCount: 0,
        pendingQueueCount: 0,
        failedQueueCount: 0,
        lastSyncedAt: null,
        isStorageHealthy: false,
      };
    }
  },
};

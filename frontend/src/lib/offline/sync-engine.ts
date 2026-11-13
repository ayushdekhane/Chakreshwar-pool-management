import { supabase, isSupabaseConfigured } from '../supabase';
import { authService } from '../../services/authService';
import { offlineDb } from './database';
import { syncQueue } from './sync-queue';
import { conflictResolver } from './conflict-resolver';
import { connectivity } from './connectivity';
import { SyncResult, SyncQueueItem } from './sync-types';
import { isValidUuid } from '../../utils';

type SyncListener = (isSyncing: boolean, lastResult?: SyncResult) => void;

class SyncEngine {
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private lastSyncedAt: string | null = null;

  constructor() {
    this.initSyncTriggers();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.isSyncing);
    return () => this.listeners.delete(listener);
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public async getLastSyncedAt(): Promise<string | null> {
    if (this.lastSyncedAt) return this.lastSyncedAt;
    const meta = await offlineDb.sync_metadata.get('last_successful_sync');
    this.lastSyncedAt = meta ? meta.value : null;
    return this.lastSyncedAt;
  }

  /**
   * Main synchronization execution method
   */
  public async syncNow(): Promise<SyncResult> {
    if (!isSupabaseConfigured) {
      return { totalProcessed: 0, successCount: 0, failureCount: 0, errors: [] };
    }

    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress. Skipping duplicate run.');
      return { totalProcessed: 0, successCount: 0, failureCount: 0, errors: [] };
    }

    // Check staff auth
    const session = await authService.getSession();
    if (!session?.user) {
      console.log('[SyncEngine] Staff is not authenticated. Postponing sync until login.');
      return { totalProcessed: 0, successCount: 0, failureCount: 0, errors: [] };
    }

    // Check online status
    const isOnline = await connectivity.checkRealConnection();
    if (!isOnline) {
      console.log('[SyncEngine] Network is offline. Postponing sync.');
      return { totalProcessed: 0, successCount: 0, failureCount: 0, errors: [] };
    }

    this.isSyncing = true;
    this.notifyListeners();

    const result: SyncResult = {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    try {
      const pendingItems = await syncQueue.getProcessableItems();
      result.totalProcessed = pendingItems.length;

      for (const item of pendingItems) {
        try {
          await syncQueue.markSyncing(item.id);
          await this.processItem(item);
          await syncQueue.markCompleted(item.id);
          result.successCount++;
        } catch (err: any) {
          result.failureCount++;
          const errorMessage = err.message || 'Unknown synchronization error';
          console.error(`[SyncEngine] Failed to sync ${item.entityType} (${item.entityId}):`, errorMessage);

          const isAuthError = err.status === 401 || errorMessage.includes('JWT') || errorMessage.includes('unauthorized');
          const isPermanent = err.code === '23505' || err.code === '22P02' || isAuthError;

          await syncQueue.markFailed(item.id, errorMessage, isPermanent);
          result.errors.push({
            id: item.id,
            entityType: item.entityType,
            error: errorMessage,
          });

          // If auth expired mid-sync, abort further queue processing
          if (isAuthError) {
            break;
          }
        }
      }

      // Record successful sync metadata
      const nowIso = new Date().toISOString();
      this.lastSyncedAt = nowIso;
      await offlineDb.sync_metadata.put({
        key: 'last_successful_sync',
        value: nowIso,
        updatedAt: nowIso,
      });
    } catch (globalErr: any) {
      console.error('[SyncEngine] Unexpected error during sync cycle:', globalErr);
    } finally {
      this.isSyncing = false;
      this.notifyListeners(result);
    }

    return result;
  }

  /**
   * Process a single queued mutation
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operation, payload } = item;

    switch (entityType) {
      case 'customer': {
        if (operation === 'insert') {
          const resolution = await conflictResolver.resolveCustomerConflict(entityId, payload as any);
          if (resolution.action === 'skip') {
            return;
          }

          // Strip local-only metadata before sending to Supabase
          const { id: _ignoredId, _syncStatus, _localOnly, _lastSyncedAt, _syncError, ...cleanData } = payload;
          const { data: newCust, error } = await supabase
            .from('customers')
            .insert(cleanData)
            .select()
            .single();

          if (error) throw error;
          if (newCust) {
            // Update local customer with server-assigned UUID if different
            await offlineDb.transaction('rw', [offlineDb.customers, offlineDb.sessions, offlineDb.sync_queue], async () => {
              if (newCust.id !== entityId) {
                const depSessions = await offlineDb.sessions.where('customer_id').equals(entityId).toArray();
                for (const s of depSessions) {
                  await offlineDb.sessions.update(s.id, { customer_id: newCust.id });
                }
                const depQueue = await offlineDb.sync_queue.toArray();
                for (const q of depQueue) {
                  if (q.dependencyId === entityId) {
                    await offlineDb.sync_queue.update(q.id, {
                      dependencyId: newCust.id,
                      payload: { ...q.payload, customer_id: newCust.id },
                    });
                  }
                }
                await offlineDb.customers.delete(entityId);
              }

              await offlineDb.customers.put({
                ...newCust,
                _syncStatus: 'synced',
                _localOnly: false,
                _lastSyncedAt: new Date().toISOString(),
              });
            });
          }
        } else if (operation === 'update') {
          const { _syncStatus, _localOnly, _lastSyncedAt, _syncError, ...cleanData } = payload;
          const { error } = await supabase.from('customers').update(cleanData).eq('id', entityId);
          if (error) throw error;
          await offlineDb.customers.update(entityId, {
            _syncStatus: 'synced',
            _localOnly: false,
            _lastSyncedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'session': {
        if (operation === 'insert') {
          // If customer_id in session is a temporary offline ID, ensure it was resolved
          let targetCustomerId = payload.customer_id;
          const localCust = await offlineDb.customers.get(targetCustomerId);
          if (localCust && localCust.id !== targetCustomerId) {
            targetCustomerId = localCust.id;
          }

          // Strip local and relational data before inserting
          const {
            _syncStatus,
            _localOnly,
            _lastSyncedAt,
            _syncError,
            customer,
            customers,
            payments,
            costume_rentals,
            ...cleanData
          } = payload;

          cleanData.customer_id = targetCustomerId;

          // If the ID is a valid client UUID, include it; or if inserting, preserve deterministic ID
          const insertPayload = isValidUuid(entityId)
            ? { id: entityId, ...cleanData }
            : cleanData;

          const { data: newSession, error } = await supabase
            .from('sessions')
            .upsert(insertPayload, { onConflict: 'id' })
            .select()
            .single();

          if (error) throw error;
          if (newSession) {
            await offlineDb.sessions.put({
              ...newSession,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: new Date().toISOString(),
            });
          }
        } else if (operation === 'update') {
          const {
            _syncStatus,
            _localOnly,
            _lastSyncedAt,
            _syncError,
            customer,
            customers,
            payments,
            costume_rentals,
            ...cleanData
          } = payload;

          const { error } = await supabase.from('sessions').update(cleanData).eq('id', entityId);
          if (error) throw error;
          await offlineDb.sessions.update(entityId, {
            ...cleanData,
            _syncStatus: 'synced',
            _localOnly: false,
            _lastSyncedAt: new Date().toISOString(),
          });
        } else if (operation === 'delete') {
          if (isValidUuid(entityId)) {
            const { error } = await supabase.from('sessions').delete().eq('id', entityId);
            if (error) throw error;
          }
          await offlineDb.sessions.delete(entityId);
        }
        break;
      }

      case 'payment': {
        if (operation === 'insert') {
          const conflict = await conflictResolver.resolvePaymentConflict(
            entityId,
            payload.session_id,
            payload.amount
          );
          if (conflict.action === 'skip') {
            await offlineDb.payments.update(entityId, {
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: new Date().toISOString(),
            });
            return;
          }

          const {
            _syncStatus,
            _localOnly,
            _lastSyncedAt,
            _syncError,
            session,
            sessions,
            ...cleanData
          } = payload;

          const insertPayload = isValidUuid(entityId)
            ? { id: entityId, ...cleanData }
            : cleanData;

          const { data: newPayment, error } = await supabase
            .from('payments')
            .insert(insertPayload)
            .select()
            .single();

          if (error) throw error;
          if (newPayment) {
            await offlineDb.payments.put({
              ...newPayment,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: new Date().toISOString(),
            });
          }
        } else if (operation === 'delete') {
          if (isValidUuid(entityId)) {
            const { error } = await supabase.from('payments').delete().eq('id', entityId);
            if (error) throw error;
          }
          await offlineDb.payments.delete(entityId);
        }
        break;
      }

      case 'rental': {
        if (operation === 'insert') {
          const {
            _syncStatus,
            _localOnly,
            _lastSyncedAt,
            _syncError,
            session,
            sessions,
            ...cleanData
          } = payload;

          const insertPayload = isValidUuid(entityId)
            ? { id: entityId, ...cleanData }
            : cleanData;

          const { data: newRental, error } = await supabase
            .from('costume_rentals')
            .upsert(insertPayload, { onConflict: 'id' })
            .select()
            .single();

          if (error) throw error;
          if (newRental) {
            await offlineDb.costume_rentals.put({
              ...newRental,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: new Date().toISOString(),
            });
          }
        } else if (operation === 'update') {
          const {
            _syncStatus,
            _localOnly,
            _lastSyncedAt,
            _syncError,
            session,
            sessions,
            ...cleanData
          } = payload;

          const { error } = await supabase
            .from('costume_rentals')
            .update(cleanData)
            .eq('id', entityId);

          if (error) throw error;
          await offlineDb.costume_rentals.update(entityId, {
            ...cleanData,
            _syncStatus: 'synced',
            _localOnly: false,
            _lastSyncedAt: new Date().toISOString(),
          });
        } else if (operation === 'delete') {
          if (isValidUuid(entityId)) {
            const { error } = await supabase.from('costume_rentals').delete().eq('id', entityId);
            if (error) throw error;
          }
          await offlineDb.costume_rentals.delete(entityId);
        }
        break;
      }

      case 'equipment': {
        if (operation === 'update') {
          const { _lastSyncedAt, ...cleanData } = payload;
          const { error } = await supabase
            .from('rental_equipment')
            .upsert(cleanData, { onConflict: 'id' });
          if (error) throw error;
          await offlineDb.rental_equipment.put({
            ...cleanData as any,
            _lastSyncedAt: new Date().toISOString(),
          });
        }
        break;
      }
    }
  }

  private notifyListeners(lastResult?: SyncResult) {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isSyncing, lastResult);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  /**
   * Listen to browser lifecycle triggers:
   * - online event
   * - visibility change to visible
   * - periodic auto-sync
   */
  private initSyncTriggers() {
    if (typeof window === 'undefined') return;

    connectivity.subscribe((online) => {
      if (online) {
        this.syncNow();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && connectivity.isOnline()) {
        this.syncNow();
      }
    });

    // Auto-sync every 60 seconds if online
    setInterval(() => {
      if (connectivity.isOnline() && document.visibilityState === 'visible') {
        this.syncNow();
      }
    }, 60000);
  }
}

export const syncEngine = new SyncEngine();


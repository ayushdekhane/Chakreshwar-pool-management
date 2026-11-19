import { offlineDb } from './database';
import { SyncQueueItem, QueueEntityType, QueueOperation } from './sync-types';

export const syncQueue = {
  /**
   * Enqueue a new mutation for Supabase synchronization.
   * Uses deterministic idempotencyKey to prevent duplicate queuing.
   */
  async enqueue(params: {
    entityType: QueueEntityType;
    entityId: string;
    operation: QueueOperation;
    payload: Record<string, any>;
    dependencyId?: string | null;
  }): Promise<SyncQueueItem> {
    const idempotencyKey = `${params.operation}:${params.entityType}:${params.entityId}`;

    // Check if an existing pending mutation exists for this entity
    const existing = await offlineDb.sync_queue
      .where('idempotencyKey')
      .equals(idempotencyKey)
      .first();

    if (existing && existing.status !== 'completed') {
      // Merge payload and reset retry count
      let mergedPayload = { ...existing.payload, ...params.payload };
      if (
        params.entityType === 'equipment' &&
        typeof existing.payload.available_stock_delta === 'number' &&
        typeof params.payload.available_stock_delta === 'number'
      ) {
        mergedPayload = {
          ...existing.payload,
          ...params.payload,
          available_stock_delta:
            existing.payload.available_stock_delta + params.payload.available_stock_delta,
        };
      }
      const updated: SyncQueueItem = {
        ...existing,
        payload: mergedPayload,
        status: 'pending',
        attempts: 0,
        lastError: null,
        nextRetryAt: undefined,
      };
      await offlineDb.sync_queue.put(updated);
      return updated;
    }

    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      payload: params.payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
      dependencyId: params.dependencyId || null,
      idempotencyKey,
    };

    await offlineDb.sync_queue.put(queueItem);
    return queueItem;
  },

  /**
   * Get all pending queue items in dependency-safe order:
   * 1. customers
   * 2. sessions
   * 3. payments & rentals
   * 4. equipment
   */
  async getProcessableItems(): Promise<SyncQueueItem[]> {
    const now = Date.now();
    const all = await offlineDb.sync_queue.toArray();

    const pending = all.filter((item) => {
      if (item.status === 'completed') return false;
      if (item.status === 'syncing') return true; // may need recovery
      if (item.status === 'pending') return true;
      if (item.status === 'failed' && item.attempts < item.maxAttempts) {
        return !item.nextRetryAt || item.nextRetryAt <= now;
      }
      return false;
    });

    const priority: Record<QueueEntityType, number> = {
      customer: 1,
      session: 2,
      rental: 3,
      payment: 4,
      equipment: 5,
      settings: 6,
    };

    return pending.sort((a, b) => {
      const pDiff = (priority[a.entityType] || 99) - (priority[b.entityType] || 99);
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  },

  async markSyncing(id: string): Promise<void> {
    await offlineDb.sync_queue.update(id, { status: 'syncing' });
  },

  /**
   * Remove successfully synchronized queue item permanently.
   * As per requirement: Never delete a queued operation before the corresponding Supabase operation is confirmed.
   */
  async markCompleted(id: string): Promise<void> {
    await offlineDb.sync_queue.delete(id);
  },

  /**
   * Mark item as failed with exponential backoff or permanent failure.
   */
  async markFailed(id: string, error: string, isPermanent: boolean = false): Promise<void> {
    const item = await offlineDb.sync_queue.get(id);
    if (!item) return;

    const newAttempts = item.attempts + 1;
    const isExhausted = isPermanent || newAttempts >= item.maxAttempts;
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const backoffMs = Math.min(32000, Math.pow(2, newAttempts) * 1000);

    await offlineDb.sync_queue.update(id, {
      status: 'failed',
      attempts: newAttempts,
      lastError: error,
      nextRetryAt: isExhausted ? undefined : Date.now() + backoffMs,
    });
  },

  async getCounts(): Promise<{ pending: number; failed: number }> {
    const all = await offlineDb.sync_queue.toArray();
    let pending = 0;
    let failed = 0;

    for (const item of all) {
      if (item.status === 'pending' || item.status === 'syncing') {
        pending++;
      } else if (item.status === 'failed') {
        failed++;
      }
    }

    return { pending, failed };
  },

  async clearFailedQueue(): Promise<void> {
    const failedItems = await offlineDb.sync_queue.where('status').equals('failed').toArray();
    const ids = failedItems.map((i) => i.id);
    await offlineDb.sync_queue.bulkDelete(ids);
  },

  async retryFailedQueue(): Promise<void> {
    const failedItems = await offlineDb.sync_queue.where('status').equals('failed').toArray();
    await offlineDb.sync_queue.bulkPut(
      failedItems.map((item) => ({
        ...item,
        status: 'pending',
        attempts: 0,
        lastError: null,
        nextRetryAt: undefined,
      }))
    );
  },
};

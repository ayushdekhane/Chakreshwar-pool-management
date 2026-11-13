import { offlineDb } from './database';
import { supabase } from '../supabase';
import { isValidUuid } from '../../utils';

export interface ConflictResolution {
  resolved: boolean;
  action: 'proceed' | 'skip' | 'update_payload' | 'error';
  cleanPayload?: Record<string, any>;
  message?: string;
}

export const conflictResolver = {
  /**
   * Pre-sync validation and conflict resolution for customers.
   * If customer with same mobile already exists on Supabase, re-use server UUID!
   */
  async resolveCustomerConflict(
    localId: string,
    payload: { name: string; mobile: string }
  ): Promise<ConflictResolution> {
    const cleanedMobile = payload.mobile.trim();
    if (!cleanedMobile) {
      return { resolved: false, action: 'error', message: 'Customer phone number is required.' };
    }

    try {
      // Check if server already has customer with this mobile
      const { data: serverCustomer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', cleanedMobile)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Conflict check customer error:', error.message);
        return { resolved: true, action: 'proceed', cleanPayload: payload };
      }

      if (serverCustomer && isValidUuid(serverCustomer.id)) {
        // Customer already exists on server!
        // We must update dependent local sessions with this server customer ID!
        if (serverCustomer.id !== localId) {
          await offlineDb.transaction('rw', [offlineDb.customers, offlineDb.sessions, offlineDb.sync_queue], async () => {
            // Update local customer
            await offlineDb.customers.put({
              ...serverCustomer,
              _syncStatus: 'synced',
              _localOnly: false,
              _lastSyncedAt: new Date().toISOString(),
            });

            // If localId was different, update dependent local sessions
            const depSessions = await offlineDb.sessions.where('customer_id').equals(localId).toArray();
            for (const sess of depSessions) {
              await offlineDb.sessions.update(sess.id, { customer_id: serverCustomer.id });
            }

            // Also update any pending queue payloads referring to old localId
            const pendingQueue = await offlineDb.sync_queue.toArray();
            for (const q of pendingQueue) {
              if (q.dependencyId === localId) {
                await offlineDb.sync_queue.update(q.id, {
                  dependencyId: serverCustomer.id,
                  payload: { ...q.payload, customer_id: serverCustomer.id },
                });
              }
            }

            // Delete old temporary local customer record if it differed
            if (localId !== serverCustomer.id) {
              await offlineDb.customers.delete(localId);
            }
          });

          return {
            resolved: true,
            action: 'skip',
            message: `Reused existing server customer ID (${serverCustomer.id}) for mobile ${cleanedMobile}`,
          };
        }
      }

      return { resolved: true, action: 'proceed', cleanPayload: payload };
    } catch (err: any) {
      return { resolved: true, action: 'proceed', cleanPayload: payload };
    }
  },

  /**
   * Conflict check for payments:
   * Rule: Never duplicate or silently overwrite confirmed payments.
   */
  async resolvePaymentConflict(
    paymentId: string,
    sessionId: string,
    amount: number
  ): Promise<ConflictResolution> {
    if (!isValidUuid(paymentId)) {
      return { resolved: true, action: 'proceed' };
    }

    try {
      const { data: existingServerPayment } = await supabase
        .from('payments')
        .select('id, amount, payment_date')
        .eq('id', paymentId)
        .maybeSingle();

      if (existingServerPayment) {
        // Payment is already confirmed on server!
        return {
          resolved: true,
          action: 'skip',
          message: `Payment ${paymentId} already confirmed on server. Skipping duplicate insert.`,
        };
      }

      return { resolved: true, action: 'proceed' };
    } catch {
      return { resolved: true, action: 'proceed' };
    }
  },

  /**
   * Conflict check for equipment rentals:
   * Rule: Prevent negative stock on server.
   */
  async resolveEquipmentStock(
    equipmentId: string,
    quantityDelta: number // negative if renting, positive if returning
  ): Promise<ConflictResolution> {
    try {
      const { data: serverItem, error } = await supabase
        .from('rental_equipment')
        .select('*')
        .eq('id', equipmentId)
        .maybeSingle();

      if (error || !serverItem) {
        return { resolved: true, action: 'proceed' };
      }

      const newAvailable = Math.max(0, Math.min(serverItem.total_stock, serverItem.available_stock + quantityDelta));
      return {
        resolved: true,
        action: 'proceed',
        cleanPayload: { available_stock: newAvailable },
      };
    } catch {
      return { resolved: true, action: 'proceed' };
    }
  },
};


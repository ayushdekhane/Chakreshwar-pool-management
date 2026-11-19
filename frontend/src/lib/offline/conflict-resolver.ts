
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
   * Pre-sync validation for customer inserts.
   * Phone numbers are allowed to repeat, so no existing customer is reused.
   */
  async resolveCustomerConflict(
    localId: string,
    payload: { name: string; mobile: string }
  ): Promise<ConflictResolution> {
    const cleanedMobile = payload.mobile.trim();
    if (!cleanedMobile) {
      return { resolved: false, action: 'error', message: 'Customer phone number is required.' };
    }

    return { resolved: true, action: 'proceed', cleanPayload: payload };
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
        .from('equipment')
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

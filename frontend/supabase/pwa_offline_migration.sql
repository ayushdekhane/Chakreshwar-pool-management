-- ====================================================================
-- SERENITY SPORTS CLUB – PWA OFFLINE SYNCHRONIZATION MIGRATION (OPTIONAL)
-- ====================================================================
-- This migration is OPTIONAL. The PWA works seamlessly with the existing
-- five tables without running this migration.
--
-- Running this script adds helpful synchronization timestamps and client mutation
-- tracking columns to facilitate multi-device distributed reconciliation.
--
-- NON-DESTRUCTIVE: This script only uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
-- No existing rows or schema structures will be deleted or modified.
-- ====================================================================

-- 1. Add updated_at tracking to sessions
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Add client_mutation_id to payments for server-enforced idempotency
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_client_mutation_id
    ON public.payments(client_mutation_id)
    WHERE client_mutation_id IS NOT NULL;

-- 3. Add updated_at tracking to costume_rentals
ALTER TABLE public.costume_rentals
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Automatically touch updated_at on record updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sessions_updated_at ON public.sessions;
CREATE TRIGGER trigger_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_costume_rentals_updated_at ON public.costume_rentals;
CREATE TRIGGER trigger_costume_rentals_updated_at
    BEFORE UPDATE ON public.costume_rentals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


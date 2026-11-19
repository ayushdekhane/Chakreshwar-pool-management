-- -- ====================================================================
-- -- CHAKRESHWAR SWIMMING POOL – SWIMMING POOL MANAGEMENT SYSTEM
-- -- Supabase PostgreSQL Database Schema
-- -- Tables: customers, sessions, payments, costume_rentals
-- -- ====================================================================

-- -- 1. Enable UUID Extension
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- ====================================================================
-- -- TABLE 1: customers
-- -- ====================================================================
-- CREATE TABLE IF NOT EXISTS public.customers (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     mobile TEXT NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- -- Index for fast customer lookup by mobile number (prevents duplicate registrations)
-- CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
-- CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- -- ====================================================================
-- -- TABLE 2: sessions
-- -- Every swimmer has a session record. Group members share the same group_code.
-- -- ====================================================================
-- CREATE TABLE IF NOT EXISTS public.sessions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
--     group_code TEXT,
--     entry_time TIMESTAMPTZ NOT NULL,
--     scheduled_exit_time TIMESTAMPTZ NOT NULL,
--     actual_exit_time TIMESTAMPTZ,
--     locker_numbers INTEGER[] NOT NULL DEFAULT '{}',
--     duration_minutes INTEGER NOT NULL DEFAULT 60,
--     actual_duration_minutes INTEGER,
--     session_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
--     costume_used BOOLEAN NOT NULL DEFAULT false,
--     status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
--
-- Apply frontend/supabase/lockers_migration.sql after the base schema to enforce
-- positive, unique, and conflict-free active locker allocations.

-- -- Indexes for active session timers, date filtering and group lookups
-- CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON public.sessions(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_sessions_group_code ON public.sessions(group_code);
-- CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
-- CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON public.sessions(entry_time);
-- CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_exit ON public.sessions(scheduled_exit_time);

-- -- ====================================================================
-- -- TABLE 3: payments
-- -- Complete audit ledger of cash, UPI, and card payments.
-- -- ====================================================================
-- CREATE TABLE IF NOT EXISTS public.payments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
--     amount NUMERIC(10, 2) NOT NULL,
--     payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'online', 'google_pay', 'phonepe', 'paytm', 'other')),
--     transaction_type TEXT NOT NULL CHECK (transaction_type = 'payment'),
--     payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
--     notes TEXT,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- -- Keep legacy refund rows intact while preventing new refund transactions.
-- ALTER TABLE public.payments
--     DROP CONSTRAINT IF EXISTS payments_transaction_type_check;
-- ALTER TABLE public.payments
--     ADD CONSTRAINT payments_transaction_type_check
--     CHECK (transaction_type = 'payment') NOT VALID;

-- -- Indexes for financial reconciliation and daily/monthly reports
-- CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments(session_id);
-- CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
-- CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method);
-- CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(transaction_type);

-- -- ====================================================================
-- -- TABLE 4: costume_rentals
-- -- Costume and equipment gear rentals attached to sessions.
-- -- ====================================================================
-- CREATE TABLE IF NOT EXISTS public.costume_rentals (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
--     item_name TEXT NOT NULL,
--     quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
--     returned_quantity INTEGER NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
--     rental_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- -- Indexes for rental tracking and returns
-- CREATE INDEX IF NOT EXISTS idx_costume_rentals_session ON public.costume_rentals(session_id);
-- CREATE INDEX IF NOT EXISTS idx_costume_rentals_created ON public.costume_rentals(created_at);

-- -- ====================================================================
-- -- ROW LEVEL SECURITY (RLS) POLICIES
-- -- Strict staff authentication access.
-- -- ====================================================================
-- ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.costume_rentals ENABLE ROW LEVEL SECURITY;

-- -- 1. Customers RLS Policies (Authenticated Staff)
-- DROP POLICY IF EXISTS "Staff select customers" ON public.customers;
-- CREATE POLICY "Staff select customers" ON public.customers
--     FOR SELECT TO authenticated USING (true);

-- DROP POLICY IF EXISTS "Staff insert customers" ON public.customers;
-- CREATE POLICY "Staff insert customers" ON public.customers
--     FOR INSERT TO authenticated WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff update customers" ON public.customers;
-- CREATE POLICY "Staff update customers" ON public.customers
--     FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff delete customers" ON public.customers;
-- CREATE POLICY "Staff delete customers" ON public.customers
--     FOR DELETE TO authenticated USING (true);

-- -- 2. Sessions RLS Policies (Authenticated Staff)
-- DROP POLICY IF EXISTS "Staff select sessions" ON public.sessions;
-- CREATE POLICY "Staff select sessions" ON public.sessions
--     FOR SELECT TO authenticated USING (true);

-- DROP POLICY IF EXISTS "Staff insert sessions" ON public.sessions;
-- CREATE POLICY "Staff insert sessions" ON public.sessions
--     FOR INSERT TO authenticated WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff update sessions" ON public.sessions;
-- CREATE POLICY "Staff update sessions" ON public.sessions
--     FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff delete sessions" ON public.sessions;
-- CREATE POLICY "Staff delete sessions" ON public.sessions
--     FOR DELETE TO authenticated USING (true);

-- -- 3. Payments RLS Policies (Authenticated Staff)
-- DROP POLICY IF EXISTS "Staff select payments" ON public.payments;
-- CREATE POLICY "Staff select payments" ON public.payments
--     FOR SELECT TO authenticated USING (true);

-- DROP POLICY IF EXISTS "Staff insert payments" ON public.payments;
-- CREATE POLICY "Staff insert payments" ON public.payments
--     FOR INSERT TO authenticated WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff update payments" ON public.payments;
-- CREATE POLICY "Staff update payments" ON public.payments
--     FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff delete payments" ON public.payments;
-- CREATE POLICY "Staff delete payments" ON public.payments
--     FOR DELETE TO authenticated USING (true);

-- -- 4. Costume Rentals RLS Policies (Authenticated Staff)
-- DROP POLICY IF EXISTS "Staff select costume_rentals" ON public.costume_rentals;
-- CREATE POLICY "Staff select costume_rentals" ON public.costume_rentals
--     FOR SELECT TO authenticated USING (true);

-- DROP POLICY IF EXISTS "Staff insert costume_rentals" ON public.costume_rentals;
-- CREATE POLICY "Staff insert costume_rentals" ON public.costume_rentals
--     FOR INSERT TO authenticated WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff update costume_rentals" ON public.costume_rentals;
-- CREATE POLICY "Staff update costume_rentals" ON public.costume_rentals
--     FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Staff delete costume_rentals" ON public.costume_rentals;
-- CREATE POLICY "Staff delete costume_rentals" ON public.costume_rentals
--     FOR DELETE TO authenticated USING (true);



-- ============================================================
-- CHAKRESHWAR SWIMMING POOL
-- Swimming Pool Management System
-- Supabase PostgreSQL Schema
-- Six tables: customers, sessions, payments, costume_rentals, equipment, packages
-- ============================================================

-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile
    ON public.customers(mobile);

CREATE INDEX IF NOT EXISTS idx_customers_name
    ON public.customers(name);


-- ============================================================
-- 2. PACKAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. SESSIONS
-- One record per swimmer.
-- Group members share group_code.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES public.customers(id) ON DELETE CASCADE,

    group_code TEXT,
    group_name TEXT,
    people_count INTEGER NOT NULL DEFAULT 1 CHECK (people_count >= 1),
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name TEXT,

    entry_time TIMESTAMPTZ NOT NULL,
    scheduled_exit_time TIMESTAMPTZ NOT NULL,
    actual_exit_time TIMESTAMPTZ,

    duration_minutes INTEGER NOT NULL DEFAULT 60,
    actual_duration_minutes INTEGER,

    session_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    penalty_charge NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (penalty_charge >= 0),
    penalty_applied BOOLEAN NOT NULL DEFAULT false,
    penalty_minutes INTEGER NOT NULL DEFAULT 0 CHECK (penalty_minutes >= 0),
    penalty_intervals INTEGER NOT NULL DEFAULT 0 CHECK (penalty_intervals >= 0),

    costume_used BOOLEAN NOT NULL DEFAULT false,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'completed')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS people_count INTEGER NOT NULL DEFAULT 1
    CHECK (people_count >= 1);
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL;
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS package_name TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_customer_id
    ON public.sessions(customer_id);

CREATE INDEX IF NOT EXISTS idx_sessions_group_code
    ON public.sessions(group_code);

CREATE INDEX IF NOT EXISTS idx_sessions_status
    ON public.sessions(status);

CREATE INDEX IF NOT EXISTS idx_sessions_entry_time
    ON public.sessions(entry_time);

CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_exit
    ON public.sessions(scheduled_exit_time);


-- ============================================================
-- 3. PAYMENTS
-- Payment methods: cash, online, google_pay,
-- phonepe, paytm, other.
-- Refund transactions are not supported.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL
        REFERENCES public.sessions(id) ON DELETE CASCADE,

    amount NUMERIC(10, 2) NOT NULL,

    payment_method TEXT NOT NULL
        CHECK (
            payment_method IN (
                'cash',
                'online',
                'google_pay',
                'phonepe',
                'paytm',
                'other'
            )
        ),

    transaction_type TEXT NOT NULL
        CHECK (transaction_type = 'payment'),

    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate payment-only constraint.
-- NOT VALID preserves existing legacy rows that may contain refunds,
-- while enforcing the constraint for new or updated rows.

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_transaction_type_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_transaction_type_check
    CHECK (transaction_type = 'payment') NOT VALID;

CREATE INDEX IF NOT EXISTS idx_payments_session_id
    ON public.payments(session_id);

CREATE INDEX IF NOT EXISTS idx_payments_date
    ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_method
    ON public.payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_payments_type
    ON public.payments(transaction_type);


-- ============================================================
-- 4. COSTUME RENTALS
-- Equipment and costume rental records linked to sessions.
-- Supports partial returns.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.costume_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID
        REFERENCES public.sessions(id) ON DELETE CASCADE,

    item_name TEXT NOT NULL,
    customer_name TEXT,
    equipment_type TEXT NOT NULL DEFAULT 'rental'
        CHECK (equipment_type IN ('rental', 'sale')),

    quantity INTEGER NOT NULL DEFAULT 1
        CHECK (quantity > 0),

    returned_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (returned_quantity >= 0),

    rental_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costume_rentals_session
    ON public.costume_rentals(session_id);

CREATE INDEX IF NOT EXISTS idx_costume_rentals_created
    ON public.costume_rentals(created_at);

-- ============================================================
-- 5. EQUIPMENT SETTINGS
-- Persistent accessory rates, inventory, and rental/sale classification.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL DEFAULT 'rental'
        CHECK (equipment_type IN ('rental', 'sale')),
    available_for_sale BOOLEAN NOT NULL DEFAULT false,
    sale_rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sale_rate >= 0),
    sizes TEXT[] NOT NULL DEFAULT ARRAY['Standard']::TEXT[],
    default_rate NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (default_rate >= 0),
    default_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (default_deposit >= 0),
    total_stock INTEGER NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
    available_stock INTEGER NOT NULL DEFAULT 0
        CHECK (available_stock >= 0 AND available_stock <= total_stock),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS available_for_sale BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sale_rate NUMERIC(10, 2) NOT NULL DEFAULT 0;

UPDATE public.equipment
SET available_for_sale = true,
    sale_rate = CASE WHEN sale_rate = 0 THEN default_rate ELSE sale_rate END
WHERE equipment_type = 'sale';

ALTER TABLE public.costume_rentals
    ADD COLUMN IF NOT EXISTS equipment_id TEXT
        REFERENCES public.equipment(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS size TEXT;


-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costume_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. CUSTOMERS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select customers"
    ON public.customers;

CREATE POLICY "Staff select customers"
    ON public.customers
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert customers"
    ON public.customers;

CREATE POLICY "Staff insert customers"
    ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update customers"
    ON public.customers;

CREATE POLICY "Staff update customers"
    ON public.customers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete customers"
    ON public.customers;

CREATE POLICY "Staff delete customers"
    ON public.customers
    FOR DELETE TO authenticated
    USING (true);


-- ============================================================
-- 7. SESSIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select sessions"
    ON public.sessions;

CREATE POLICY "Staff select sessions"
    ON public.sessions
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert sessions"
    ON public.sessions;

CREATE POLICY "Staff insert sessions"
    ON public.sessions
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update sessions"
    ON public.sessions;

CREATE POLICY "Staff update sessions"
    ON public.sessions
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete sessions"
    ON public.sessions;

CREATE POLICY "Staff delete sessions"
    ON public.sessions
    FOR DELETE TO authenticated
    USING (true);


-- ============================================================
-- 8. PAYMENTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select payments"
    ON public.payments;

CREATE POLICY "Staff select payments"
    ON public.payments
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert payments"
    ON public.payments;

CREATE POLICY "Staff insert payments"
    ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update payments"
    ON public.payments;

CREATE POLICY "Staff update payments"
    ON public.payments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete payments"
    ON public.payments;

CREATE POLICY "Staff delete payments"
    ON public.payments
    FOR DELETE TO authenticated
    USING (true);


-- ============================================================
-- 9. COSTUME RENTALS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select costume_rentals"
    ON public.costume_rentals;

CREATE POLICY "Staff select costume_rentals"
    ON public.costume_rentals
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert costume_rentals"
    ON public.costume_rentals;

CREATE POLICY "Staff insert costume_rentals"
    ON public.costume_rentals
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update costume_rentals"
    ON public.costume_rentals;

CREATE POLICY "Staff update costume_rentals"
    ON public.costume_rentals
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete costume_rentals"
    ON public.costume_rentals;

CREATE POLICY "Staff delete costume_rentals"
    ON public.costume_rentals
    FOR DELETE TO authenticated
    USING (true);

CREATE OR REPLACE FUNCTION public.adjust_equipment_available_stock(
    p_equipment_id TEXT,
    p_quantity_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    updated_available_stock INTEGER;
BEGIN
    UPDATE public.equipment
    SET available_stock = available_stock + p_quantity_delta,
        updated_at = NOW()
    WHERE id = p_equipment_id
      AND available_stock + p_quantity_delta >= 0
      AND available_stock + p_quantity_delta <= total_stock
    RETURNING available_stock INTO updated_available_stock;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient or invalid available stock for equipment %', p_equipment_id;
    END IF;

    RETURN updated_available_stock;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_equipment_available_stock(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_equipment_available_stock(TEXT, INTEGER) TO authenticated;

-- ============================================================
-- 10. EQUIPMENT POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select equipment"
    ON public.equipment;

CREATE POLICY "Staff select equipment"
    ON public.equipment
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert equipment"
    ON public.equipment;

CREATE POLICY "Staff insert equipment"
    ON public.equipment
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update equipment"
    ON public.equipment;

CREATE POLICY "Staff update equipment"
    ON public.equipment
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete equipment"
  ON public.equipment;

CREATE POLICY "Staff delete equipment"
  ON public.equipment
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- APP SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Staff insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Staff update app settings" ON public.app_settings;

CREATE POLICY "Staff select app settings"
    ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert app settings"
    ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff update app settings"
    ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 11. PACKAGES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Staff select packages"
    ON public.packages;

CREATE POLICY "Staff select packages"
    ON public.packages
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff insert packages"
    ON public.packages;

CREATE POLICY "Staff insert packages"
    ON public.packages
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update packages"
    ON public.packages;

CREATE POLICY "Staff update packages"
    ON public.packages
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete packages"
    ON public.packages;

CREATE POLICY "Staff delete packages"
    ON public.packages
    FOR DELETE TO authenticated
    USING (true);

-- Keep Realtime publication membership in sync with the live data tables.
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'customers',
        'sessions',
        'payments',
        'costume_rentals',
        'equipment',
        'packages',
        'app_settings'
    ];
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (
            SELECT 1
            FROM pg_class
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            WHERE pg_namespace.nspname = 'public'
              AND pg_class.relname = table_name
              AND pg_class.relkind = 'r'
        ) AND NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = table_name
        ) THEN
            EXECUTE format(
                'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
                table_name
            );
        END IF;
    END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- END OF CHAKRESHWAR SWIMMING POOL DATABASE SCHEMA
-- ============================================================
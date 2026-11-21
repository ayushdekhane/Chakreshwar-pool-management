-- Persist pricing packages and capture the selected package on new sessions.

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

ALTER TABLE public.packages
    ADD COLUMN IF NOT EXISTS package_kind TEXT NOT NULL DEFAULT 'regular'
    CHECK (package_kind IN ('regular', 'monthly'));

ALTER TABLE public.packages
    ADD COLUMN IF NOT EXISTS duration_months INTEGER;

UPDATE public.packages
SET duration_months = 1
WHERE package_kind = 'monthly' AND duration_months IS NULL;

UPDATE public.packages
SET package_kind = 'monthly'
WHERE lower(name) IN ('coaching', 'regular swimming');

INSERT INTO public.packages (name, duration_minutes, duration_months, price, description, is_active, package_kind)
SELECT 'Coaching', 43200, 1, 3500, '30-day monthly swimming coaching package.', true, 'monthly'
WHERE NOT EXISTS (
    SELECT 1 FROM public.packages
    WHERE lower(name) = 'coaching' AND package_kind = 'monthly'
);

INSERT INTO public.packages (name, duration_minutes, duration_months, price, description, is_active, package_kind)
SELECT 'Regular Swimming', 43200, 1, 2000, '30-day regular monthly swimming package.', true, 'monthly'
WHERE NOT EXISTS (
    SELECT 1 FROM public.packages
    WHERE lower(name) = 'regular swimming' AND package_kind = 'monthly'
);

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS package_id UUID
    REFERENCES public.packages(id) ON DELETE SET NULL;

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS package_name TEXT;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select packages" ON public.packages;
CREATE POLICY "Staff select packages" ON public.packages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff insert packages" ON public.packages;
CREATE POLICY "Staff insert packages" ON public.packages
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update packages" ON public.packages;
CREATE POLICY "Staff update packages" ON public.packages
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete packages" ON public.packages;
CREATE POLICY "Staff delete packages" ON public.packages
    FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.monthly_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_age INTEGER,
    notes TEXT,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name TEXT NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'online', 'gpay', 'phonepe', 'paytm', 'other')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select monthly memberships" ON public.monthly_memberships;
CREATE POLICY "Staff select monthly memberships" ON public.monthly_memberships
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff insert monthly memberships" ON public.monthly_memberships;
CREATE POLICY "Staff insert monthly memberships" ON public.monthly_memberships
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Staff update monthly memberships" ON public.monthly_memberships;
CREATE POLICY "Staff update monthly memberships" ON public.monthly_memberships
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff delete monthly memberships" ON public.monthly_memberships;
CREATE POLICY "Staff delete monthly memberships" ON public.monthly_memberships
    FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';

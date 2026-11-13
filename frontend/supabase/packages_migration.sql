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

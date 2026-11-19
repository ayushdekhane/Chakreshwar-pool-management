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

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS penalty_charge NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (penalty_charge >= 0),
    ADD COLUMN IF NOT EXISTS penalty_applied BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS penalty_minutes INTEGER NOT NULL DEFAULT 0
        CHECK (penalty_minutes >= 0);
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS penalty_intervals INTEGER NOT NULL DEFAULT 0
        CHECK (penalty_intervals >= 0);

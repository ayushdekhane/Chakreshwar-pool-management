-- Enable Supabase Realtime publications for live multi-device data refresh.
-- Run this once in the Supabase SQL Editor after the core schema is applied.

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
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
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

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS locker_numbers INTEGER[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_sessions_locker_numbers
    ON public.sessions USING GIN (locker_numbers);

CREATE OR REPLACE FUNCTION public.prevent_active_locker_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    conflicting_lockers INTEGER[];
BEGIN
    NEW.locker_numbers := COALESCE(NEW.locker_numbers, '{}');

    IF EXISTS (
        SELECT 1
        FROM unnest(NEW.locker_numbers) AS locker_number
        WHERE locker_number IS NULL OR locker_number < 1
    ) THEN
        RAISE EXCEPTION 'Locker numbers must be positive integers.';
    END IF;

    IF (
        SELECT COUNT(*) FROM unnest(NEW.locker_numbers)
    ) <> (
        SELECT COUNT(DISTINCT locker_number) FROM unnest(NEW.locker_numbers) AS locker_number
    ) THEN
        RAISE EXCEPTION 'A session cannot contain the same locker more than once.';
    END IF;

    IF NEW.status IN ('active', 'expired') AND cardinality(NEW.locker_numbers) > 0 THEN
        PERFORM pg_advisory_xact_lock(hashtext('chakreshwar_active_lockers'));

        SELECT ARRAY_AGG(locker_number ORDER BY locker_number)
        INTO conflicting_lockers
        FROM (
            SELECT DISTINCT unnest(existing.locker_numbers) AS locker_number
            FROM public.sessions AS existing
            WHERE existing.id <> NEW.id
              AND existing.status IN ('active', 'expired')
              AND existing.locker_numbers && NEW.locker_numbers
        ) AS conflicts;

        IF conflicting_lockers IS NOT NULL THEN
            RAISE EXCEPTION 'Locker(s) % are already assigned to another active session.',
                array_to_string(conflicting_lockers, ', ');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sessions_active_locker_conflict_trigger ON public.sessions;
CREATE TRIGGER sessions_active_locker_conflict_trigger
    BEFORE INSERT OR UPDATE OF locker_numbers, status
    ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_active_locker_conflicts();

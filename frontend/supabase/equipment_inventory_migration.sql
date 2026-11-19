-- Rename the existing inventory table without losing equipment records.
DO $$
BEGIN
    IF to_regclass('public.equipment') IS NULL
       AND to_regclass('public.rental_equipment') IS NOT NULL THEN
        ALTER TABLE public.rental_equipment RENAME TO equipment;
    ELSIF to_regclass('public.equipment') IS NOT NULL
       AND to_regclass('public.rental_equipment') IS NOT NULL THEN
        RAISE EXCEPTION 'Both equipment and rental_equipment exist; reconcile them before migrating.';
    END IF;
END
$$;

ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS equipment_type TEXT NOT NULL DEFAULT 'rental'
        CHECK (equipment_type IN ('rental', 'sale'));

ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS available_for_sale BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sale_rate NUMERIC(10, 2) NOT NULL DEFAULT 0;

UPDATE public.equipment
SET available_for_sale = true,
    sale_rate = CASE WHEN sale_rate = 0 THEN default_rate ELSE sale_rate END
WHERE equipment_type = 'sale';

ALTER TABLE public.equipment
    DROP COLUMN IF EXISTS category;

ALTER TABLE public.costume_rentals
    ALTER COLUMN session_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS equipment_type TEXT NOT NULL DEFAULT 'rental'
        CHECK (equipment_type IN ('rental', 'sale'));

ALTER TABLE public.costume_rentals
    ADD COLUMN IF NOT EXISTS equipment_id TEXT
        REFERENCES public.equipment(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS size TEXT;

UPDATE public.costume_rentals AS rental
SET equipment_id = equipment.id
FROM public.equipment AS equipment
WHERE rental.equipment_id IS NULL
  AND lower(trim(rental.item_name)) = lower(trim(equipment.name))
  AND (
      SELECT count(*)
      FROM public.equipment AS matching_equipment
      WHERE lower(trim(matching_equipment.name)) = lower(trim(rental.item_name))
  ) = 1;

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff select rental_equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff insert rental_equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff update rental_equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff select equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Staff delete equipment" ON public.equipment;

CREATE POLICY "Staff select equipment"
    ON public.equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert equipment"
    ON public.equipment FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff update equipment"
    ON public.equipment FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff delete equipment"
    ON public.equipment FOR DELETE TO authenticated USING (true);

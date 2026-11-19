ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS available_for_sale BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sale_rate NUMERIC(10, 2) NOT NULL DEFAULT 0;

UPDATE public.equipment
SET available_for_sale = true,
    sale_rate = CASE WHEN sale_rate = 0 THEN default_rate ELSE sale_rate END
WHERE equipment_type = 'sale';

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

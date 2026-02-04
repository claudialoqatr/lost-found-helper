-- Function to get owner's first name for public QR codes (no contact info exposed)
CREATE OR REPLACE FUNCTION public.get_public_owner_name(target_qr_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result_name text;
BEGIN
    -- Only return name for public, active QR codes
    SELECT 
        COALESCE(
            (SELECT SPLIT_PART(id_det.value, ' ', 1) 
             FROM item_details id_det 
             WHERE id_det.item_id = q.item_id 
             AND id_det.field_id = (SELECT idf.id FROM item_detail_fields idf WHERE idf.type = 'Item owner name') 
             LIMIT 1),
            SPLIT_PART(u.name, ' ', 1)
        )
    INTO result_name
    FROM qrcodes q
    JOIN users u ON q.assigned_to = u.id
    WHERE q.loqatr_id = target_qr_id
    AND q.is_public = true
    AND q.status = 'active';

    RETURN result_name;
END;
$function$;
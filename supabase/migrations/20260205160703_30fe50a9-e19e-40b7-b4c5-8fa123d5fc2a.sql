-- Update reveal_item_contact to use 'assigned' status instead of 'active'
CREATE OR REPLACE FUNCTION public.reveal_item_contact(target_qr_id text, current_scan_id integer)
 RETURNS TABLE(owner_name text, owner_email text, owner_phone text, whatsapp_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    requesting_ip inet;
    scan_count int;
BEGIN
    -- Get the IP address of the current requester
    SELECT ip_address INTO requesting_ip FROM scans WHERE id = current_scan_id;

    -- 1. Rate Limit Check: Count scans from this IP in the last hour
    SELECT count(*) INTO scan_count 
    FROM scans 
    WHERE ip_address = requesting_ip 
    AND scanned_at > now() - interval '1 hour'
    AND contact_revealed = true;

    IF scan_count >= 12 THEN
        RAISE EXCEPTION 'Rate limit exceeded. You can only view 12 contact records per hour.';
    END IF;

    -- 2. Mark this specific scan as having revealed contact info
    UPDATE scans 
    SET contact_revealed = true 
    WHERE id = current_scan_id;

    -- 3. Return the sensitive data (only for public, assigned QR codes)
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT id_det.value FROM item_details id_det 
             WHERE id_det.item_id = q.item_id 
             AND id_det.field_id = (SELECT idf.id FROM item_detail_fields idf WHERE idf.type = 'Item owner name') 
             LIMIT 1),
            u.name
        )::text as owner_name,
        u.email::text as owner_email,
        u.phone::text as owner_phone,
        ('https://wa.me/' || regexp_replace(u.phone, '\D', '', 'g'))::text as whatsapp_url
    FROM qrcodes q
    JOIN users u ON q.assigned_to = u.id
    WHERE q.loqatr_id = target_qr_id
    AND q.is_public = true
    AND q.status = 'assigned';
END;
$function$;

-- Also update get_public_owner_name to use 'assigned' status
CREATE OR REPLACE FUNCTION public.get_public_owner_name(target_qr_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result_name text;
BEGIN
    -- Only return name for public, assigned QR codes
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
    AND q.status = 'assigned';

    RETURN result_name;
END;
$function$;
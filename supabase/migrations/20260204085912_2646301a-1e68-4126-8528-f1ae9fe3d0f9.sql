-- Update the generate_qr_batch function to use valid status values
CREATE OR REPLACE FUNCTION public.generate_qr_batch(
  batch_size integer,
  batch_notes text DEFAULT NULL,
  p_retailer_id integer DEFAULT NULL
)
RETURNS TABLE(batch_id integer, loqatr_ids text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_batch_id integer;
  generated_ids text[] := '{}';
  i integer;
  j integer;
  unique_id text;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  -- Create batch record with 'pending' status
  INSERT INTO qrcode_batches (
    rand_value, retailer_id, staff_id, notes, status
  ) VALUES (
    random(), p_retailer_id, get_user_id(), batch_notes, 'pending'
  ) RETURNING id INTO new_batch_id;

  -- Generate QR codes
  FOR i IN 1..batch_size LOOP
    -- Generate 6-char unique ID
    unique_id := '';
    FOR j IN 1..6 LOOP
      unique_id := unique_id || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    
    -- Insert QR code
    INSERT INTO qrcodes (loqatr_id, batch_id, status)
    VALUES ('LOQ-' || new_batch_id || '-' || unique_id, new_batch_id, 'unassigned');
    
    generated_ids := array_append(generated_ids, 'LOQ-' || new_batch_id || '-' || unique_id);
  END LOOP;

  -- Update batch status to 'active' (valid status value)
  UPDATE qrcode_batches SET status = 'active' WHERE id = new_batch_id;

  RETURN QUERY SELECT new_batch_id, generated_ids;
END;
$$;
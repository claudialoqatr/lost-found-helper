-- Add RLS policies for Super Admin access to qrcode_batches

-- Super Admins can SELECT all batches
CREATE POLICY "Super admins can read all qrcode_batches"
ON public.qrcode_batches
FOR SELECT
USING (is_super_admin());

-- Super Admins can INSERT batches
CREATE POLICY "Super admins can insert qrcode_batches"
ON public.qrcode_batches
FOR INSERT
WITH CHECK (is_super_admin());

-- Super Admins can UPDATE batches
CREATE POLICY "Super admins can update qrcode_batches"
ON public.qrcode_batches
FOR UPDATE
USING (is_super_admin());

-- Add RLS policies for Super Admin access to qrcodes

-- Super Admins can INSERT new QR codes
CREATE POLICY "Super admins can insert qrcodes"
ON public.qrcodes
FOR INSERT
WITH CHECK (is_super_admin());

-- Create the generate_qr_batch function
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

  -- Create batch record
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

  -- Update batch status
  UPDATE qrcode_batches SET status = 'ready' WHERE id = new_batch_id;

  RETURN QUERY SELECT new_batch_id, generated_ids;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.generate_qr_batch(integer, text, integer) TO authenticated;
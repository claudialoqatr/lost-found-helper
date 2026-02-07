-- 1. Add retailer_id column to qrcodes
ALTER TABLE public.qrcodes
  ADD COLUMN retailer_id integer REFERENCES public.retailers(id);

-- 2. Public read policy on retailers (for unauthenticated finder page)
CREATE POLICY "Anyone can read retailers"
  ON public.retailers FOR SELECT
  USING (true);

-- 3. Update generate_qr_batch to set retailer_id on each QR code
CREATE OR REPLACE FUNCTION public.generate_qr_batch(
  batch_size integer,
  batch_notes text DEFAULT NULL,
  p_retailer_id integer DEFAULT NULL
)
RETURNS TABLE(batch_id integer, loqatr_ids text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_batch_id integer;
  generated_ids text[] := '{}';
  i integer;
  j integer;
  unique_id text;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  INSERT INTO qrcode_batches (
    rand_value, retailer_id, staff_id, notes, status
  ) VALUES (
    random(), p_retailer_id, get_user_id(), batch_notes, 'pending'
  ) RETURNING id INTO new_batch_id;

  FOR i IN 1..batch_size LOOP
    unique_id := '';
    FOR j IN 1..6 LOOP
      unique_id := unique_id || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;

    INSERT INTO qrcodes (loqatr_id, batch_id, status, retailer_id)
    VALUES ('LOQ-' || new_batch_id || '-' || unique_id, new_batch_id, 'unassigned', p_retailer_id);

    generated_ids := array_append(generated_ids, 'LOQ-' || new_batch_id || '-' || unique_id);
  END LOOP;

  UPDATE qrcode_batches SET status = 'active' WHERE id = new_batch_id;

  RETURN QUERY SELECT new_batch_id, generated_ids;
END;
$$;
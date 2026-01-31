-- For testing: Allow anonymous inserts/updates when RLS would block
-- These should be tightened in production

-- Allow anonymous to insert items (for dev testing)
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.items;
CREATE POLICY "Anyone can insert items"
  ON public.items FOR INSERT
  WITH CHECK (true);

-- Allow anonymous to update items (for dev testing)
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.items;
CREATE POLICY "Anyone can update items"
  ON public.items FOR UPDATE
  USING (true);

-- Allow anonymous to insert item_details
DROP POLICY IF EXISTS "Authenticated users can insert item_details" ON public.item_details;
CREATE POLICY "Anyone can insert item_details"
  ON public.item_details FOR INSERT
  WITH CHECK (true);

-- Allow anonymous to update item_details
DROP POLICY IF EXISTS "Authenticated users can update item_details" ON public.item_details;
CREATE POLICY "Anyone can update item_details"
  ON public.item_details FOR UPDATE
  USING (true);

-- Allow anonymous to delete item_details
DROP POLICY IF EXISTS "Authenticated users can delete item_details" ON public.item_details;
CREATE POLICY "Anyone can delete item_details"
  ON public.item_details FOR DELETE
  USING (true);

-- Allow anonymous to insert item_detail_fields
DROP POLICY IF EXISTS "Authenticated users can insert item_detail_fields" ON public.item_detail_fields;
CREATE POLICY "Anyone can insert item_detail_fields"
  ON public.item_detail_fields FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update qrcodes (for claiming)
DROP POLICY IF EXISTS "Owners can update their qrcodes" ON public.qrcodes;
DROP POLICY IF EXISTS "Authenticated users can claim unassigned qrcodes" ON public.qrcodes;
CREATE POLICY "Anyone can update qrcodes"
  ON public.qrcodes FOR UPDATE
  USING (true);
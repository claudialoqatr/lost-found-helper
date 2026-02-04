-- =============================================================
-- Fix overly permissive policies on item_details and items tables
-- These were created in migration 20260131203314 "for testing"
-- =============================================================

-- Step 1: Drop permissive item_details policies
DROP POLICY IF EXISTS "Anyone can insert item_details" ON public.item_details;
DROP POLICY IF EXISTS "Anyone can update item_details" ON public.item_details;
DROP POLICY IF EXISTS "Anyone can delete item_details" ON public.item_details;

-- Step 2: Create owner-based item_details policies
-- Only item owners (via qrcode assignment) can insert details
CREATE POLICY "Item owners can insert item_details"
  ON public.item_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qrcodes q
      WHERE q.item_id = item_id
      AND q.assigned_to = get_user_id()
    )
    AND auth.uid() IS NOT NULL
  );

-- Only item owners can update details
CREATE POLICY "Item owners can update item_details"
  ON public.item_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM qrcodes q
      WHERE q.item_id = item_details.item_id
      AND q.assigned_to = get_user_id()
    )
  );

-- Only item owners can delete details
CREATE POLICY "Item owners can delete item_details"
  ON public.item_details FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM qrcodes q
      WHERE q.item_id = item_details.item_id
      AND q.assigned_to = get_user_id()
    )
  );

-- Step 3: Drop permissive items policies
DROP POLICY IF EXISTS "Anyone can insert items" ON public.items;
DROP POLICY IF EXISTS "Anyone can update items" ON public.items;

-- Step 4: Create secure items policies
-- Authenticated users can create items (needed for claiming tags)
CREATE POLICY "Authenticated can insert items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only item owners can update their items
CREATE POLICY "Item owners can update items"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM qrcodes q
      WHERE q.item_id = items.id
      AND q.assigned_to = get_user_id()
    )
  );

-- Note: "Users can delete items linked to their qrcodes" policy already exists and is correct
-- Note: "Anyone can read items" and "Anyone can read item_details" remain for finder access
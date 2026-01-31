-- Helper function to get user's internal ID from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

-- QR Codes: Anyone can read (for scanning), owners can update
CREATE POLICY "Anyone can read qrcodes"
  ON public.qrcodes FOR SELECT
  USING (true);

CREATE POLICY "Owners can update their qrcodes"
  ON public.qrcodes FOR UPDATE
  USING (assigned_to = public.get_user_id() OR assigned_to IS NULL);

CREATE POLICY "Authenticated users can claim unassigned qrcodes"
  ON public.qrcodes FOR UPDATE
  USING (assigned_to IS NULL AND auth.uid() IS NOT NULL);

-- Items: Anyone can read (for scanning), authenticated can insert/update
CREATE POLICY "Anyone can read items"
  ON public.items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update items"
  ON public.items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Item Details: Anyone can read, authenticated can insert/update/delete
CREATE POLICY "Anyone can read item_details"
  ON public.item_details FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert item_details"
  ON public.item_details FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update item_details"
  ON public.item_details FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete item_details"
  ON public.item_details FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Item Detail Fields: Anyone can read, authenticated can insert
CREATE POLICY "Anyone can read item_detail_fields"
  ON public.item_detail_fields FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert item_detail_fields"
  ON public.item_detail_fields FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users: Users can read their own profile, authenticated users can read public info
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- Loqatrs (finder messages): Anyone can insert, owners of items can read
CREATE POLICY "Anyone can insert loqatrs"
  ON public.loqatrs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Item owners can read loqatrs"
  ON public.loqatrs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.qrcodes q
      JOIN public.items i ON q.item_id = i.id
      WHERE i.id = loqatrs.item_id
      AND q.assigned_to = public.get_user_id()
    )
  );

-- Scans: Anyone can insert (for tracking), owners can read their scans
CREATE POLICY "Anyone can insert scans"
  ON public.scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Item owners can read scans"
  ON public.scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.qrcodes q
      WHERE q.id = scans.qr_code_id
      AND q.assigned_to = public.get_user_id()
    )
  );

-- User roles, role permissions, retailers, qrcode_batches - admin only for now
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = public.get_user_id());

CREATE POLICY "Anyone can read role_permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can read retailers"
  ON public.retailers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can read qrcode_batches"
  ON public.qrcode_batches FOR SELECT
  USING (auth.uid() IS NOT NULL);
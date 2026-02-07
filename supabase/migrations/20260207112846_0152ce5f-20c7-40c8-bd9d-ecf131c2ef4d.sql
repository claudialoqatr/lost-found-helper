-- Allow super admins to manage retailers
CREATE POLICY "Super admins can insert retailers"
  ON public.retailers FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update retailers"
  ON public.retailers FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "Super admins can delete retailers"
  ON public.retailers FOR DELETE
  USING (is_super_admin());

-- Storage policy: allow super admins to upload retailer logos to Images bucket
CREATE POLICY "Super admins can upload to Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'Images' AND (SELECT is_super_admin()));

CREATE POLICY "Super admins can update Images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'Images' AND (SELECT is_super_admin()));

CREATE POLICY "Super admins can delete from Images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'Images' AND (SELECT is_super_admin()));

CREATE POLICY "Anyone can read Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Images');
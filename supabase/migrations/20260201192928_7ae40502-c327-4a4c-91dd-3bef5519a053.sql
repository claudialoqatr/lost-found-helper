CREATE POLICY "Anyone can read user info for public qrcode owners"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM qrcodes 
    WHERE qrcodes.assigned_to = users.id 
    AND qrcodes.is_public = true
  )
);
-- SECURITY FIX: Restore secure QR code update policies
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Anyone can update qrcodes" ON public.qrcodes;

-- Policy 1: Owners can update their own assigned QR codes
CREATE POLICY "Owners can update their qrcodes"
  ON public.qrcodes FOR UPDATE
  USING (assigned_to = get_user_id());

-- Policy 2: Authenticated users can claim unassigned QR codes
CREATE POLICY "Authenticated can claim unassigned qrcodes"
  ON public.qrcodes FOR UPDATE
  USING (
    assigned_to IS NULL 
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
  );
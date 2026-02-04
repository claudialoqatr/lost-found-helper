-- Drop the buggy policy
DROP POLICY IF EXISTS "Item owners can insert item_details" ON public.item_details;

-- Create corrected policy linking item_details.item_id to the owner's qrcode
CREATE POLICY "Item owners can insert item_details" 
ON public.item_details 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM qrcodes q 
    WHERE q.item_id = item_details.item_id 
    AND q.assigned_to = get_user_id()
  )
);
-- Allow users to delete items that are linked to their QR codes
CREATE POLICY "Users can delete items linked to their qrcodes"
ON public.items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM qrcodes q
    WHERE q.item_id = items.id
    AND q.assigned_to = get_user_id()
  )
);
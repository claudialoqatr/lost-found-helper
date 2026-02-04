-- Remove the policy that exposes user contact info (email, phone) to anyone
-- Contact info will now ONLY be accessible through the reveal_item_contact() 
-- SECURITY DEFINER function, which enforces CAPTCHA and rate limiting

DROP POLICY IF EXISTS "Anyone can read user info for public qrcode owners" ON public.users;
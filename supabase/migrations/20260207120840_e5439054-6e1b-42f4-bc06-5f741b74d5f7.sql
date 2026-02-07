-- Drop the existing security definer view
DROP VIEW IF EXISTS public.retailers_branding;

-- Recreate with security_invoker = true (queries run as the calling user)
CREATE VIEW public.retailers_branding
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  brand_color_primary,
  brand_color_accent,
  partner_logo_url,
  partner_url
FROM public.retailers;

-- Grant read access on the view
GRANT SELECT ON public.retailers_branding TO anon, authenticated;

-- Add a narrow public read policy on the retailers table scoped to branding columns only.
-- Since RLS operates at row level (not column level), this policy allows row access,
-- but the view restricts which columns are actually exposed.
CREATE POLICY "Public can read retailers for branding view"
ON public.retailers
FOR SELECT
USING (true);
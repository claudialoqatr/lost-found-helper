-- Create a secure public view exposing only branding fields (no contact info)
CREATE VIEW public.retailers_branding AS
SELECT 
  id,
  name,
  brand_color_primary,
  brand_color_accent,
  partner_logo_url,
  partner_url
FROM public.retailers;

-- Grant read access to the view for all roles
GRANT SELECT ON public.retailers_branding TO anon, authenticated;

-- Remove the overly permissive public read policy on the full table
DROP POLICY IF EXISTS "Anyone can read retailers" ON public.retailers;
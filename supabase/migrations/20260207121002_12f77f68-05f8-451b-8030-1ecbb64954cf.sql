-- Remove the security invoker view and the re-added public SELECT policy
DROP VIEW IF EXISTS public.retailers_branding;
DROP POLICY IF EXISTS "Public can read retailers for branding view" ON public.retailers;

-- Create a security definer function that returns only branding fields
-- This satisfies the linter (no security definer VIEW) and doesn't require
-- public SELECT on the retailers table
CREATE OR REPLACE FUNCTION public.get_retailer_branding(retailer_id integer)
RETURNS TABLE(
  id integer,
  name text,
  brand_color_primary text,
  brand_color_accent text,
  partner_logo_url text,
  partner_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, r.brand_color_primary, r.brand_color_accent, r.partner_logo_url, r.partner_url
  FROM public.retailers r
  WHERE r.id = retailer_id;
$$;
-- Create a security definer function to check if current user is a super admin
-- This avoids RLS recursion and provides a clean API for checking admin status

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = get_user_id()
      AND role = 'super_admin'
  )
$$;

-- Also create a version that takes a user_id parameter for flexibility
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'super_admin'
  )
$$;

-- Add super_admin permissions to role_permissions table
INSERT INTO public.role_permissions (role, permission)
VALUES 
  ('super_admin', 'read'),
  ('super_admin', 'write'),
  ('super_admin', 'delete'),
  ('super_admin', 'admin')
ON CONFLICT DO NOTHING;
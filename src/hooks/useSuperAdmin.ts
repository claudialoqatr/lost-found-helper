import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UseSuperAdminReturn {
  isSuperAdmin: boolean;
  loading: boolean;
}

/**
 * Hook to check if the current user has super admin privileges.
 * Uses the database function is_super_admin() for secure server-side validation.
 */
export function useSuperAdmin(): UseSuperAdminReturn {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Call the secure database function to check super admin status
        const { data, error } = await supabase.rpc("is_super_admin");

        if (error) {
          console.error("Error checking super admin status:", error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(data === true);
        }
      } catch (err) {
        console.error("Failed to check super admin status:", err);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSuperAdmin();
    }
  }, [user, authLoading]);

  return {
    isSuperAdmin,
    loading: authLoading || loading,
  };
}

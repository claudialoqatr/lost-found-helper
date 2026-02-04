import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types";

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage the current user's profile from the users table.
 * Automatically fetches when the authenticated user changes.
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setUserProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  return {
    userProfile,
    loading: authLoading || loading,
    error,
    refetch: fetchProfile,
  };
}

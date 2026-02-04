import { useQuery, useQueryClient } from "@tanstack/react-query";
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
 * Uses TanStack Query for caching and stale-while-revalidate strategy.
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data as UserProfile | null;
    },
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    userProfile: data ?? null,
    loading: authLoading || isLoading,
    error: error as Error | null,
    refetch: handleRefetch,
  };
}

/**
 * Invalidate the user profile cache (useful after profile updates)
 */
export function useInvalidateUserProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["userProfile"] });
}

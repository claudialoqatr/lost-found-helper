import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { notifyTagUnassigned } from "@/lib/notifications";
import type { TagWithItem } from "@/types";

interface UseMyTagsReturn {
  tags: TagWithItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  unassignTag: (tag: TagWithItem) => Promise<void>;
  isUnassigning: boolean;
}

/**
 * Hook to fetch and manage user's claimed tags.
 * Uses TanStack Query for caching and stale-while-revalidate strategy.
 */
export function useMyTags(): UseMyTagsReturn {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["myTags", userProfile?.id],
    queryFn: async (): Promise<TagWithItem[]> => {
      if (!userProfile?.id) return [];

      const { data: qrcodeData, error: fetchError } = await supabase
        .from("qrcodes")
        .select(`
          id,
          loqatr_id,
          status,
          is_public,
          created_at,
          item:items (
            id,
            name,
            description,
            icon_name
          )
        `)
        .eq("status", "assigned")
        .eq("assigned_to", userProfile.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch last scan for each tag using a single query
      const tagIds = (qrcodeData || []).map((t) => t.id);
      
      if (tagIds.length === 0) return [];

      // Get the latest scan for each tag in one query
      const { data: scansData } = await supabase
        .from("scans")
        .select("qr_code_id, scanned_at")
        .in("qr_code_id", tagIds)
        .order("scanned_at", { ascending: false });

      // Build a map of qr_code_id -> latest scanned_at
      const latestScanMap = new Map<number, string>();
      (scansData || []).forEach((scan) => {
        if (scan.qr_code_id && !latestScanMap.has(scan.qr_code_id)) {
          latestScanMap.set(scan.qr_code_id, scan.scanned_at!);
        }
      });

      return (qrcodeData || []).map((tag) => ({
        ...tag,
        last_scanned_at: latestScanMap.get(tag.id) || null,
      })) as TagWithItem[];
    },
    enabled: !profileLoading && !!userProfile?.id,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const unassignMutation = useMutation({
    mutationFn: async (tag: TagWithItem) => {
      const itemName = tag.item?.name || "Unknown item";

      if (tag.item?.id) {
        await supabase.from("item_details").delete().eq("item_id", tag.item.id);
        await supabase.from("items").delete().eq("id", tag.item.id);
      }

      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          assigned_to: null,
          item_id: null,
          is_public: false,
          status: "unassigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tag.id);

      if (qrError) throw qrError;

      if (userProfile?.id) {
        await notifyTagUnassigned(userProfile.id, itemName);
      }

      return tag.id;
    },
    onSuccess: (unassignedTagId) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["myTags", userProfile?.id],
        (old: TagWithItem[] | undefined) =>
          old?.filter((t) => t.id !== unassignedTagId) || []
      );
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["myTags"] });
    },
  });

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    tags: data ?? [],
    loading: profileLoading || isLoading,
    error: error as Error | null,
    refetch: handleRefetch,
    unassignTag: async (tag: TagWithItem) => {
      await unassignMutation.mutateAsync(tag);
    },
    isUnassigning: unassignMutation.isPending,
  };
}

/**
 * Invalidate the my tags cache
 */
export function useInvalidateMyTags() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["myTags"] });
}

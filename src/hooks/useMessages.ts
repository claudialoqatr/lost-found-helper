import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

interface MessageWithLocation {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
  item_id: number | null;
  item: { id: number; name: string } | null;
  location: string | null;
}

interface MessagesPage {
  messages: MessageWithLocation[];
  nextOffset: number | null;
  totalCount: number;
}

interface UseMessagesReturn {
  messages: MessageWithLocation[];
  totalCount: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch paginated finder messages.
 * Uses TanStack Query's infinite query for pagination with caching.
 */
export function useMessages(): UseMessagesReturn {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["messages", user?.id],
    queryFn: async ({ pageParam = 0 }): Promise<MessagesPage> => {
      // Fetch paginated messages
      const { data: loqatrsData, error: fetchError, count } = await supabase
        .from("loqatrs")
        .select(`
          id,
          name,
          email,
          phone,
          message,
          created_at,
          item_id,
          item:items (
            id,
            name
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      const fetchedCount = loqatrsData?.length || 0;
      const hasMore = fetchedCount === PAGE_SIZE;

      // Fetch locations from notifications
      const loqatrIds = (loqatrsData || []).map((l) => l.id);
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("loqatr_message_id, location")
        .in("loqatr_message_id", loqatrIds)
        .not("location", "is", null);

      // Map location to messages
      const locationMap = new Map<number, string>();
      (notificationsData || []).forEach((n) => {
        if (n.loqatr_message_id && n.location) {
          locationMap.set(n.loqatr_message_id, n.location);
        }
      });

      const messagesWithLocation: MessageWithLocation[] = (loqatrsData || []).map((msg) => ({
        ...msg,
        location: locationMap.get(msg.id) || null,
      }));

      return {
        messages: messagesWithLocation,
        nextOffset: hasMore ? pageParam + PAGE_SIZE : null,
        totalCount: count ?? 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !authLoading && !!user,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Flatten all pages into a single array
  const allMessages = data?.pages.flatMap((page) => page.messages) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? null;

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    messages: allMessages,
    totalCount,
    loading: authLoading || isLoading,
    loadingMore: isFetchingNextPage,
    error: error as Error | null,
    hasMore: !!hasNextPage,
    loadMore: () => fetchNextPage(),
    refetch: handleRefetch,
  };
}

/**
 * Invalidate the messages cache
 */
export function useInvalidateMessages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["messages"] });
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Scan {
  id: number;
  scanned_at: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_owner: boolean | null;
}

interface UseScanHistoryReturn {
  scans: Scan[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch scan history for a QR code.
 * Uses TanStack Query for caching and stale-while-revalidate strategy.
 */
export function useScanHistory(qrCodeId: number | undefined): UseScanHistoryReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["scanHistory", qrCodeId],
    queryFn: async (): Promise<Scan[]> => {
      if (!qrCodeId) return [];

      const { data, error } = await supabase
        .from("scans")
        .select("id, scanned_at, address, latitude, longitude, is_owner")
        .eq("qr_code_id", qrCodeId)
        .order("scanned_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!qrCodeId,
    staleTime: 1 * 60 * 1000, // Consider fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    scans: data ?? [],
    loading: isLoading,
    error: error as Error | null,
    refetch: handleRefetch,
  };
}

/**
 * Invalidate the scan history cache
 */
export function useInvalidateScanHistory() {
  const queryClient = useQueryClient();
  return (qrCodeId?: number) => {
    if (qrCodeId) {
      queryClient.invalidateQueries({ queryKey: ["scanHistory", qrCodeId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
    }
  };
}

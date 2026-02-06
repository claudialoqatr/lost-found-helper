import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { QRCodeData, ItemInfo, ItemDetail } from "@/types";

interface UseQRCodeReturn {
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemDetails: ItemDetail[];
  loading: boolean;
  error: Error | null;
  setItemDetails: React.Dispatch<React.SetStateAction<ItemDetail[]>>;
  refetch: () => Promise<void>;
}

interface UseQRCodeOptions {
  /** Whether to automatically fetch item details */
  fetchDetails?: boolean;
}

interface QRCodeQueryResult {
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemDetails: ItemDetail[];
}

/**
 * Hook to fetch and manage QR code data, associated item, and item details.
 * Uses TanStack Query for caching and stale-while-revalidate strategy.
 */
export function useQRCode(
  loqatrId: string | undefined,
  options: UseQRCodeOptions = {}
): UseQRCodeReturn {
  const { fetchDetails = true } = options;
  const queryClient = useQueryClient();

  // Local state for item details (can be modified by forms)
  const [localItemDetails, setLocalItemDetails] = useState<ItemDetail[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["qrCode", loqatrId, fetchDetails],
    queryFn: async (): Promise<QRCodeQueryResult> => {
      if (!loqatrId) {
        return { qrCode: null, item: null, itemDetails: [] };
      }

      // Fetch QR code by loqatr_id
      const { data: qrData, error: qrError } = await supabase
        .from("qrcodes")
        .select("*")
        .eq("loqatr_id", loqatrId)
        .maybeSingle();

      if (qrError) throw qrError;

      if (!qrData) {
        throw new Error("QR code not found");
      }

      let itemData: ItemInfo | null = null;
      let detailsData: ItemDetail[] = [];

      // Fetch item data if exists
      if (qrData.item_id && fetchDetails) {
        const { data: fetchedItem, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;

        if (fetchedItem) {
          itemData = fetchedItem;

          // Fetch item details
          const { data: rawDetails } = await supabase
            .from("item_details")
            .select("*, item_detail_fields(*)")
            .eq("item_id", fetchedItem.id);

          if (rawDetails) {
            detailsData = rawDetails
              .filter((d) => d.field_id && d.item_detail_fields)
              .map((d) => ({
                id: crypto.randomUUID(),
                field_id: d.field_id!,
                fieldType: d.item_detail_fields!.type,
                value: d.value,
              }));
          }
        }
      }

      return {
        qrCode: qrData,
        item: itemData,
        itemDetails: detailsData,
      };
    },
    enabled: !!loqatrId,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Sync local state with query result when data changes
  useEffect(() => {
    if (data?.itemDetails) {
      setLocalItemDetails(data.itemDetails);
    }
  }, [data?.itemDetails]);

  const handleRefetch = async () => {
    await refetch();
  };

  return {
    qrCode: data?.qrCode ?? null,
    item: data?.item ?? null,
    itemDetails: localItemDetails,
    loading: isLoading,
    error: error as Error | null,
    setItemDetails: setLocalItemDetails,
    refetch: handleRefetch,
  };
}

/**
 * Invalidate the QR code cache (useful after updates)
 */
export function useInvalidateQRCode() {
  const queryClient = useQueryClient();
  return (loqatrId?: string) => {
    // Use partial matching to invalidate all queries for this loqatr_id
    // regardless of fetchDetails option
    queryClient.invalidateQueries({ 
      queryKey: loqatrId ? ["qrCode", loqatrId] : ["qrCode"],
      exact: false 
    });
  };
}

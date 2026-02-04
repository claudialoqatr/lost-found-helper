import { useState, useEffect, useCallback } from "react";
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

/**
 * Hook to fetch and manage QR code data, associated item, and item details.
 */
export function useQRCode(
  loqatrId: string | undefined,
  options: UseQRCodeOptions = {}
): UseQRCodeReturn {
  const { fetchDetails = true } = options;

  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!loqatrId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch QR code by loqatr_id
      const { data: qrData, error: qrError } = await supabase
        .from("qrcodes")
        .select("*")
        .eq("loqatr_id", loqatrId)
        .maybeSingle();

      if (qrError) throw qrError;

      if (!qrData) {
        setError(new Error("QR code not found"));
        setQRCode(null);
        setItem(null);
        return;
      }

      setQRCode(qrData);

      // Fetch item data if exists
      if (qrData.item_id && fetchDetails) {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;

        if (itemData) {
          setItem(itemData);

          // Fetch item details
          const { data: detailsData } = await supabase
            .from("item_details")
            .select("*, item_detail_fields(*)")
            .eq("item_id", itemData.id);

          if (detailsData) {
            const mappedDetails: ItemDetail[] = detailsData.map((d) => ({
              id: crypto.randomUUID(),
              fieldType: d.item_detail_fields?.type || "Other",
              value: d.value,
            }));
            setItemDetails(mappedDetails);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching QR code data:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loqatrId, fetchDetails]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    qrCode,
    item,
    itemDetails,
    loading,
    error,
    setItemDetails,
    refetch: fetchData,
  };
}

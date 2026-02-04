import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeBatch } from "@/types";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for fetching and managing QR code batches.
 * Only accessible to Super Admins.
 */
export function useBatches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all batches with QR code count
  const {
    data: batches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      // Fetch batches
      const { data: batchData, error: batchError } = await supabase
        .from("qrcode_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (batchError) throw batchError;

      // Fetch QR code counts for each batch
      const batchesWithCounts: QRCodeBatch[] = await Promise.all(
        (batchData || []).map(async (batch) => {
          const { count } = await supabase
            .from("qrcodes")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id);

          return {
            ...batch,
            qrcode_count: count || 0,
          };
        })
      );

      return batchesWithCounts;
    },
  });

  // Generate a new batch
  const generateBatch = useMutation({
    mutationFn: async ({
      batchSize,
      notes,
    }: {
      batchSize: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc("generate_qr_batch", {
        batch_size: batchSize,
        batch_notes: notes || null,
        p_retailer_id: null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast({
        title: "Batch created",
        description: "QR codes have been generated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark batch as downloaded
  const markAsDownloaded = useMutation({
    mutationFn: async (batchId: number) => {
      const { error } = await supabase
        .from("qrcode_batches")
        .update({ is_downloaded: true })
        .eq("id", batchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  // Mark batch as printed
  const markAsPrinted = useMutation({
    mutationFn: async (batchId: number) => {
      const { error } = await supabase
        .from("qrcode_batches")
        .update({ is_printed: true })
        .eq("id", batchId);

      if (error) throw error;
      toast({
        title: "Batch marked as printed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  // Fetch QR codes for a specific batch - wrapped in useCallback to prevent infinite re-renders
  const fetchBatchQRCodes = useCallback(async (batchId: number) => {
    const { data, error } = await supabase
      .from("qrcodes")
      .select("loqatr_id")
      .eq("batch_id", batchId)
      .order("id", { ascending: true });

    if (error) throw error;
    return data?.map((qr) => qr.loqatr_id) || [];
  }, []);

  return {
    batches,
    isLoading,
    error,
    generateBatch,
    markAsDownloaded,
    markAsPrinted,
    fetchBatchQRCodes,
  };
}

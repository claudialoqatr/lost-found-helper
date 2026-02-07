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
      // Fetch batches with retailer name via join
      const { data: batchData, error: batchError } = await supabase
        .from("qrcode_batches")
        .select("*, retailers(name)")
        .order("created_at", { ascending: false });

      if (batchError) throw batchError;

      if (!batchData || batchData.length === 0) return [];

      // Fetch counts per batch using Promise.all for parallel fetching
      const countsPromises = batchData.map(async (batch) => {
        const { count: totalCount } = await supabase
          .from("qrcodes")
          .select("*", { count: "exact", head: true })
          .eq("batch_id", batch.id);

        const { count: assignedCount } = await supabase
          .from("qrcodes")
          .select("*", { count: "exact", head: true })
          .eq("batch_id", batch.id)
          .not("assigned_to", "is", null);

        return {
          batchId: batch.id,
          totalCount: totalCount || 0,
          assignedCount: assignedCount || 0,
        };
      });

      const counts = await Promise.all(countsPromises);

      // Build count maps
      const totalCountMap = new Map<number, number>();
      const assignedCountMap = new Map<number, number>();
      counts.forEach(({ batchId, totalCount, assignedCount }) => {
        totalCountMap.set(batchId, totalCount);
        assignedCountMap.set(batchId, assignedCount);
      });

      // Merge counts and retailer names into batches
      const batchesWithCounts: QRCodeBatch[] = batchData.map((batch) => ({
        ...batch,
        qrcode_count: totalCountMap.get(batch.id) || 0,
        assigned_count: assignedCountMap.get(batch.id) || 0,
        retailer_name: (batch.retailers as any)?.name || null,
      }));

      return batchesWithCounts;
    },
  });

  // Generate a new batch
  const generateBatch = useMutation({
    mutationFn: async ({
      batchSize,
      notes,
      retailerId,
    }: {
      batchSize: number;
      notes?: string;
      retailerId?: number;
    }) => {
      const { data, error } = await supabase.rpc("generate_qr_batch", {
        batch_size: batchSize,
        batch_notes: notes || null,
        p_retailer_id: retailerId || null,
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
      .select("loqatr_id, assigned_to")
      .eq("batch_id", batchId)
      .order("id", { ascending: true });

    if (error) throw error;
    return data?.map((qr) => ({ 
      loqatr_id: qr.loqatr_id, 
      isAssigned: qr.assigned_to !== null 
    })) || [];
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Retailer {
  id: number;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_number: string | null;
  partner_logo_url: string | null;
  partner_url: string | null;
  brand_color_primary: string | null;
  brand_color_accent: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type RetailerFormData = Omit<Retailer, "id" | "created_at" | "updated_at">;

/**
 * Hook for full CRUD management of retailers (super admin only).
 */
export function useRetailerAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: retailers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-retailers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Retailer[];
    },
  });

  const createRetailer = useMutation({
    mutationFn: async (formData: RetailerFormData) => {
      const { data, error } = await supabase
        .from("retailers")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-retailers"] });
      queryClient.invalidateQueries({ queryKey: ["retailers"] });
      toast({ title: "Retailer created", description: "The retailer has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create retailer", description: error.message, variant: "destructive" });
    },
  });

  const updateRetailer = useMutation({
    mutationFn: async ({ id, ...formData }: RetailerFormData & { id: number }) => {
      const { data, error } = await supabase
        .from("retailers")
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-retailers"] });
      queryClient.invalidateQueries({ queryKey: ["retailers"] });
      toast({ title: "Retailer updated", description: "Changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update retailer", description: error.message, variant: "destructive" });
    },
  });

  const deleteRetailer = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("retailers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-retailers"] });
      queryClient.invalidateQueries({ queryKey: ["retailers"] });
      toast({ title: "Retailer deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete retailer", description: error.message, variant: "destructive" });
    },
  });

  /**
   * Upload a logo file to Supabase Storage and return the public URL.
   */
  const uploadLogo = async (file: File, retailerName: string): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["svg", "png"].includes(ext)) {
      throw new Error("Only SVG and PNG files are allowed.");
    }

    const sanitizedName = retailerName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const filePath = `retailer-logos/${sanitizedName}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Images")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("Images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  return {
    retailers,
    isLoading,
    error,
    createRetailer,
    updateRetailer,
    deleteRetailer,
    uploadLogo,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ItemDetailField {
  id: number;
  type: string;
}

/**
 * Hook to fetch item detail field types from the database.
 * Excludes "Item owner name" as it's handled separately via a dedicated input field.
 */
export function useItemDetailFields() {
  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ["item-detail-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_detail_fields")
        .select("id, type")
        .order("type");

      if (error) throw error;
      return data as ItemDetailField[];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes - these rarely change
  });

  // Filter out "Item owner name" - it's managed separately via dedicated input
  const selectableFields = fields.filter(
    (field) => field.type.toLowerCase() !== "item owner name"
  );

  return {
    fields,
    selectableFields,
    isLoading,
    error,
  };
}

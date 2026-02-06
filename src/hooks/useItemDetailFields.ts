import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ItemDetailField {
  id: number;
  type: string;
}

/**
 * Hook to fetch item detail field types from the database.
 * Returns fields with id and type for use in forms.
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

  // Find the "Item owner name" field for saving
  const ownerNameField = fields.find(
    (field) => field.type.toLowerCase() === "item owner name"
  );

  // Get a default field for new details (first selectable field)
  const defaultField = selectableFields[0] || null;

  return {
    fields,
    selectableFields,
    ownerNameField,
    defaultField,
    isLoading,
    error,
  };
}

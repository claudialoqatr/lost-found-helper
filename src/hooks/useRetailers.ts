import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RetailerOption } from "@/types";

/**
 * Hook to fetch available retailers for admin dropdowns.
 */
export function useRetailers() {
  const { data: retailers = [], isLoading } = useQuery({
    queryKey: ["retailers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retailers")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as RetailerOption[];
    },
  });

  return { retailers, isLoading };
}

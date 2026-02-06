import { supabase } from "@/integrations/supabase/client";

interface ItemDetailForSave {
  field_id: number;
  value: string;
}

/**
 * Saves item details to the database using numeric field_id.
 */
export async function saveItemDetails(itemId: number, details: ItemDetailForSave[]): Promise<void> {
  const validDetails = details.filter((d) => d.value.trim() && d.field_id);
  
  if (validDetails.length === 0) return;

  const insertData = validDetails.map((detail) => ({
    item_id: itemId,
    field_id: detail.field_id,
    value: detail.value.trim(),
  }));

  const { error } = await supabase.from("item_details").insert(insertData);
  
  if (error) {
    console.error("Error saving item details:", error);
    throw error;
  }
}

/**
 * Deletes all item details for a given item.
 */
export async function deleteItemDetails(itemId: number): Promise<void> {
  const { error } = await supabase.from("item_details").delete().eq("item_id", itemId);
  if (error) {
    console.error("Error deleting item details:", error);
    throw error;
  }
}

/**
 * Updates item details by deleting existing ones and saving new ones.
 */
export async function updateItemDetails(itemId: number, details: ItemDetailForSave[]): Promise<void> {
  await deleteItemDetails(itemId);
  await saveItemDetails(itemId, details);
}

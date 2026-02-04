import { supabase } from "@/integrations/supabase/client";
import type { ItemDetail } from "@/types";

/**
 * Saves item details to the database.
 * Handles finding or creating the field type and inserting the detail.
 */
export async function saveItemDetails(itemId: number, details: ItemDetail[]): Promise<void> {
  for (const detail of details) {
    if (!detail.value.trim()) continue;

    // Find or create the field type
    let { data: fieldData } = await supabase
      .from("item_detail_fields")
      .select("id")
      .eq("type", detail.fieldType)
      .maybeSingle();

    if (!fieldData) {
      const { data: newField } = await supabase
        .from("item_detail_fields")
        .insert({ type: detail.fieldType })
        .select()
        .single();
      fieldData = newField;
    }

    if (fieldData) {
      await supabase.from("item_details").insert({
        item_id: itemId,
        field_id: fieldData.id,
        value: detail.value.trim(),
      });
    }
  }
}

/**
 * Deletes all item details for a given item.
 */
export async function deleteItemDetails(itemId: number): Promise<void> {
  await supabase.from("item_details").delete().eq("item_id", itemId);
}

/**
 * Updates item details by deleting existing ones and saving new ones.
 */
export async function updateItemDetails(itemId: number, details: ItemDetail[]): Promise<void> {
  await deleteItemDetails(itemId);
  await saveItemDetails(itemId, details);
}

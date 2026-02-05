import { useState, useCallback } from "react";
import type { ItemDetail } from "@/types";

interface UseItemDetailsManagerOptions {
  initialDetails?: ItemDetail[];
  initialOwnerName?: string;
}

interface UseItemDetailsManagerReturn {
  itemDetails: ItemDetail[];
  setItemDetails: React.Dispatch<React.SetStateAction<ItemDetail[]>>;
  isItemOwner: boolean;
  setIsItemOwner: (isOwner: boolean) => void;
  itemOwnerName: string;
  setItemOwnerName: (name: string) => void;
  addDetail: (defaultFieldId: number) => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "field_id" | "value", value: string | number) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  getAllDetailsForSave: () => { field_id: number; value: string }[];
}

/**
 * Hook to manage item details state and operations using Database IDs.
 */
export function useItemDetailsManager(options: UseItemDetailsManagerOptions = {}): UseItemDetailsManagerReturn {
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>(options.initialDetails || []);
  const [isItemOwner, setIsItemOwner] = useState(true);
  const [itemOwnerName, setItemOwnerName] = useState(options.initialOwnerName || "");

  // Update: We now accept the ID from the database for the new row
  const addDetail = useCallback((defaultFieldId: number) => {
    setItemDetails((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(), // Used for React keys
        field_id: defaultFieldId, // The Actual DB foreign key
        value: "",
      },
    ]);
  }, []);

  const removeDetail = useCallback((id: string) => {
    setItemDetails((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Update: Field name changed from fieldType to field_id
  const updateDetail = useCallback((id: string, field: "field_id" | "value", value: string | number) => {
    setItemDetails((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }, []);

  const handleItemOwnerChange = useCallback((isOwner: boolean) => {
    setIsItemOwner(isOwner);
    if (isOwner) {
      setItemOwnerName("");
    }
  }, []);

  const getAllDetailsForSave = useCallback(() => {
    // Returns only the data columns required by public.item_details
    return itemDetails
      .filter((d) => d.value.trim() !== "")
      .map((d) => ({
        field_id: d.field_id,
        value: d.value.trim(),
      }));
  }, [itemDetails]);

  return {
    itemDetails,
    setItemDetails,
    isItemOwner,
    setIsItemOwner,
    itemOwnerName,
    setItemOwnerName,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    getAllDetailsForSave,
  };
}

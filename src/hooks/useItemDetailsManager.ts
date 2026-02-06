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
  addDetail: () => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "fieldType" | "value", value: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  /** Get all details including the owner name detail (for saving) */
  getAllDetailsForSave: () => ItemDetail[];
}

/**
 * Hook to manage item details state and operations.
 * Item owner name is managed separately to prevent field type confusion.
 */
export function useItemDetailsManager(
  options: UseItemDetailsManagerOptions = {}
): UseItemDetailsManagerReturn {
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>(options.initialDetails || []);
  const [isItemOwner, setIsItemOwner] = useState(true);
  const [itemOwnerName, setItemOwnerName] = useState(options.initialOwnerName || "");

  const addDetail = useCallback((defaultFieldType: string = "Emergency contact") => {
    setItemDetails((prev) => [
      ...prev,
      { id: crypto.randomUUID(), fieldType: defaultFieldType, value: "" },
    ]);
  }, []);

  const removeDetail = useCallback((id: string) => {
    setItemDetails((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDetail = useCallback((id: string, field: "fieldType" | "value", value: string) => {
    setItemDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }, []);

  const handleItemOwnerChange = useCallback((isOwner: boolean) => {
    setIsItemOwner(isOwner);
    if (isOwner) {
      // Clear owner name when switching back to "my item"
      setItemOwnerName("");
    }
  }, []);

  /**
   * Combines regular item details with the owner name detail for saving.
   * Filters out any existing "Item owner name" entries and adds the current one if applicable.
   */
  const getAllDetailsForSave = useCallback((): ItemDetail[] => {
    // Filter out any existing "Item owner name" entries from details
    const filteredDetails = itemDetails.filter((d) => d.fieldType !== "Item owner name");
    
    // If not the item owner and there's a name, add the owner name detail
    if (!isItemOwner && itemOwnerName.trim()) {
      return [
        { id: crypto.randomUUID(), fieldType: "Item owner name", value: itemOwnerName.trim() },
        ...filteredDetails,
      ];
    }
    
    return filteredDetails;
  }, [itemDetails, isItemOwner, itemOwnerName]);

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

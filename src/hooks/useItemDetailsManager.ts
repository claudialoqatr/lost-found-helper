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
  addDetail: (defaultFieldId: number, defaultFieldType: string) => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "field_id" | "value", value: number | string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  /** Get all details for saving (field_id + value only) */
  getAllDetailsForSave: () => { field_id: number; value: string }[];
  /** Get owner name field_id and value for saving */
  getOwnerNameForSave: (ownerNameFieldId: number) => { field_id: number; value: string } | null;
}

/**
 * Hook to manage item details state and operations.
 * Uses numeric field_id for database linking.
 * Item owner name is managed separately to prevent field type confusion.
 */
export function useItemDetailsManager(
  options: UseItemDetailsManagerOptions = {}
): UseItemDetailsManagerReturn {
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>(options.initialDetails || []);
  const [isItemOwner, setIsItemOwner] = useState(true);
  const [itemOwnerName, setItemOwnerName] = useState(options.initialOwnerName || "");

  const addDetail = useCallback((defaultFieldId: number, defaultFieldType: string) => {
    setItemDetails((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field_id: defaultFieldId, fieldType: defaultFieldType, value: "" },
    ]);
  }, []);

  const removeDetail = useCallback((id: string) => {
    setItemDetails((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDetail = useCallback((id: string, field: "field_id" | "value", value: number | string) => {
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
   * Returns array of { field_id, value } for saving to database.
   * Filters out empty values.
   */
  const getAllDetailsForSave = useCallback((): { field_id: number; value: string }[] => {
    return itemDetails
      .filter((d) => d.value.trim())
      .map((d) => ({ field_id: d.field_id, value: d.value.trim() }));
  }, [itemDetails]);

  /**
   * Returns owner name detail for saving if applicable.
   */
  const getOwnerNameForSave = useCallback((ownerNameFieldId: number): { field_id: number; value: string } | null => {
    if (!isItemOwner && itemOwnerName.trim()) {
      return { field_id: ownerNameFieldId, value: itemOwnerName.trim() };
    }
    return null;
  }, [isItemOwner, itemOwnerName]);

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
    getOwnerNameForSave,
  };
}

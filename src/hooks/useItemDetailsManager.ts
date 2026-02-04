import { useState, useCallback } from "react";
import type { ItemDetail } from "@/types";

interface UseItemDetailsManagerOptions {
  initialDetails?: ItemDetail[];
}

interface UseItemDetailsManagerReturn {
  itemDetails: ItemDetail[];
  setItemDetails: React.Dispatch<React.SetStateAction<ItemDetail[]>>;
  isItemOwner: boolean;
  setIsItemOwner: (isOwner: boolean) => void;
  addDetail: () => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "fieldType" | "value", value: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  hasItemOwnerName: boolean;
}

/**
 * Hook to manage item details state and operations.
 * Extracted from ClaimTagPage and EditTagPage to reduce duplication.
 */
export function useItemDetailsManager(
  options: UseItemDetailsManagerOptions = {}
): UseItemDetailsManagerReturn {
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>(options.initialDetails || []);
  const [isItemOwner, setIsItemOwner] = useState(true);

  const hasItemOwnerName = itemDetails.some((d) => d.fieldType === "Item owner name");

  const addDetail = useCallback(() => {
    setItemDetails((prev) => [
      ...prev,
      { id: crypto.randomUUID(), fieldType: "Emergency contact", value: "" },
    ]);
  }, []);

  const removeDetail = useCallback((id: string) => {
    setItemDetails((prev) => {
      const detail = prev.find((d) => d.id === id);
      // Prevent removing "Item owner name" if isItemOwner is false
      if (detail?.fieldType === "Item owner name" && !isItemOwner) {
        return prev;
      }
      return prev.filter((d) => d.id !== id);
    });
  }, [isItemOwner]);

  const updateDetail = useCallback((id: string, field: "fieldType" | "value", value: string) => {
    setItemDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }, []);

  const handleItemOwnerChange = useCallback((isOwner: boolean) => {
    setIsItemOwner(isOwner);
    if (!isOwner) {
      // Add "Item owner name" detail if not already present
      setItemDetails((prev) => {
        const hasOwnerName = prev.some((d) => d.fieldType === "Item owner name");
        if (!hasOwnerName) {
          return [
            { id: crypto.randomUUID(), fieldType: "Item owner name", value: "" },
            ...prev,
          ];
        }
        return prev;
      });
    } else {
      // Remove "Item owner name" detail when toggled back on
      setItemDetails((prev) => prev.filter((d) => d.fieldType !== "Item owner name"));
    }
  }, []);

  return {
    itemDetails,
    setItemDetails,
    isItemOwner,
    setIsItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    hasItemOwnerName,
  };
}

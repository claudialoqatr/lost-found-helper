import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQRCode, useInvalidateQRCode } from "@/hooks/useQRCode";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
import { useItemDetailFields } from "@/hooks/useItemDetailFields";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { supabase } from "@/integrations/supabase/client";
import { updateItemDetails } from "@/lib/itemDetailsService";
import { notifyTagUnassigned } from "@/lib/notifications";
import type { QRCodeData, ItemInfo, ItemDetail } from "@/types";

interface InitialFormValues {
  itemName: string;
  isPublic: boolean;
  description: string;
  iconName: string;
  itemDetails: string;
  isItemOwner: boolean;
  itemOwnerName: string;
}

interface UseEditTagDataParams {
  code: string | undefined;
}

interface UseEditTagDataReturn {
  loading: boolean;
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemName: string;
  setItemName: (name: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  description: string;
  setDescription: (description: string) => void;
  iconName: string;
  setIconName: (iconName: string) => void;
  itemDetails: ItemDetail[];
  isItemOwner: boolean;
  itemOwnerName: string;
  setItemOwnerName: (name: string) => void;
  addDetail: (defaultFieldId: number, defaultFieldType: string) => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "field_id" | "value", value: number | string) => void;
  updateDetailField: (id: string, field_id: number, fieldType: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  hasChanges: () => boolean;
  resetInitialValues: () => void;
  handleSubmit: () => Promise<void>;
  handleUnassign: () => Promise<void>;
  saving: boolean;
  unassigning: boolean;
  showUnassignDialog: boolean;
  setShowUnassignDialog: (show: boolean) => void;
}

/**
 * Hook to manage all data and actions for the Edit Tag page.
 * Uses shared useQRCode hook for data fetching.
 */
export function useEditTagData({
  code,
}: UseEditTagDataParams): UseEditTagDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const invalidateQRCode = useInvalidateQRCode();

  // Use shared auth redirect hook
  const { loading: authLoading } = useAuthRedirect({
    returnPath: `/my-tags/${code}`,
  });

  // Use shared QR code fetching hook
  const {
    qrCode,
    item,
    itemDetails: fetchedDetails,
    loading: qrLoading,
    error: qrError,
  } = useQRCode(code, { fetchDetails: true });

  // Get field definitions for owner name field
  const { ownerNameField } = useItemDetailFields();

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");
  const [initializedItemId, setInitializedItemId] = useState<number | null>(null);
  const [initializedDataHash, setInitializedDataHash] = useState<string>("");

  // Create a hash of fetched details to detect when fresh data arrives
  const fetchedDataHash = useMemo(() => {
    return JSON.stringify(fetchedDetails.map(d => ({ field_id: d.field_id, value: d.value })));
  }, [fetchedDetails]);

  // Action state
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);

  // Track initial values for change detection
  const initialValuesRef = useRef<InitialFormValues | null>(null);

  // Use shared item details manager with separate owner name
  const {
    itemDetails,
    setItemDetails,
    isItemOwner,
    setIsItemOwner,
    itemOwnerName,
    setItemOwnerName,
    addDetail,
    removeDetail,
    updateDetail,
    updateDetailField,
    handleItemOwnerChange,
    getAllDetailsForSave,
    getOwnerNameForSave,
  } = useItemDetailsManager();

  // Handle QR fetch errors
  useEffect(() => {
    if (qrError) {
      toast({
        title: "Tag Not Found",
        description: "We couldn't locate this tag. It may have been removed or the link is incorrect.",
        variant: "destructive",
      });
      navigate("/my-tags");
    }
  }, [qrError, toast, navigate]);

  // Verify ownership and initialize form when data loads
  useEffect(() => {
    if (qrLoading || !qrCode || !item) return;
    
    // Skip if already initialized for this specific item AND with the same data
    // This allows re-initialization when React Query fetches fresh data
    if (initializedItemId === item.id && initializedDataHash === fetchedDataHash) return;

    // Verify ownership
    if (qrCode.assigned_to !== userProfile?.id) {
      toast({
        title: "Access Denied",
        description: "This tag belongs to another account. You can only edit tags you own.",
        variant: "destructive",
      });
      navigate("/my-tags");
      return;
    }

    // Initialize form state from fetched data
    setIsPublic(qrCode.is_public);
    setItemName(item.name);
    setDescription(item.description || "");
    setIconName(item.icon_name || "Package");

    // Extract owner name from details and filter it out for the details list
    // Owner name field type is "Item owner name" (case-insensitive check)
    const ownerNameDetail = fetchedDetails.find(
      (d) => d.fieldType.toLowerCase() === "item owner name"
    );
    const otherDetails = fetchedDetails.filter(
      (d) => d.fieldType.toLowerCase() !== "item owner name"
    );
    
    if (ownerNameDetail) {
      setItemOwnerName(ownerNameDetail.value);
      setIsItemOwner(false);
    } else {
      setItemOwnerName("");
      setIsItemOwner(true);
    }
    
    setItemDetails(otherDetails);

    // Store initial values for change detection
    initialValuesRef.current = {
      itemName: item.name || "",
      isPublic: qrCode.is_public,
      description: item.description || "",
      iconName: item.icon_name || "Package",
      itemDetails: JSON.stringify(otherDetails),
      isItemOwner: !ownerNameDetail,
      itemOwnerName: ownerNameDetail?.value || "",
    };

    // Mark this item and data as initialized
    setInitializedItemId(item.id);
    setInitializedDataHash(fetchedDataHash);
  }, [
    qrLoading,
    qrCode,
    item,
    fetchedDetails,
    fetchedDataHash,
    userProfile?.id,
    initializedItemId,
    initializedDataHash,
    navigate,
    toast,
    setItemDetails,
    setIsItemOwner,
    setItemOwnerName,
  ]);

  // Change detection
  const hasChanges = useCallback(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      itemName !== initial.itemName ||
      isPublic !== initial.isPublic ||
      description !== initial.description ||
      iconName !== initial.iconName ||
      JSON.stringify(itemDetails) !== initial.itemDetails ||
      isItemOwner !== initial.isItemOwner ||
      itemOwnerName !== initial.itemOwnerName
    );
  }, [itemName, isPublic, description, iconName, itemDetails, isItemOwner, itemOwnerName]);

  const resetInitialValues = useCallback(() => {
    initialValuesRef.current = {
      itemName: itemName.trim(),
      isPublic,
      description: description.trim(),
      iconName,
      itemDetails: JSON.stringify(itemDetails),
      isItemOwner,
      itemOwnerName: itemOwnerName.trim(),
    };
  }, [itemName, isPublic, description, iconName, itemDetails, isItemOwner, itemOwnerName]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!itemName.trim()) {
      toast({
        title: "Item name required",
        description: "Please enter a name for your item.",
        variant: "destructive",
      });
      throw new Error("Item name required");
    }

    if (!isItemOwner && !itemOwnerName.trim()) {
      toast({
        title: "Item owner name required",
        description: "Please enter the name of the item's owner.",
        variant: "destructive",
      });
      throw new Error("Item owner name required");
    }

    if (!qrCode || !userProfile || !item) {
      throw new Error("Missing required data");
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("items")
        .update({
          name: itemName.trim(),
          description: description.trim() || null,
          icon_name: iconName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // Collect all details for saving
      const detailsToSave = getAllDetailsForSave();
      
      // Add owner name if applicable
      if (ownerNameField) {
        const ownerNameDetail = getOwnerNameForSave(ownerNameField.id);
        if (ownerNameDetail) {
          detailsToSave.push(ownerNameDetail);
        }
      }
      
      await updateItemDetails(item.id, detailsToSave);

      const { error: qrUpdateError } = await supabase
        .from("qrcodes")
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrUpdateError) throw qrUpdateError;

      resetInitialValues();
      
      // Invalidate cache so next load gets fresh data
      invalidateQRCode(code);

      toast({
        title: "Item updated!",
        description: "Your item details have been saved.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Changes Not Saved",
        description: "We couldn't save your updates. Please check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [
    itemName,
    isItemOwner,
    itemOwnerName,
    qrCode,
    userProfile,
    item,
    description,
    iconName,
    isPublic,
    toast,
    resetInitialValues,
    getAllDetailsForSave,
    getOwnerNameForSave,
    ownerNameField,
    invalidateQRCode,
    code,
  ]);

  // Unassign handler
  const handleUnassign = useCallback(async () => {
    if (!qrCode || !userProfile) return;

    setUnassigning(true);
    try {
      const itemNameForNotif = item?.name || "Unknown item";

      if (item?.id) {
        await supabase.from("item_details").delete().eq("item_id", item.id);
        await supabase.from("items").delete().eq("id", item.id);
      }

      const { error: qrUpdateError } = await supabase
        .from("qrcodes")
        .update({
          assigned_to: null,
          item_id: null,
          is_public: false,
          status: "unassigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrUpdateError) throw qrUpdateError;

      await notifyTagUnassigned(userProfile.id, itemNameForNotif);

      toast({
        title: "Tag unassigned",
        description: "The tag has been cleared and is ready to be claimed again.",
      });

      navigate("/my-tags");
    } catch (error) {
      console.error("Error unassigning:", error);
      toast({
        title: "Couldn't Unassign Tag",
        description: "Something went wrong while removing this tag. Please try again or refresh the page.",
        variant: "destructive",
      });
    } finally {
      setUnassigning(false);
      setShowUnassignDialog(false);
    }
  }, [qrCode, userProfile, item, toast, navigate]);

  return {
    loading: qrLoading || profileLoading || authLoading,
    qrCode,
    item,
    itemName,
    setItemName,
    isPublic,
    setIsPublic,
    description,
    setDescription,
    iconName,
    setIconName,
    itemDetails,
    isItemOwner,
    itemOwnerName,
    setItemOwnerName,
    addDetail,
    removeDetail,
    updateDetail,
    updateDetailField,
    handleItemOwnerChange,
    hasChanges,
    resetInitialValues,
    handleSubmit,
    handleUnassign,
    saving,
    unassigning,
    showUnassignDialog,
    setShowUnassignDialog,
  };
}

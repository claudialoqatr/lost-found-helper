import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQRCode } from "@/hooks/useQRCode";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
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
}

interface UseEditTagDataParams {
  code: string | undefined;
  isAuthenticated: boolean;
  authLoading: boolean;
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
  addDetail: () => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "fieldType" | "value", value: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  itemOwnerName: string | undefined;
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
  isAuthenticated,
  authLoading,
}: UseEditTagDataParams): UseEditTagDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();

  // Use shared QR code fetching hook
  const {
    qrCode,
    item,
    itemDetails: fetchedDetails,
    loading: qrLoading,
    error: qrError,
  } = useQRCode(code, { fetchDetails: true });

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");
  const [formInitialized, setFormInitialized] = useState(false);

  // Action state
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);

  // Track initial values for change detection
  const initialValuesRef = useRef<InitialFormValues | null>(null);

  // Use shared item details manager
  const {
    itemDetails,
    setItemDetails,
    isItemOwner,
    setIsItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
  } = useItemDetailsManager();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirect_after_auth", `/my-tags/${code}`);
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, code, navigate]);

  // Handle QR fetch errors
  useEffect(() => {
    if (qrError) {
      toast({
        title: "Tag not found",
        description: "This QR code doesn't exist in our system.",
        variant: "destructive",
      });
      navigate("/my-tags");
    }
  }, [qrError, toast, navigate]);

  // Verify ownership and initialize form when data loads
  useEffect(() => {
    if (qrLoading || !qrCode || formInitialized) return;

    // Verify ownership
    if (qrCode.assigned_to !== userProfile?.id) {
      toast({
        title: "Access denied",
        description: "You don't own this tag.",
        variant: "destructive",
      });
      navigate("/my-tags");
      return;
    }

    // Initialize form state from fetched data
    setIsPublic(qrCode.is_public);

    if (item) {
      setItemName(item.name);
      setDescription(item.description || "");
      setIconName(item.icon_name || "Package");
    }

    if (fetchedDetails.length > 0) {
      setItemDetails(fetchedDetails);
      const hasItemOwnerName = fetchedDetails.some((d) => d.fieldType === "Item owner name");
      setIsItemOwner(!hasItemOwnerName);

      initialValuesRef.current = {
        itemName: item?.name || "",
        isPublic: qrCode.is_public,
        description: item?.description || "",
        iconName: item?.icon_name || "Package",
        itemDetails: JSON.stringify(fetchedDetails),
        isItemOwner: !hasItemOwnerName,
      };
    } else {
      initialValuesRef.current = {
        itemName: item?.name || "",
        isPublic: qrCode.is_public,
        description: item?.description || "",
        iconName: item?.icon_name || "Package",
        itemDetails: JSON.stringify([]),
        isItemOwner: true,
      };
    }

    setFormInitialized(true);
  }, [
    qrLoading,
    qrCode,
    item,
    fetchedDetails,
    userProfile?.id,
    formInitialized,
    navigate,
    toast,
    setItemDetails,
    setIsItemOwner,
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
      isItemOwner !== initial.isItemOwner
    );
  }, [itemName, isPublic, description, iconName, itemDetails, isItemOwner]);

  const resetInitialValues = useCallback(() => {
    initialValuesRef.current = {
      itemName: itemName.trim(),
      isPublic,
      description: description.trim(),
      iconName,
      itemDetails: JSON.stringify(itemDetails),
      isItemOwner,
    };
  }, [itemName, isPublic, description, iconName, itemDetails, isItemOwner]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!itemName.trim()) {
      toast({
        title: "Item name required",
        description: "Please enter a name for your item.",
        variant: "destructive",
      });
      return;
    }

    if (!isItemOwner) {
      const ownerNameDetail = itemDetails.find((d) => d.fieldType === "Item owner name");
      if (!ownerNameDetail?.value.trim()) {
        toast({
          title: "Item owner name required",
          description: "Please enter the name of the item's owner.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!qrCode || !userProfile || !item) return;

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

      await updateItemDetails(item.id, itemDetails);

      const { error: qrUpdateError } = await supabase
        .from("qrcodes")
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrUpdateError) throw qrUpdateError;

      resetInitialValues();

      toast({
        title: "Item updated!",
        description: "Your item details have been saved.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    itemName,
    isItemOwner,
    itemDetails,
    qrCode,
    userProfile,
    item,
    description,
    iconName,
    isPublic,
    toast,
    resetInitialValues,
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
        title: "Error",
        description: "Failed to unassign tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnassigning(false);
      setShowUnassignDialog(false);
    }
  }, [qrCode, userProfile, item, toast, navigate]);

  const itemOwnerName = !isItemOwner
    ? itemDetails.find((d) => d.fieldType === "Item owner name")?.value || undefined
    : undefined;

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
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    itemOwnerName,
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

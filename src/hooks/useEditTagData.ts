import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  // Data state
  loading: boolean;
  qrCode: QRCodeData | null;
  item: ItemInfo | null;

  // Form state
  itemName: string;
  setItemName: (name: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  description: string;
  setDescription: (description: string) => void;
  iconName: string;
  setIconName: (iconName: string) => void;

  // Item details from shared hook
  itemDetails: ItemDetail[];
  isItemOwner: boolean;
  addDetail: () => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "fieldType" | "value", value: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;

  // Computed values
  itemOwnerName: string | undefined;

  // Change detection
  hasChanges: () => boolean;
  resetInitialValues: () => void;

  // Actions
  handleSubmit: () => Promise<void>;
  handleUnassign: () => Promise<void>;
  saving: boolean;
  unassigning: boolean;

  // Dialog state
  showUnassignDialog: boolean;
  setShowUnassignDialog: (show: boolean) => void;
}

/**
 * Hook to manage all data and actions for the Edit Tag page.
 * Handles fetching, form state, submit, and unassign operations.
 */
export function useEditTagData({
  code,
  isAuthenticated,
  authLoading,
}: UseEditTagDataParams): UseEditTagDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();

  // Data state
  const [loading, setLoading] = useState(true);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");

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

  // Fetch data when ready
  useEffect(() => {
    if (!authLoading && !profileLoading && userProfile && isAuthenticated) {
      fetchData();
    }
  }, [code, authLoading, isAuthenticated, profileLoading, userProfile]);

  const fetchData = useCallback(async () => {
    if (!code || !userProfile) return;

    setLoading(true);
    try {
      // Fetch QR code
      const { data: qrData, error: qrError } = await supabase
        .from("qrcodes")
        .select("*")
        .eq("loqatr_id", code)
        .maybeSingle();

      if (qrError) throw qrError;

      if (!qrData) {
        toast({
          title: "Tag not found",
          description: "This QR code doesn't exist in our system.",
          variant: "destructive",
        });
        navigate("/my-tags");
        return;
      }

      // Verify ownership
      if (qrData.assigned_to !== userProfile.id) {
        toast({
          title: "Access denied",
          description: "You don't own this tag.",
          variant: "destructive",
        });
        navigate("/my-tags");
        return;
      }

      setQRCode(qrData);
      setIsPublic(qrData.is_public);

      // Fetch item data
      if (qrData.item_id) {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;

        if (itemData) {
          setItem(itemData);
          setItemName(itemData.name);
          setDescription(itemData.description || "");
          setIconName(itemData.icon_name || "Package");

          // Fetch item details
          const { data: detailsData } = await supabase
            .from("item_details")
            .select("*, item_detail_fields(*)")
            .eq("item_id", itemData.id);

          if (detailsData) {
            const mappedDetails = detailsData.map((d) => ({
              id: crypto.randomUUID(),
              fieldType: d.item_detail_fields?.type || "Other",
              value: d.value,
            }));
            setItemDetails(mappedDetails);

            // Check if item has an alternate owner
            const hasItemOwnerName = mappedDetails.some((d) => d.fieldType === "Item owner name");
            setIsItemOwner(!hasItemOwnerName);

            // Store initial values for change detection
            initialValuesRef.current = {
              itemName: itemData.name,
              isPublic: qrData.is_public,
              description: itemData.description || "",
              iconName: itemData.icon_name || "Package",
              itemDetails: JSON.stringify(mappedDetails),
              isItemOwner: !hasItemOwnerName,
            };
          } else {
            initialValuesRef.current = {
              itemName: itemData.name,
              isPublic: qrData.is_public,
              description: itemData.description || "",
              iconName: itemData.icon_name || "Package",
              itemDetails: JSON.stringify([]),
              isItemOwner: true,
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load tag data.",
        variant: "destructive",
      });
      navigate("/my-tags");
    } finally {
      setLoading(false);
    }
  }, [code, userProfile, navigate, toast, setItemDetails, setIsItemOwner]);

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
      // Update item
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

      // Update item details
      await updateItemDetails(item.id, itemDetails);

      // Update QR code public setting
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrError) throw qrError;

      // Reset initial values to match saved state
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

      // Delete item details and item
      if (item?.id) {
        await supabase.from("item_details").delete().eq("item_id", item.id);
        await supabase.from("items").delete().eq("id", item.id);
      }

      // Clear QR code assignment
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          assigned_to: null,
          item_id: null,
          is_public: false,
          status: "unassigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrError) throw qrError;

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

  // Computed value for alternate owner name
  const itemOwnerName = !isItemOwner
    ? itemDetails.find((d) => d.fieldType === "Item owner name")?.value || undefined
    : undefined;

  return {
    // Data state
    loading: loading || profileLoading,
    qrCode,
    item,

    // Form state
    itemName,
    setItemName,
    isPublic,
    setIsPublic,
    description,
    setDescription,
    iconName,
    setIconName,

    // Item details
    itemDetails,
    isItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,

    // Computed
    itemOwnerName,

    // Change detection
    hasChanges,
    resetInitialValues,

    // Actions
    handleSubmit,
    handleUnassign,
    saving,
    unassigning,

    // Dialog
    showUnassignDialog,
    setShowUnassignDialog,
  };
}

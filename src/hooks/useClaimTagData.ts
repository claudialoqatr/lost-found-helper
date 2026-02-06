import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQRCode } from "@/hooks/useQRCode";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
import { useItemDetailFields } from "@/hooks/useItemDetailFields";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { supabase } from "@/integrations/supabase/client";
import { saveItemDetails } from "@/lib/itemDetailsService";
import type { QRCodeData, ItemDetail } from "@/types";

interface UseClaimTagDataParams {
  code: string | undefined;
}

interface UseClaimTagDataReturn {
  loading: boolean;
  qrCode: QRCodeData | null;
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
  handleSubmit: () => Promise<void>;
  saving: boolean;
}

/**
 * Hook to manage all data and actions for the Claim Tag page.
 * Uses shared useQRCode hook for data fetching.
 */
export function useClaimTagData({
  code,
}: UseClaimTagDataParams): UseClaimTagDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();

  // Use shared auth redirect hook
  const { loading: authLoading } = useAuthRedirect({
    returnPath: `/tag/${code}`,
  });

  // Use shared QR code fetching hook (don't fetch details for unclaimed tags)
  const {
    qrCode,
    loading: qrLoading,
    error: qrError,
  } = useQRCode(code, { fetchDetails: false });

  // Get field definitions for owner name field
  const { ownerNameField } = useItemDetailFields();

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");
  const [saving, setSaving] = useState(false);

  // Use shared item details manager with separate owner name
  const {
    itemDetails,
    isItemOwner,
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
        title: "Tag Not Recognized",
        description: "We couldn't find this QR code. Please scan again or contact support if the problem persists.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [qrError, toast, navigate]);

  // Handle routing based on QR status
  useEffect(() => {
    if (qrLoading || !qrCode) return;

    // If already claimed and assigned, redirect appropriately
    if (qrCode.assigned_to && qrCode.status === "assigned") {
      const isOwner = userProfile?.id === qrCode.assigned_to;
      if (isOwner) {
        navigate(`/my-tags/${code}`, { replace: true });
      } else {
        navigate(`/found/${code}`, { replace: true });
      }
      return;
    }

    // Initialize public state from QR data
    setIsPublic(qrCode.is_public);
  }, [qrLoading, qrCode, userProfile?.id, code, navigate]);

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

    if (!isItemOwner && !itemOwnerName.trim()) {
      toast({
        title: "Item owner name required",
        description: "Please enter the name of the item's owner.",
        variant: "destructive",
      });
      return;
    }

    if (!qrCode || !userProfile) return;

    setSaving(true);
    try {
      // Create the item first
      const { data: newItem, error: itemError } = await supabase
        .from("items")
        .insert({
          name: itemName.trim(),
          description: description.trim() || null,
          icon_name: iconName,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Attempt to claim the QR code with optimistic locking
      const { data: updatedQR, error: qrUpdateError } = await supabase
        .from("qrcodes")
        .update({
          item_id: newItem.id,
          assigned_to: userProfile.id,
          is_public: isPublic,
          status: "assigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id)
        .is("assigned_to", null)
        .select()
        .maybeSingle();

      // Check if claim succeeded
      if (qrUpdateError || !updatedQR) {
        await supabase.from("items").delete().eq("id", newItem.id);
        
        toast({
          title: "Tag Already Claimed",
          description: "Someone else just claimed this tag. Please try a different one.",
          variant: "destructive",
        });
        navigate(`/found/${code}`, { replace: true });
        return;
      }

      // Collect all details for saving
      const detailsToSave = getAllDetailsForSave();
      
      // Add owner name if applicable
      if (ownerNameField) {
        const ownerNameDetail = getOwnerNameForSave(ownerNameField.id);
        if (ownerNameDetail) {
          detailsToSave.push(ownerNameDetail);
        }
      }
      
      if (detailsToSave.length > 0 && newItem) {
        await saveItemDetails(newItem.id, detailsToSave);
      }

      toast({
        title: "Tag claimed!",
        description: "This QR code is now linked to your account.",
      });

      navigate(`/my-tags/${code}`, { replace: true });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Couldn't Claim Tag",
        description: "Something went wrong while saving your item. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    itemName,
    isItemOwner,
    itemOwnerName,
    qrCode,
    userProfile,
    description,
    iconName,
    isPublic,
    code,
    toast,
    navigate,
    getAllDetailsForSave,
    getOwnerNameForSave,
    ownerNameField,
  ]);

  return {
    loading: qrLoading || profileLoading || authLoading,
    qrCode,
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
    handleSubmit,
    saving,
  };
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQRCode } from "@/hooks/useQRCode";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
import { supabase } from "@/integrations/supabase/client";
import { saveItemDetails } from "@/lib/itemDetailsService";
import type { QRCodeData, ItemDetail } from "@/types";

interface UseClaimTagDataParams {
  code: string | undefined;
  isAuthenticated: boolean;
  authLoading: boolean;
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
  addDetail: () => void;
  removeDetail: (id: string) => void;
  updateDetail: (id: string, field: "fieldType" | "value", value: string) => void;
  handleItemOwnerChange: (isOwner: boolean) => void;
  itemOwnerName: string | undefined;
  handleSubmit: () => Promise<void>;
  saving: boolean;
}

/**
 * Hook to manage all data and actions for the Claim Tag page.
 * Uses shared useQRCode hook for data fetching.
 */
export function useClaimTagData({
  code,
  isAuthenticated,
  authLoading,
}: UseClaimTagDataParams): UseClaimTagDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useUserProfile();

  // Use shared QR code fetching hook (don't fetch details for unclaimed tags)
  const {
    qrCode,
    loading: qrLoading,
    error: qrError,
  } = useQRCode(code, { fetchDetails: false });

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");
  const [saving, setSaving] = useState(false);

  // Use shared item details manager
  const {
    itemDetails,
    isItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
  } = useItemDetailsManager();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirect_after_auth", `/tag/${code}`);
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, code, navigate]);

  // Handle QR fetch errors
  useEffect(() => {
    if (qrError) {
      toast({
        title: "QR Code not found",
        description: "This QR code doesn't exist in our system.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [qrError, toast, navigate]);

  // Handle routing based on QR status
  useEffect(() => {
    if (qrLoading || !qrCode) return;

    // If already claimed and active, redirect appropriately
    if (qrCode.assigned_to && qrCode.status === "active") {
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

    if (!qrCode || !userProfile) return;

    setSaving(true);
    try {
      // Create the item
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

      // Update QR code FIRST to establish ownership (required for RLS)
      const { error: qrUpdateError } = await supabase
        .from("qrcodes")
        .update({
          item_id: newItem.id,
          assigned_to: userProfile.id,
          is_public: isPublic,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrUpdateError) throw qrUpdateError;

      // Insert item details AFTER qrcode is linked
      if (itemDetails.length > 0 && newItem) {
        await saveItemDetails(newItem.id, itemDetails);
      }

      toast({
        title: "Tag claimed!",
        description: "This QR code is now linked to your account.",
      });

      navigate(`/my-tags/${code}`, { replace: true });
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
    description,
    iconName,
    isPublic,
    code,
    toast,
    navigate,
  ]);

  const itemOwnerName = !isItemOwner
    ? itemDetails.find((d) => d.fieldType === "Item owner name")?.value || undefined
    : undefined;

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
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
    itemOwnerName,
    handleSubmit,
    saving,
  };
}

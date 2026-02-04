import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { notifyTagScanned } from "@/lib/notifications";
import type { ItemInfo, QRCodeData, LocationData, RevealedContact } from "@/types";
import type { User } from "@supabase/supabase-js";

export interface ItemDetailDisplay {
  type: string;
  value: string;
}

interface UseFinderPageDataParams {
  code: string | undefined;
  user: User | null;
  isScan: boolean;
  location: LocationData;
}

interface UseFinderPageDataReturn {
  loading: boolean;
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemDetails: ItemDetailDisplay[];
  ownerFirstName: string | null;
  setQRCode: React.Dispatch<React.SetStateAction<QRCodeData | null>>;
  getDisplayOwnerName: (revealedContact?: RevealedContact | null) => string;
}

/**
 * Hook to handle all data fetching and routing logic for the finder page.
 * Fetches QR code, item details, and owner information.
 * Handles redirects for unclaimed tags and owner scans.
 */
export function useFinderPageData({
  code,
  user,
  isScan,
  location,
}: UseFinderPageDataParams): UseFinderPageDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetailDisplay[]>([]);
  const [ownerFirstName, setOwnerFirstName] = useState<string | null>(null);

  const notifyOwnerOfScan = useCallback(
    async (qrCodeId: number, ownerId: number | null, itemName: string | null) => {
      try {
        if (ownerId && itemName) {
          await notifyTagScanned(ownerId, itemName, qrCodeId, location.address);
        }
      } catch (e) {
        console.error("Notification error:", e);
      }
    },
    [location.address]
  );

  const fetchData = useCallback(async () => {
    if (!code) return;

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
          title: "QR Code not found",
          description: "This QR code doesn't exist in our system.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setQRCode(qrData);

      // If not claimed, redirect to claim page
      if (!qrData.assigned_to || qrData.status !== "active") {
        navigate(`/tag/${code}`);
        return;
      }

      // Check if current user is owner
      if (user) {
        const { data: profileData } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();
        const currentUserId = profileData?.id || null;

        if (currentUserId === qrData.assigned_to) {
          // Owner is viewing - redirect to management page
          navigate(`/my-tags/${code}`, { replace: true });
          return;
        }
      }

      // For public tags, fetch owner's first name using secure function
      if (qrData.is_public) {
        const { data: nameData } = await supabase.rpc("get_public_owner_name", {
          target_qr_id: code,
        });

        if (nameData) {
          setOwnerFirstName(nameData);
        }
      }

      // Fetch item info
      let fetchedItemName: string | null = null;
      if (qrData.item_id) {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;
        setItem(itemData);
        fetchedItemName = itemData?.name || null;

        // Fetch item details
        const { data: detailsData } = await supabase
          .from("item_details")
          .select("*, item_detail_fields(*)")
          .eq("item_id", qrData.item_id);

        if (detailsData) {
          setItemDetails(
            detailsData.map((d) => ({
              type: d.item_detail_fields?.type || "Info",
              value: d.value,
            }))
          );
        }
      }

      // Only notify owner and log scan when ?scan=true (physical QR scan)
      if (isScan) {
        await notifyOwnerOfScan(qrData.id, qrData.assigned_to, fetchedItemName);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load item details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [code, user, isScan, navigate, toast, notifyOwnerOfScan]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Get display name: prioritize "Item owner name" detail, then fetched owner name, fallback to "Owner"
   */
  const getDisplayOwnerName = useCallback(
    (revealedContact?: RevealedContact | null): string => {
      const ownerNameDetail = itemDetails.find((d) => d.type === "Item owner name");
      if (ownerNameDetail?.value) {
        return ownerNameDetail.value.split(" ")[0]; // First name only
      }
      if (ownerFirstName) {
        return ownerFirstName;
      }
      if (revealedContact?.owner_name) {
        return revealedContact.owner_name.split(" ")[0];
      }
      return "Owner";
    },
    [itemDetails, ownerFirstName]
  );

  return {
    loading,
    qrCode,
    item,
    itemDetails,
    ownerFirstName,
    setQRCode,
    getDisplayOwnerName,
  };
}

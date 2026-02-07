import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { notifyTagScanned } from "@/lib/notifications";
import type { ItemInfo, QRCodeData, RevealedContact, RetailerBranding } from "@/types";
import type { User } from "@supabase/supabase-js";

export interface ItemDetailDisplay {
  type: string;
  value: string;
}

interface UseFinderPageDataParams {
  code: string | undefined;
  user: User | null;
  isScan: boolean;
}

interface UseFinderPageDataReturn {
  loading: boolean;
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemDetails: ItemDetailDisplay[];
  ownerFirstName: string | null;
  currentScanId: number | null;
  retailer: RetailerBranding | null;
  setQRCode: React.Dispatch<React.SetStateAction<QRCodeData | null>>;
  getDisplayOwnerName: (revealedContact?: RevealedContact | null) => string;
}

/**
 * Hook to handle all data fetching and routing logic for the finder page.
 * Fetches QR code, item details, owner information, and retailer branding.
 * Handles redirects for unclaimed tags and owner scans.
 */
export function useFinderPageData({
  code,
  user,
  isScan,
}: UseFinderPageDataParams): UseFinderPageDataReturn {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetailDisplay[]>([]);
  const [ownerFirstName, setOwnerFirstName] = useState<string | null>(null);
  const [currentScanId, setCurrentScanId] = useState<number | null>(null);
  const [retailer, setRetailer] = useState<RetailerBranding | null>(null);

  // Track whether we've already logged this scan to prevent duplicates
  const scanLoggedRef = useRef(false);

  const logScanAndNotify = useCallback(
    async (qrCodeId: number, ownerId: number | null, itemName: string | null): Promise<number | null> => {
      // Prevent duplicate scan logging
      if (scanLoggedRef.current) return null;
      scanLoggedRef.current = true;

      try {
        // Insert scan record WITHOUT location - will be updated silently later
        const { data: scanData, error: scanError } = await supabase
          .from("scans")
          .insert({
            qr_code_id: qrCodeId,
            is_owner: false,
          })
          .select("id")
          .single();

        if (scanError) {
          console.error("Failed to log scan:", scanError);
          return null;
        }

        const newScanId = scanData?.id || null;
        setCurrentScanId(newScanId);

        // Notify owner (location will be added by silent update)
        if (ownerId && itemName) {
          await notifyTagScanned(ownerId, itemName, qrCodeId, null);
        }

        return newScanId;
      } catch (e) {
        console.error("Scan/notification error:", e);
        return null;
      }
    },
    []
  );

  /**
   * Resolve retailer branding: QR-level override > batch-level fallback
   */
  const resolveRetailer = useCallback(async (qrData: QRCodeData) => {
    let retailerId = qrData.retailer_id || null;

    // Fallback to batch-level retailer
    if (!retailerId && qrData.batch_id) {
      const { data: batchData } = await supabase
        .from("qrcode_batches")
        .select("retailer_id")
        .eq("id", qrData.batch_id)
        .maybeSingle();
      retailerId = batchData?.retailer_id || null;
    }

    if (retailerId) {
      // Query the secure branding view (excludes sensitive contact info)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: retailerData } = await (supabase as any)
        .from("retailers_branding")
        .select("name, brand_color_primary, brand_color_accent, partner_logo_url, partner_url")
        .eq("id", retailerId)
        .maybeSingle();

      if (retailerData) {
        setRetailer(retailerData as RetailerBranding);
      }
    }
  }, []);

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
          title: "Tag Not Recognized",
          description: "We couldn't find this QR code. It may be invalid or not yet registered.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setQRCode(qrData);

      // Resolve retailer branding (non-blocking for page render)
      resolveRetailer(qrData);

      // If not claimed (no owner or explicitly unassigned), redirect to claim page
      if (!qrData.assigned_to || qrData.status === "unassigned" || qrData.status === "retired") {
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
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Couldn't Load Item",
        description: "We had trouble loading the item details. Please refresh the page or try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [code, user, navigate, toast, resolveRetailer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Separate effect for scan logging - runs immediately, no location wait
  useEffect(() => {
    if (!isScan || !qrCode || scanLoggedRef.current) return;
    
    logScanAndNotify(qrCode.id, qrCode.assigned_to, item?.name || null);
  }, [isScan, qrCode, item, logScanAndNotify]);

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
    currentScanId,
    retailer,
    setQRCode,
    getDisplayOwnerName,
  };
}

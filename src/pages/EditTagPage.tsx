import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Unlink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ScanHistory } from "@/components/ScanHistory";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import { ItemForm, ItemDetailsEditor, ContactDetailsCard, LoqatrIdCard, type ItemDetail } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notifyTagUnassigned } from "@/lib/notifications";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface QRCodeData {
  id: number;
  loqatr_id: string;
  is_public: boolean;
  item_id: number | null;
  assigned_to: number | null;
}

interface ItemData {
  id: number;
  name: string;
  description: string | null;
}

export default function EditTagPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemData | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);
  const [isItemOwner, setIsItemOwner] = useState(true);

  // Unassign dialog state
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  // Dev bypass check
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  const isAuthenticated = user || devBypass;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirect_after_auth", `/my-tags/${code}`);
      navigate("/auth");
      return;
    }

    if (!authLoading) {
      fetchData();
    }
  }, [code, authLoading, isAuthenticated]);

  const fetchData = async () => {
    if (!code) return;

    setLoading(true);
    try {
      // Fetch QR code by loqatr_id
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

      // Fetch user profile
      let currentUserProfile: UserProfile | null = null;
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        currentUserProfile = profileData;
        setUserProfile(profileData);
      } else if (devBypass) {
        currentUserProfile = {
          id: 1,
          name: "Dev User",
          email: "dev@loqatr.com",
          phone: "0123456789",
        };
        setUserProfile(currentUserProfile);
      }

      // If not the owner, redirect
      if (!currentUserProfile || qrData.assigned_to !== currentUserProfile.id) {
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
  };

  const addDetail = () => {
    setItemDetails([...itemDetails, { id: crypto.randomUUID(), fieldType: "Emergency contact", value: "" }]);
  };

  const removeDetail = (id: string) => {
    const detail = itemDetails.find((d) => d.id === id);
    // Prevent removing "Item owner name" if isItemOwner is false
    if (detail?.fieldType === "Item owner name" && !isItemOwner) {
      return;
    }
    setItemDetails(itemDetails.filter((d) => d.id !== id));
  };

  const updateDetail = (id: string, field: "fieldType" | "value", value: string) => {
    setItemDetails(itemDetails.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleItemOwnerChange = (isOwner: boolean) => {
    setIsItemOwner(isOwner);
    if (!isOwner) {
      // Add "Item owner name" detail if not already present
      const hasOwnerName = itemDetails.some((d) => d.fieldType === "Item owner name");
      if (!hasOwnerName) {
        setItemDetails([
          { id: crypto.randomUUID(), fieldType: "Item owner name", value: "" },
          ...itemDetails,
        ]);
      }
    } else {
      // Remove "Item owner name" detail when toggled back on
      setItemDetails(itemDetails.filter((d) => d.fieldType !== "Item owner name"));
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast({
        title: "Item name required",
        description: "Please enter a name for your item.",
        variant: "destructive",
      });
      return;
    }

    // Validate item owner name if not the owner
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // Delete old details and insert new ones
      await supabase.from("item_details").delete().eq("item_id", item.id);

      // Insert item details
      if (itemDetails.length > 0) {
        for (const detail of itemDetails) {
          if (!detail.value.trim()) continue;

          // Get or create field type
          let { data: fieldData } = await supabase
            .from("item_detail_fields")
            .select("id")
            .eq("type", detail.fieldType)
            .maybeSingle();

          if (!fieldData) {
            const { data: newField } = await supabase
              .from("item_detail_fields")
              .insert({ type: detail.fieldType })
              .select()
              .single();
            fieldData = newField;
          }

          if (fieldData) {
            await supabase.from("item_details").insert({
              item_id: item.id,
              field_id: fieldData.id,
              value: detail.value.trim(),
            });
          }
        }
      }

      // Update QR code public setting
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrError) throw qrError;

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
  };

  const handleUnassign = async () => {
    if (!qrCode || !userProfile) return;

    setUnassigning(true);
    try {
      const itemNameForNotif = item?.name || "Unknown item";

      // Delete item details if there's an item
      if (item?.id) {
        await supabase.from("item_details").delete().eq("item_id", item.id);
        await supabase.from("items").delete().eq("id", item.id);
      }

      // Reset the QR code
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
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        <div className="max-w-2xl mx-auto lg:max-w-5xl">
          {/* Go Back */}
          <Button variant="outline" size="sm" className="mb-6" onClick={() => navigate("/my-tags")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Tags
          </Button>

          {/* Two column layout on desktop */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">Edit Item</h1>
                <p className="text-muted-foreground lg:text-lg">
                  Update the information for your tagged item. When found, the finder will see this information.
                </p>
              </div>

              {/* Item Form */}
              <ItemForm
                itemName={itemName}
                setItemName={setItemName}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                description={description}
                setDescription={setDescription}
                isItemOwner={isItemOwner}
                onItemOwnerChange={handleItemOwnerChange}
              />

              {/* Item Details */}
              <ItemDetailsEditor
                details={itemDetails}
                onAdd={addDetail}
                onRemove={removeDetail}
                onUpdate={updateDetail}
              />

              {/* Submit Button - visible on mobile */}
              <div className="lg:hidden space-y-3">
                <Button
                  className="w-full gradient-loqatr text-white font-semibold h-12 text-base"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Item"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowUnassignDialog(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unassign Tag
                </Button>
              </div>
            </div>

            {/* Right Column - Info & Actions (Desktop) */}
            <div className="space-y-6 mt-8 lg:mt-0">
              {/* Contact Details Card */}
              <ContactDetailsCard user={userProfile} />

              {/* Loqatr ID */}
              {qrCode && <LoqatrIdCard loqatrId={qrCode.loqatr_id} />}

              {/* Scan History */}
              {qrCode && <ScanHistory qrCodeId={qrCode.id} />}

              {/* Actions - visible on desktop */}
              <div className="hidden lg:block space-y-3">
                <Button
                  className="w-full gradient-loqatr text-white font-semibold h-12 text-base"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Item"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowUnassignDialog(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unassign Tag
                </Button>
              </div>

              {/* Footer */}
              <p className="text-center text-sm text-muted-foreground">
                Powered by <span className="font-semibold">Waterfall Digital</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unassign Confirmation Dialog */}
      <UnassignTagDialog
        open={showUnassignDialog}
        onOpenChange={setShowUnassignDialog}
        onConfirm={handleUnassign}
        isLoading={unassigning}
        tagId={qrCode?.loqatr_id}
      />
    </AppLayout>
  );
}

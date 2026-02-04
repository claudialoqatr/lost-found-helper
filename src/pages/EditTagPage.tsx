import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Unlink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ScanHistory } from "@/components/ScanHistory";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import { ItemForm, ItemDetailsEditor, ContactDetailsCard, LoqatrIdCard, IconPicker } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
import { supabase } from "@/integrations/supabase/client";
import { notifyTagUnassigned } from "@/lib/notifications";
import { PageLoadingState, PageHeader, BackButton, GradientButton } from "@/components/shared";
import type { QRCodeData, ItemInfo } from "@/types";

export default function EditTagPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");

  // Unassign dialog state
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  // Use the shared item details manager hook
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

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirect_after_auth", `/my-tags/${code}`);
      navigate("/auth");
      return;
    }

    if (!authLoading && !profileLoading && userProfile) {
      fetchData();
    }
  }, [code, authLoading, isAuthenticated, profileLoading, userProfile]);

  const fetchData = async () => {
    if (!code || !userProfile) return;

    setLoading(true);
    try {
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

      // If not the owner, redirect
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

  const handleSubmit = async () => {
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

      // Delete old details and insert new ones
      await supabase.from("item_details").delete().eq("item_id", item.id);

      if (itemDetails.length > 0) {
        for (const detail of itemDetails) {
          if (!detail.value.trim()) continue;

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

      if (item?.id) {
        await supabase.from("item_details").delete().eq("item_id", item.id);
        await supabase.from("items").delete().eq("id", item.id);
      }

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

  if (authLoading || profileLoading || loading) {
    return <PageLoadingState />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        <div className="max-w-2xl mx-auto lg:max-w-5xl">
          <BackButton label="Back to My Tags" to="/my-tags" className="mb-6" />

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <PageHeader
                title="Edit Item"
                description="Update the information for your tagged item. When found, the finder will see this information."
              />

              <ItemForm
                itemName={itemName}
                setItemName={setItemName}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                isItemOwner={isItemOwner}
                onItemOwnerChange={handleItemOwnerChange}
              />

              <IconPicker value={iconName} onChange={setIconName} />

              <ItemDetailsEditor
                details={itemDetails}
                onAdd={addDetail}
                onRemove={removeDetail}
                onUpdate={updateDetail}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional information for the finder..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Submit Button - mobile */}
              <div className="lg:hidden space-y-3">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Update Item
                </GradientButton>
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

            {/* Right Column */}
            <div className="space-y-6 mt-8 lg:mt-0">
              <ContactDetailsCard user={userProfile} />
              {qrCode && <LoqatrIdCard loqatrId={qrCode.loqatr_id} />}
              {qrCode && <ScanHistory qrCodeId={qrCode.id} />}

              {/* Actions - desktop */}
              <div className="hidden lg:block space-y-3">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Update Item
                </GradientButton>
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
          </div>
        </div>
      </div>

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

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { 
  ItemNameField, 
  NotMyItemToggle, 
  PrivacyToggle, 
  ItemDetailsEditor, 
  ContactDetailsCard, 
  LoqatrIdCard, 
  IconPicker,
  DescriptionField,
} from "@/components/tag";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useItemDetailsManager } from "@/hooks/useItemDetailsManager";
import { supabase } from "@/integrations/supabase/client";
import { saveItemDetails } from "@/lib/itemDetailsService";
import { PageLoadingState, PageHeader, BackButton, GradientButton } from "@/components/shared";
import type { QRCodeData } from "@/types";

export default function ClaimTagPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Package");

  // Use the shared item details manager hook
  const {
    itemDetails,
    isItemOwner,
    addDetail,
    removeDetail,
    updateDetail,
    handleItemOwnerChange,
  } = useItemDetailsManager();

  const isAuthenticated = !!user;

  // Get the item owner name from details when "not my item" is toggled
  const itemOwnerName = !isItemOwner 
    ? itemDetails.find(d => d.fieldType === "Item owner name")?.value || undefined
    : undefined;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirect_after_auth", `/tag/${code}`);
      navigate("/auth");
      return;
    }

    if (!authLoading && !profileLoading) {
      fetchData();
    }
  }, [code, authLoading, isAuthenticated, profileLoading]);

  const fetchData = async () => {
    if (!code) return;

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
          title: "QR Code not found",
          description: "This QR code doesn't exist in our system.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // If QR is claimed by current user, redirect to edit page
      if (qrData.assigned_to && qrData.status === "active") {
        const isOwner = userProfile?.id === qrData.assigned_to;
        if (isOwner) {
          navigate(`/my-tags/${code}`, { replace: true });
          return;
        } else {
          navigate(`/found/${code}`, { replace: true });
          return;
        }
      }

      setQRCode(qrData);
      setIsPublic(qrData.is_public);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load QR code data.",
        variant: "destructive",
      });
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

    if (!qrCode || !userProfile) return;

    setSaving(true);
    try {
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
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          item_id: newItem.id,
          assigned_to: userProfile.id,
          is_public: isPublic,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrError) throw qrError;

      // Insert item details AFTER qrcode is linked (using shared utility)
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
  };

  if (authLoading || profileLoading || loading) {
    return <PageLoadingState />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-12 pb-24">
        <div className="max-w-2xl mx-auto lg:max-w-5xl">
          <BackButton className="mb-6" />

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <PageHeader
                title="Claim This Tag"
                description="Enter any additional info. When your item is found, the finder will see this information along with your contact info."
              />

              {/* Item Name with inline icon picker */}
              <ItemNameField
                itemName={itemName}
                setItemName={setItemName}
                iconPicker={<IconPicker value={iconName} onChange={setIconName} inline />}
              />

              {/* Compact contact details on mobile */}
              <div className="lg:hidden">
                <ContactDetailsCard user={userProfile} compact alternateOwnerName={itemOwnerName} />
              </div>

              {/* Not my item toggle */}
              <NotMyItemToggle
                isNotMyItem={!isItemOwner}
                onNotMyItemChange={(notMyItem) => handleItemOwnerChange(!notMyItem)}
              />

              {/* Item Details */}
              <ItemDetailsEditor
                details={itemDetails}
                onAdd={addDetail}
                onRemove={removeDetail}
                onUpdate={updateDetail}
              />

              {/* Description */}
              <DescriptionField value={description} onChange={setDescription} />

              {/* Privacy Toggle */}
              <PrivacyToggle isPublic={isPublic} setIsPublic={setIsPublic} />

              {/* Loqatr ID - subtle inline display */}
              {qrCode && (
                <div className="pt-4 border-t">
                  <LoqatrIdCard loqatrId={qrCode.loqatr_id} />
                </div>
              )}

              {/* Submit Button - mobile */}
              <div className="lg:hidden">
                <GradientButton
                  className="w-full"
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Claim This Tag
                </GradientButton>
              </div>
            </div>

            {/* Right Column - Desktop only */}
            <div className="hidden lg:block space-y-6 mt-0">
              <ContactDetailsCard user={userProfile} alternateOwnerName={itemOwnerName} />

              {/* Submit Button - desktop */}
              <GradientButton
                className="w-full"
                onClick={handleSubmit}
                loading={saving}
                loadingText="Saving..."
              >
                Claim This Tag
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

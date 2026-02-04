import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ItemForm, ItemDetailsEditor, ContactDetailsCard, LoqatrIdCard, type ItemDetail } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  status: string;
}

export default function ClaimTagPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [isItemOwner, setIsItemOwner] = useState(true);
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);

  // Dev bypass check
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  const isAuthenticated = user || devBypass;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Store the intended destination and redirect to auth
      sessionStorage.setItem("redirect_after_auth", `/tag/${code}`);
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
          title: "QR Code not found",
          description: "This QR code doesn't exist in our system.",
          variant: "destructive",
        });
        navigate("/");
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
        // Mock profile for dev mode
        currentUserProfile = {
          id: 1,
          name: "Dev User",
          email: "dev@loqatr.com",
          phone: "0123456789",
        };
        setUserProfile(currentUserProfile);
      }

      // If QR is claimed by current user, redirect to edit page
      if (qrData.assigned_to && qrData.status === "active") {
        const isOwner = currentUserProfile?.id === qrData.assigned_to;
        if (isOwner) {
          navigate(`/my-tags/${code}`, { replace: true });
          return;
        } else {
          // Claimed by someone else, redirect to finder page
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

    if (!qrCode || !userProfile) return;

    setSaving(true);
    try {
      // Create new item
      const { data: newItem, error: itemError } = await supabase
        .from("items")
        .insert({
          name: itemName.trim(),
          description: description.trim() || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // IMPORTANT: Update QR code FIRST to establish ownership
      // This is required because item_details RLS checks qrcode ownership
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

      // Insert item details AFTER qrcode is linked (RLS requires ownership)
      if (itemDetails.length > 0 && newItem) {
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
              item_id: newItem.id,
              field_id: fieldData.id,
              value: detail.value.trim(),
            });
          }
        }
      }

      toast({
        title: "Tag claimed!",
        description: "This QR code is now linked to your account.",
      });

      // Redirect to edit page after claiming
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
          <Button variant="outline" size="sm" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          {/* Two column layout on desktop */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">Claim This Tag</h1>
                <p className="text-muted-foreground lg:text-lg">
                  Enter any additional info. When your item is found, the finder will see this information along with
                  your contact info.
                </p>
              </div>

              {/* Item Form */}
              <ItemForm
                itemName={itemName}
                setItemName={setItemName}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
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

              {/* Description */}
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

              {/* Submit Button - visible on mobile */}
              <div className="lg:hidden">
                <Button
                  className="w-full gradient-loqatr text-white font-semibold h-12 text-base"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Claim This Tag"}
                </Button>
              </div>
            </div>

            {/* Right Column - Contact Details & Actions (Desktop) */}
            <div className="space-y-6 mt-8 lg:mt-0">
              {/* Contact Details Card */}
              <ContactDetailsCard user={userProfile} />

              {/* Loqatr ID */}
              {qrCode && <LoqatrIdCard loqatrId={qrCode.loqatr_id} />}

              {/* Submit Button - visible on desktop */}
              <div className="hidden lg:block">
                <Button
                  className="w-full gradient-loqatr text-white font-semibold h-12 text-base"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Claim This Tag"}
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
    </AppLayout>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ScanHistory } from "@/components/ScanHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ItemDetail {
  id: string;
  fieldType: string;
  value: string;
}

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

const FIELD_TYPES = ["Emergency contact", "Return address", "Reward offer", "Medical info", "Pet info", "Other"];

export default function ClaimTagPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [qrCode, setQRCode] = useState<QRCodeData | null>(null);
  const [existingItem, setExistingItem] = useState<ItemData | null>(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);

  // Dev bypass check
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  const isAuthenticated = user || devBypass;

  useEffect(() => {
    if (!isAuthenticated) {
      // Store the intended destination and redirect to auth
      sessionStorage.setItem("redirect_after_auth", `/tag/${code}`);
      navigate("/auth");
      return;
    }

    fetchData();
  }, [code, isAuthenticated]);

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

      setQRCode(qrData);
      setIsPublic(qrData.is_public);

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

      // If QR is claimed by someone else, redirect to finder page
      if (qrData.assigned_to && qrData.status === "active") {
        const isOwner = currentUserProfile?.id === qrData.assigned_to;
        if (!isOwner) {
          navigate(`/found/${code}`);
          return;
        }
      }

      // If there's an existing item, fetch it
      if (qrData.item_id) {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;
        if (itemData) {
          setExistingItem(itemData);
          setItemName(itemData.name);
          setDescription(itemData.description || "");

          // Fetch item details
          const { data: detailsData } = await supabase
            .from("item_details")
            .select("*, item_detail_fields(*)")
            .eq("item_id", itemData.id);

          if (detailsData) {
            setItemDetails(
              detailsData.map((d) => ({
                id: crypto.randomUUID(),
                fieldType: d.item_detail_fields?.type || "Other",
                value: d.value,
              })),
            );
          }
        }
      }
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
    setItemDetails(itemDetails.filter((d) => d.id !== id));
  };

  const updateDetail = (id: string, field: "fieldType" | "value", value: string) => {
    setItemDetails(itemDetails.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
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

    if (!qrCode || !userProfile) return;

    setSaving(true);
    try {
      let itemId = existingItem?.id;

      if (existingItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from("items")
          .update({
            name: itemName.trim(),
            description: description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;

        // Delete old details
        await supabase.from("item_details").delete().eq("item_id", existingItem.id);
      } else {
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
        itemId = newItem.id;
      }

      // Insert item details
      if (itemDetails.length > 0 && itemId) {
        // Ensure field types exist
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
              item_id: itemId,
              field_id: fieldData.id,
              value: detail.value.trim(),
            });
          }
        }
      }

      // Update QR code
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          item_id: itemId,
          assigned_to: userProfile.id,
          is_public: isPublic,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", qrCode.id);

      if (qrError) throw qrError;

      toast({
        title: existingItem ? "Item updated!" : "Tag claimed!",
        description: existingItem
          ? "Your item details have been saved."
          : "This QR code is now linked to your account.",
      });

      navigate("/");
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

  if (loading) {
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
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {existingItem ? "Edit Item" : "Claim This Tag"}
                  </h1>
                  <p className="text-muted-foreground lg:text-lg">
                    Enter any additional info. When your item is found, the finder will see this information along with
                    your contact info.
                  </p>
                </div>

                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Scooter, Laptop, Keys"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="text-base"
                  />
                </div>

                {/* Public/Private Toggle */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={!isPublic ? "font-medium" : "text-muted-foreground"}>Private</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Private mode hides your contact details. Finders can only send you a message through our
                          platform.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />

                  <div className="flex items-center gap-2">
                    <span className={isPublic ? "font-medium" : "text-muted-foreground"}>Public</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Public mode shows your contact details directly to anyone who scans your QR code.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Item Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Item Details</h3>
                  <div className="space-y-3">
                    {itemDetails.map((detail) => (
                      <div key={detail.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Select value={detail.fieldType} onValueChange={(v) => updateDetail(detail.id, "fieldType", v)}>
                          <SelectTrigger className="w-full sm:w-[160px] shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2 flex-1">
                          <Input
                            placeholder="Value"
                            value={detail.value}
                            onChange={(e) => updateDetail(detail.id, "value", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => removeDetail(detail.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-4" onClick={addDetail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add new detail
                  </Button>
                </div>

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
                    {saving ? "Saving..." : existingItem ? "Update QR Code Item" : "Claim This Tag"}
                  </Button>
                </div>
              </div>

              {/* Right Column - Contact Details & Actions (Desktop) */}
              <div className="space-y-6 mt-8 lg:mt-0">
                {/* Contact Details Card */}
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-4">Your Contact Details</h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Name</Label>
                        <p className="text-loqatr-midnight dark:text-foreground font-medium">
                          {userProfile?.name || "—"}
                        </p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-sm">Email</Label>
                        <p className="text-loqatr-midnight dark:text-foreground font-medium">
                          {userProfile?.email || "—"}
                        </p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground text-sm">Phone</Label>
                        <p className="text-loqatr-midnight dark:text-foreground font-medium">
                          {userProfile?.phone || "Not set"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic mt-4 pt-4 border-t">
                      These details will be visible to anyone who scans your QR code when in public mode.
                    </p>
                  </CardContent>
                </Card>

                {/* Loqatr ID */}
                {qrCode && (
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold">Loqatr ID</h3>
                      <p className="text-loqatr-midnight dark:text-accent font-mono text-lg">{qrCode.loqatr_id}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Scan History - only for existing items */}
                {existingItem && qrCode && (
                  <ScanHistory qrCodeId={qrCode.id} />
                )}

                {/* Submit Button - visible on desktop */}
                <div className="hidden lg:block">
                  <Button
                    className="w-full gradient-loqatr text-white font-semibold h-12 text-base"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : existingItem ? "Update QR Code Item" : "Claim This Tag"}
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

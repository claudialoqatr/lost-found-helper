import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Phone, Mail, MessageCircle, MapPin, Send, CheckCircle, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notifyTagScanned, notifyMessageReceived } from "@/lib/notifications";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";

interface OwnerInfo {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface ItemInfo {
  id: number;
  name: string;
  description: string | null;
}

interface ItemDetail {
  type: string;
  value: string;
}

interface QRCodeInfo {
  id: number;
  loqatr_id: string;
  is_public: boolean;
  item_id: number | null;
  assigned_to: number | null;
  status: string;
}

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export default function FinderPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [qrCode, setQRCode] = useState<QRCodeInfo | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([]);
  const [location, setLocation] = useState<LocationData>({ latitude: null, longitude: null, address: null });
  const [locationLoading, setLocationLoading] = useState(true);

  // Message form state (for private mode)
  const [finderName, setFinderName] = useState("");
  const [finderEmail, setFinderEmail] = useState("");
  const [finderPhone, setFinderPhone] = useState("");
  const [message, setMessage] = useState("");

  // Dev bypass
  const devBypass = localStorage.getItem("dev_bypass") === "true";

  // Get finder's location
  const getLocation = useCallback(async () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get address from coordinates using a free geocoding API
        let address = null;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          address = data.display_name || null;
        } catch (e) {
          console.log("Geocoding failed:", e);
        }

        setLocation({ latitude, longitude, address });
        setLocationLoading(false);
      },
      (error) => {
        console.log("Location error:", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    fetchData();
  }, [code]);

  const fetchData = async () => {
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
      if (user || devBypass) {
        let currentUserId: number | null = null;

        if (user) {
          const { data: profileData } = await supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle();
          currentUserId = profileData?.id || null;
        } else if (devBypass) {
          currentUserId = 1; // Mock dev user
        }

        if (currentUserId === qrData.assigned_to) {
          // Owner is viewing - redirect to edit
          navigate(`/tag/${code}`);
          return;
        }
      }

      // Fetch owner info ONLY for public tags (RLS blocks this for private tags for non-owners)
      if (qrData.is_public) {
        const { data: ownerData, error: ownerError } = await supabase
          .from("users")
          .select("id, name, email, phone")
          .eq("id", qrData.assigned_to)
          .maybeSingle();

        if (!ownerError && ownerData) {
          setOwner(ownerData);
        }
      }

      // Fetch item info
      if (qrData.item_id) {
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", qrData.item_id)
          .maybeSingle();

        if (itemError) throw itemError;
        setItem(itemData);

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
            })),
          );
        }
      }

      // Record the scan
      await recordScan(qrData.id);
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
  };

  const recordScan = async (qrCodeId: number) => {
    try {
      // Wait briefly for location if still loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { error } = await supabase.from("scans").insert({
        qr_code_id: qrCodeId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        is_owner: false,
      });

      if (error) {
        console.error("Failed to record scan:", error);
        return;
      }

      // Notify owner that their tag was scanned
      if (qrCode?.assigned_to && item) {
        await notifyTagScanned(
          qrCode.assigned_to,
          item.name,
          qrCodeId,
          location.address
        );
      }
    } catch (e) {
      console.error("Scan recording error:", e);
    }
  };

  const handleSendMessage = async () => {
    if (!finderName.trim() || (!finderEmail.trim() && !finderPhone.trim())) {
      toast({
        title: "Contact info required",
        description: "Please provide your name and either email or phone.",
        variant: "destructive",
      });
      return;
    }

    if (!item || !qrCode) return;

    setSending(true);
    try {
      const { data: loqatrData, error } = await supabase
        .from("loqatrs")
        .insert({
          item_id: item.id,
          name: finderName.trim(),
          email: finderEmail.trim() || null,
          phone: finderPhone.trim() || null,
          message: message.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify owner about the message
      if (qrCode.assigned_to && loqatrData) {
        await notifyMessageReceived(
          qrCode.assigned_to,
          item.name,
          finderName.trim(),
          qrCode.id,
          loqatrData.id,
          location.address
        );
      }

      setMessageSent(true);
      toast({
        title: "Message sent!",
        description: "The owner has been notified about their found item.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getOwnerFirstName = () => {
    if (!owner) return "Owner";
    return owner.name.split(" ")[0];
  };

  const getWhatsAppLink = () => {
    if (!owner?.phone) return null;
    const cleanPhone = owner.phone.replace(/\D/g, "");
    const locationText = location.address ? `\n\n Found at: ${location.address}` : "";
    const itemMessage = encodeURIComponent(
      `Hi ${getOwnerFirstName()}! I found your ${item?.name || "item"} tagged with Loqatr.${locationText}`,
    );
    return `https://wa.me/${cleanPhone}?text=${itemMessage}`;
  };

  const getEmailLink = () => {
    if (!owner?.email) return null;
    const locationText = location.address ? `\n\nFound at: ${location.address}` : "";
    const subject = encodeURIComponent(`Found: ${item?.name || "Your Item"}`);
    const body = encodeURIComponent(
      `Hi ${getOwnerFirstName()},\n\nI found your ${item?.name || "item"} tagged with Loqatr.${locationText}\n\nPlease let me know how I can return it to you.`,
    );
    return `mailto:${owner.email}?subject=${subject}&body=${body}`;
  };

  const getPhoneLink = () => {
    if (!owner?.phone) return null;
    return `tel:${owner.phone}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center justify-between px-4">
            <Link to="/my-tags">
              <img 
                src={resolvedTheme === "dark" ? logoLight : logoDark} 
                alt="LOQATR" 
                className="h-14 w-auto"
              />
            </Link>
            <div className="flex items-center gap-2">
              {!user && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-loqatr text-primary-foreground"
                    onClick={() => navigate("/auth")}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              You have found{" "}
              <span className="gradient-loqatr-text">
                {qrCode?.is_public ? `${getOwnerFirstName()}'s` : "Someone's"}
              </span>{" "}
              {item?.name || "Item"}!
            </h1>
            <p className="text-muted-foreground">
              Thank you for being awesome!{" "}
              {qrCode?.is_public
                ? "You can reach out to the owner directly below or send them a notification through our app."
                : "You can send the owner a message through our secure platform."}
            </p>
          </div>

          {/* Item Details Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-lg mb-4">Item Details:</h2>

              {itemDetails.length > 0 ? (
                <div className="space-y-3">
                  {itemDetails.map((detail, index) => (
                    <div key={index}>
                      <span className="font-medium">{detail.type}:</span>{" "}
                      <span className="text-muted-foreground">{detail.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {item?.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1">Additional Details:</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              )}

              {itemDetails.length === 0 && !item?.description && (
                <p className="text-muted-foreground">No additional details provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Location Status */}
          {location.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 px-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location.address}</span>
            </div>
          )}

          {/* Contact Section */}
          {qrCode?.is_public ? (
            /* PUBLIC MODE - Direct contact options */
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-center">Contact {getOwnerFirstName()}</h2>
              <p className="text-center text-muted-foreground text-sm mb-6">
                Choose how you'd like to reach out to the owner
              </p>

              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {owner?.phone && (
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
                    onClick={() => window.open(getPhoneLink()!, "_blank")}
                  >
                    <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2 md:mb-4">
                        <Phone className="h-5 w-5 md:h-8 md:w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Call</h3>
                      <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Speak directly with {getOwnerFirstName()}</p>
                    </CardContent>
                  </Card>
                )}

                {owner?.phone && (
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
                    onClick={() => window.open(getWhatsAppLink()!, "_blank")}
                  >
                    <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 md:mb-4">
                        <MessageCircle className="h-5 w-5 md:h-8 md:w-8 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">WhatsApp</h3>
                      <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Send a quick message</p>
                    </CardContent>
                  </Card>
                )}

                {owner?.email && (
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
                    onClick={() => window.open(getEmailLink()!, "_blank")}
                  >
                    <CardContent className="p-3 md:pt-6 md:pb-6 flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 md:mb-4">
                        <Mail className="h-5 w-5 md:h-8 md:w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">Email</h3>
                      <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Send a detailed message</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            /* PRIVATE MODE - Anonymous messaging */
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Send a Secure Message</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  The owner's contact info is private. Send them a message and they'll get in touch with you.
                </p>

                {messageSent ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">The owner has been notified. Thank you for helping!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="finderName">Your Name *</Label>
                      <Input
                        id="finderName"
                        placeholder="Enter your name"
                        value={finderName}
                        onChange={(e) => setFinderName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="finderEmail">Email</Label>
                      <Input
                        id="finderEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={finderEmail}
                        onChange={(e) => setFinderEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="finderPhone">Phone</Label>
                      <Input
                        id="finderPhone"
                        type="tel"
                        placeholder="+27..."
                        value={finderPhone}
                        onChange={(e) => setFinderPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Let the owner know where and how they can collect their item..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full gradient-loqatr text-primary-foreground h-12"
                      onClick={handleSendMessage}
                      disabled={sending}
                    >
                      {sending ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Also show message option for public mode */}
          {qrCode?.is_public && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Or{" "}
              <button
                className="text-primary underline"
                onClick={() => {
                  // Convert to private mode view for messaging
                  if (qrCode) setQRCode({ ...qrCode, is_public: false });
                }}
              >
                send an anonymous message
              </button>{" "}
              instead
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

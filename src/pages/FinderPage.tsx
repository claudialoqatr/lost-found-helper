import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocationData } from "@/hooks/useLocationData";
import { useFinderPageData } from "@/hooks/useFinderPageData";
import {
  FinderHeader,
  ItemDetailsCard,
  PrivateMessageForm,
  ContactRevealGate,
  PublicContactOptions,
} from "@/components/finder";
import type { RevealedContact } from "@/types";

export default function FinderPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Only log scans when ?scan=true is present (physical QR scan)
  const isScan = searchParams.get("scan") === "true";

  // Location tracking
  const { location, loading: locationLoading } = useLocationData();

  // Data fetching and routing
  const { loading, qrCode, item, itemDetails, setQRCode, getDisplayOwnerName } = useFinderPageData({
    code,
    user,
    isScan,
    location,
    locationLoading,
  });

  // Contact reveal state (for public mode)
  const [revealedContact, setRevealedContact] = useState<RevealedContact | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const displayOwnerName = getDisplayOwnerName(revealedContact);

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <FinderHeader />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              You have found{" "}
              <span className="gradient-loqatr-text">
                {qrCode?.is_public ? `${displayOwnerName}'s` : "Someone's"}
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
          <ItemDetailsCard item={item} itemDetails={itemDetails} />

          {/* Location Status */}
          {location.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 px-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location.address}</span>
            </div>
          )}

          {/* Contact Section */}
          {qrCode?.is_public ? (
            /* PUBLIC MODE - Gated contact reveal */
            revealedContact ? (
              <PublicContactOptions
                contact={revealedContact}
                itemName={item?.name || "Item"}
                locationAddress={location.address}
              />
            ) : (
              <ContactRevealGate
                qrCodeId={qrCode?.id || 0}
                qrIdentifier={code || ""}
                displayOwnerName={displayOwnerName}
                location={location}
                onContactRevealed={setRevealedContact}
              />
            )
          ) : (
            /* PRIVATE MODE - Anonymous messaging */
            item && qrCode && (
              <PrivateMessageForm
                item={item}
                qrCode={qrCode}
                locationAddress={location.address}
              />
            )
          )}

          {/* Also show message option for public mode */}
          {qrCode?.is_public && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Or{" "}
              <button
                className="text-primary underline"
                onClick={() => {
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

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Turnstile } from "@/components/Turnstile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Turnstile site key - this is a publishable key
const TURNSTILE_SITE_KEY = "0x4AAAAAABfQhbFMlvEyDxaH";

interface OwnerContact {
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  whatsapp_url: string | null;
}

interface ContactRevealGateProps {
  scanId: number | null;
  qrIdentifier: string;
  displayOwnerName: string;
  onContactRevealed: (contact: OwnerContact) => void;
}

export function ContactRevealGate({
  scanId,
  qrIdentifier,
  displayOwnerName,
  onContactRevealed,
}: ContactRevealGateProps) {
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    setCaptchaError(false);
  };

  const handleTurnstileError = () => {
    setCaptchaError(true);
    toast({
      title: "Verification failed",
      description: "Please try the captcha again.",
      variant: "destructive",
    });
  };

  const handleRevealContact = async () => {
    if (!turnstileToken || !scanId) {
      toast({
        title: "Please complete verification",
        description: "Complete the captcha to reveal contact information.",
        variant: "destructive",
      });
      return;
    }

    setRevealing(true);
    try {
      const { data, error } = await supabase.functions.invoke("reveal-contact", {
        body: {
          scan_id: scanId,
          qr_identifier: qrIdentifier,
          turnstile_token: turnstileToken,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.contact) {
        onContactRevealed(data.contact);
        toast({
          title: "Contact revealed",
          description: "You can now contact the owner.",
        });
      }
    } catch (error: any) {
      console.error("Reveal contact error:", error);
      
      const errorMessage = error?.message || "Failed to reveal contact information.";
      
      if (errorMessage.includes("Rate limit")) {
        toast({
          title: "Rate limit exceeded",
          description: "You can only view 12 contacts per hour. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setRevealing(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Contact {displayOwnerName}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          To protect privacy and prevent spam, please verify you're human to reveal contact details.
        </p>

        <div className="space-y-4">
          {/* Turnstile Captcha */}
          <div className="flex justify-center">
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          {captchaError && (
            <p className="text-sm text-destructive text-center">
              Captcha verification failed. Please try again.
            </p>
          )}

          <Button
            className="w-full gradient-loqatr text-primary-foreground h-12"
            onClick={handleRevealContact}
            disabled={!turnstileToken || revealing || !scanId}
          >
            {revealing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Revealing...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Reveal Contact Info
              </>
            )}
          </Button>

          {!scanId && (
            <p className="text-xs text-muted-foreground text-center">
              Waiting for scan to be recorded...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

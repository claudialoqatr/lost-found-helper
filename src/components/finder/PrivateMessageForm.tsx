import { useState } from "react";
import { Send, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ItemInfo, QRCodeData } from "@/types";

interface PrivateMessageFormProps {
  item: ItemInfo;
  qrCode: QRCodeData;
  locationAddress: string | null;
}

/**
 * Self-contained form for sending anonymous messages to item owners.
 * Handles validation, submission via edge function, and success state.
 */
export function PrivateMessageForm({ item, qrCode, locationAddress }: PrivateMessageFormProps) {
  const { toast } = useToast();

  const [finderName, setFinderName] = useState("");
  const [finderEmail, setFinderEmail] = useState("");
  const [finderPhone, setFinderPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSendMessage = async () => {
    if (!finderName.trim() || (!finderEmail.trim() && !finderPhone.trim())) {
      toast({
        title: "Contact info required",
        description: "Please provide your name and either email or phone.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-finder-message", {
        body: {
          item_id: item.id,
          name: finderName.trim(),
          email: finderEmail.trim() || null,
          phone: finderPhone.trim() || null,
          message: message.trim() || null,
          qrcode_id: qrCode.id,
          owner_id: qrCode.assigned_to,
          location_address: locationAddress,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Failed to send message");
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Send a Secure Message</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          The owner's contact info is private. Send them a message and they'll get in touch with
          you.
        </p>

        {messageSent ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
            <p className="text-muted-foreground">
              The owner has been notified. Thank you for helping!
            </p>
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
                maxLength={100}
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
                maxLength={254}
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
                maxLength={20}
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
                maxLength={1000}
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
  );
}

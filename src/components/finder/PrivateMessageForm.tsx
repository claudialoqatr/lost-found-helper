import { useState } from "react";
import { Send, Shield, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ItemInfo, QRCodeData } from "@/types";

// Validation schema
const finderMessageSchema = z.object({
  name: z.string()
    .min(1, "Please enter your name")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .max(254, "Email is too long")
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Please enter a valid email"),
  phone: z.string()
    .max(20, "Phone number is too long")
    .refine((val) => val === "" || /^\+?[\d\s-()]+$/.test(val), "Please enter a valid phone number"),
  message: z.string().max(1000, "Message must be less than 1000 characters"),
}).refine((data) => data.email.trim() !== "" || data.phone.trim() !== "", {
  message: "Please provide either an email or phone number",
  path: ["email"],
});

type FinderMessageFormData = z.infer<typeof finderMessageSchema>;

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
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const form = useForm<FinderMessageFormData>({
    resolver: zodResolver(finderMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const handleSendMessage = async (data: FinderMessageFormData) => {
    setSending(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("submit-finder-message", {
        body: {
          item_id: item.id,
          name: data.name.trim(),
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          message: data.message.trim() || null,
          qrcode_id: qrCode.id,
          owner_id: qrCode.assigned_to,
          location_address: locationAddress,
        },
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || "Failed to send message");
      }

      setMessageSent(true);
      toast({
        title: "Message sent!",
        description: "The owner has been notified about their found item.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Couldn't Send Message",
        description: "Something went wrong. Please check your connection and try again.",
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendMessage)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        maxLength={100}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        maxLength={254}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+27..."
                        maxLength={20}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Let the owner know where and how they can collect their item..."
                        rows={3}
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span>{field.value.length}/1000</span>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full gradient-loqatr text-primary-foreground h-12"
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
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

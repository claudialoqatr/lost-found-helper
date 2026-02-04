import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User, Mail, Phone, Clock, Package, MapPin } from "lucide-react";
import { format } from "date-fns";

interface MessageWithLocation {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
  item_id: number | null;
  item: { id: number; name: string } | null;
  location: string | null;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        // Fetch messages
        const { data: loqatrsData, error: fetchError } = await supabase
          .from("loqatrs")
          .select(`
            id,
            name,
            email,
            phone,
            message,
            created_at,
            item_id,
            item:items (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Fetch locations from notifications (linked via loqatr_message_id)
        const loqatrIds = (loqatrsData || []).map((l) => l.id);
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("loqatr_message_id, location")
          .in("loqatr_message_id", loqatrIds)
          .not("location", "is", null);

        // Map location to messages
        const locationMap = new Map<number, string>();
        (notificationsData || []).forEach((n) => {
          if (n.loqatr_message_id && n.location) {
            locationMap.set(n.loqatr_message_id, n.location);
          }
        });

        const messagesWithLocation: MessageWithLocation[] = (loqatrsData || []).map((msg) => ({
          ...msg,
          location: locationMap.get(msg.id) || null,
        }));

        setMessages(messagesWithLocation);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages. Please try again.");
      } finally {
      setLoading(false);
    }
  }

    if (!authLoading && user) {
      fetchMessages();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Messages from people who found your items</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <MessageSquare className="w-3 h-3 mr-1" />
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </Badge>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10 mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground max-w-sm">
                When someone finds one of your items and sends a message, it will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Messages list */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <Card key={msg.id} className="hover:border-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {msg.name || "Anonymous Finder"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {msg.created_at
                            ? format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")
                            : "Recently"}
                        </CardDescription>
                      </div>
                    </div>
                    {msg.item && (
                      <Badge variant="secondary" className="w-fit">
                        <Package className="w-3 h-3 mr-1" />
                        {msg.item.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message content */}
                  {msg.message && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  )}

                  {/* Location info */}
                  {msg.location && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />
                      <span className="break-words">{msg.location}</span>
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {msg.email}
                      </a>
                    )}
                    {msg.phone && (
                      <a
                        href={`tel:${msg.phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {msg.phone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

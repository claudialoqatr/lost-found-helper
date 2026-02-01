import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Package, QrCode, Clock, CheckCircle, Unlink } from "lucide-react";
import { format } from "date-fns";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import { useToast } from "@/hooks/use-toast";
import { notifyTagUnassigned } from "@/lib/notifications";

interface TagWithItem {
  id: number;
  loqatr_id: string;
  status: string;
  is_public: boolean;
  created_at: string | null;
  last_scanned_at: string | null;
  item: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

export default function MyTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState(false);
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [tagToUnassign, setTagToUnassign] = useState<TagWithItem | null>(null);

  // Check for dev bypass
  const devBypass = localStorage.getItem("dev_bypass") === "true";

  useEffect(() => {
    if (!authLoading && !user && !devBypass) {
      navigate("/auth");
    }
  }, [user, authLoading, devBypass, navigate]);

  useEffect(() => {
    async function fetchTags() {
      try {
        // Get user's internal ID first
        let userId: number | null = null;
        
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single();
          userId = userData?.id ?? null;
        }

        // Must have a user to see tags (no dev bypass showing all tags)
        if (!userId) {
          setTags([]);
          setLoading(false);
          return;
        }

        // Fetch tags assigned to this user
        const { data: qrcodeData, error: fetchError } = await supabase
          .from("qrcodes")
          .select(`
            id,
            loqatr_id,
            status,
            is_public,
            created_at,
            item:items (
              id,
              name,
              description
            )
          `)
          .eq("status", "active")
          .eq("assigned_to", userId)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Fetch last scan for each tag
        const tagsWithScans: TagWithItem[] = await Promise.all(
          (qrcodeData || []).map(async (tag) => {
            const { data: scanData } = await supabase
              .from("scans")
              .select("scanned_at")
              .eq("qr_code_id", tag.id)
              .order("scanned_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...tag,
              last_scanned_at: scanData?.scanned_at || null,
            } as TagWithItem;
          })
        );

        setTags(tagsWithScans);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
        setError("Failed to load your tags. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && (user || devBypass)) {
      fetchTags();
    }
  }, [user, authLoading, devBypass]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-accent/20 text-accent border-accent/30"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "assigned":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUnassignClick = (e: React.MouseEvent, tag: TagWithItem) => {
    e.stopPropagation(); // Prevent navigation to tag page
    setTagToUnassign(tag);
    setShowUnassignDialog(true);
  };

  const handleUnassign = async () => {
    if (!tagToUnassign) return;

    setUnassigning(true);
    try {
      const itemName = tagToUnassign.item?.name || "Unknown item";
      
      // Delete item details if there's an item
      if (tagToUnassign.item?.id) {
        await supabase.from("item_details").delete().eq("item_id", tagToUnassign.item.id);
        
        // Delete the item
        await supabase.from("items").delete().eq("id", tagToUnassign.item.id);
      }

      // Reset the QR code
      const { error: qrError } = await supabase
        .from("qrcodes")
        .update({
          assigned_to: null,
          item_id: null,
          is_public: false,
          status: "unassigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagToUnassign.id);

      if (qrError) throw qrError;

      // Get user ID for notification
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        
        if (userData?.id) {
          await notifyTagUnassigned(userData.id, itemName);
        }
      }

      // Remove from local state
      setTags(tags.filter(t => t.id !== tagToUnassign.id));

      toast({
        title: "Tag unassigned",
        description: "The tag has been cleared and is ready to be claimed again.",
      });

      setShowUnassignDialog(false);
      setTagToUnassign(null);
    } catch (error) {
      console.error("Error unassigning:", error);
      toast({
        title: "Error",
        description: "Failed to unassign tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnassigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
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
            <h1 className="text-2xl md:text-3xl font-bold">My Tags</h1>
            <p className="text-muted-foreground">Manage your claimed QR tags and items</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Tag className="w-3 h-3 mr-1" />
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
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
          {!loading && tags.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tags claimed yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Scan a LOQATR QR code to claim it and start protecting your belongings.
                </p>
                <Button asChild>
                  <Link to="/tag/LOQ-TEST-001">
                    Try Demo Tag
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tags grid */}
          {tags.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <Card 
                  key={tag.id} 
                  className="group hover:border-accent/50 transition-colors cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate(`/tag/${tag.loqatr_id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">
                            {tag.item?.name || "Unnamed Item"}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {tag.loqatr_id}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(tag.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tag.item?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tag.item.description}
                      </p>
                    )}
                    
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {tag.last_scanned_at 
                          ? `Last scanned ${format(new Date(tag.last_scanned_at), "MMM d, yyyy")}`
                          : "Never scanned"
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Unassign Confirmation Dialog */}
        <UnassignTagDialog
          open={showUnassignDialog}
          onOpenChange={setShowUnassignDialog}
          onConfirm={handleUnassign}
          isLoading={unassigning}
          tagId={tagToUnassign?.loqatr_id}
        />
      </AppLayout>
    );
  }

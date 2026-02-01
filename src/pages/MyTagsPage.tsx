import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Tag, Package, QrCode, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TagWithItem {
  id: number;
  loqatr_id: string;
  status: string;
  is_public: boolean;
  created_at: string | null;
  item: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

export default function MyTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<TagWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // In dev bypass mode, get all active tags for demo purposes
        const query = supabase
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
          .eq("status", "active");

        // Only filter by assigned_to if we have a real user
        if (userId) {
          query.eq("assigned_to", userId);
        }

        const { data, error: fetchError } = await query.order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setTags(data as TagWithItem[] || []);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">My Tags</h1>
                <p className="text-muted-foreground">Manage your claimed QR tags and items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Tag className="w-3 h-3 mr-1" />
                {tags.length} {tags.length === 1 ? "tag" : "tags"}
              </Badge>
            </div>
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
                <Card key={tag.id} className="group hover:border-accent/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
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
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {tag.created_at 
                          ? `Claimed ${format(new Date(tag.created_at), "MMM d, yyyy")}`
                          : "Recently claimed"
                        }
                      </span>
                      <Button variant="ghost" size="sm" asChild className="group-hover:text-accent">
                        <Link to={`/tag/${tag.loqatr_id}`}>
                          View <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

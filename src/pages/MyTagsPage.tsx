import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyTags } from "@/hooks/useMyTags";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, QrCode, Globe, Lock } from "lucide-react";
import { format } from "date-fns";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import { useToast } from "@/hooks/use-toast";
import { getIconByName } from "@/components/tag";
import type { TagWithItem } from "@/types";
import { useState } from "react";

export default function MyTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tags, loading, error, unassignTag, isUnassigning } = useMyTags();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [tagToUnassign, setTagToUnassign] = useState<TagWithItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const getPrivacyBadge = (isPublic: boolean) => {
    if (isPublic) {
      return (
        <Badge className="bg-accent/20 text-accent border-accent/30">
          <Globe className="w-3 h-3 mr-1" /> Public
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Lock className="w-3 h-3 mr-1" /> Private
      </Badge>
    );
  };

  const handleUnassign = async () => {
    if (!tagToUnassign) return;

    try {
      await unassignTag(tagToUnassign);

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
              <p className="text-destructive">{error.message}</p>
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
                onClick={() => navigate(`/my-tags/${tag.loqatr_id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const IconComponent = getIconByName(tag.item?.icon_name || "Package");
                          return <IconComponent className="w-6 h-6 text-accent" />;
                        })()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">
                          {tag.item?.name || "Unnamed Item"}
                        </CardTitle>
                      </div>
                    </div>
                    {getPrivacyBadge(tag.is_public)}
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

      <UnassignTagDialog
        open={showUnassignDialog}
        onOpenChange={setShowUnassignDialog}
        onConfirm={handleUnassign}
        isLoading={isUnassigning}
        tagId={tagToUnassign?.loqatr_id}
      />
    </AppLayout>
  );
}

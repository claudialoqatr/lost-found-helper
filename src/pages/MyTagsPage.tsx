import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyTags } from "@/hooks/useMyTags";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tag, QrCode, Globe, Lock, Search } from "lucide-react";
import { format } from "date-fns";
import { UnassignTagDialog } from "@/components/UnassignTagDialog";
import { useToast } from "@/hooks/use-toast";
import { getIconByName } from "@/components/tag";
import type { TagWithItem } from "@/types";

type SortOption = "alphabetical" | "last_added" | "last_scanned";
const ITEMS_PER_PAGE = 8;

export default function MyTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tags, loading, error, unassignTag, isUnassigning } = useMyTags();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  const [tagToUnassign, setTagToUnassign] = useState<TagWithItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("last_added");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let result = [...tags];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((tag) => tag.item?.name?.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          const nameA = a.item?.name?.toLowerCase() || "";
          const nameB = b.item?.name?.toLowerCase() || "";
          return nameA.localeCompare(nameB);
        case "last_added":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "last_scanned":
          const scanA = a.last_scanned_at ? new Date(a.last_scanned_at).getTime() : 0;
          const scanB = b.last_scanned_at ? new Date(b.last_scanned_at).getTime() : 0;
          return scanB - scanA;
        default:
          return 0;
      }
    });

    return result;
  }, [tags, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTags.length / ITEMS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTags.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTags, currentPage]);

  // Reset to page 1 when search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

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
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Tags</h1>
              <p className="text-muted-foreground">Manage your claimed QR tags and items</p>
            </div>
            <Badge variant="outline" className="w-fit">
              <Tag className="w-3 h-3 mr-1" />
              {tags.length} {tags.length === 1 ? "tag" : "tags"}
            </Badge>
          </div>

          {/* Search and Sort Controls */}
          {tags.length > 0 && (
            <div className="flex flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[120px] sm:w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_added">Last Added</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="last_scanned">Last Scanned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
                <Link to="/tag/LOQ-TEST-001">Try Demo Tag</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No search results */}
        {!loading && tags.length > 0 && filteredAndSortedTags.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matching tags</h3>
              <p className="text-muted-foreground">No items match "{searchQuery}"</p>
            </CardContent>
          </Card>
        )}

        {/* Tags grid */}
        {paginatedTags.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedTags.map((tag) => (
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
                          <CardTitle className="text-lg truncate">{tag.item?.name || "Unnamed Item"}</CardTitle>
                        </div>
                      </div>
                      {getPrivacyBadge(tag.is_public)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tag.item?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{tag.item.description}</p>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {tag.last_scanned_at
                          ? `Last scanned ${format(new Date(tag.last_scanned_at), "MMM d, yyyy")}`
                          : "Never scanned"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and adjacent pages
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <PaginationItem key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTags.length)} of{" "}
                  {filteredAndSortedTags.length}
                </p>
              </div>
            )}
          </>
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

import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout, QRCodeBuilder } from "@/components/admin";
import { useBatches } from "@/hooks/useBatches";
import { PageHeader, LoadingSpinner, BackButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { QRCodeBatch } from "@/types";
import { Search, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBaseLoqatrIdURL } from "@/lib/qrCodeConfig";

/**
 * Admin page for viewing batch details and downloading QR codes
 */
export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { batches, isLoading, fetchBatchQRCodes, markAsDownloaded, markAsPrinted } = useBatches();
  const { toast } = useToast();
  const [loqatrIds, setLoqatrIds] = useState<string[]>([]);
  const [loadingQRCodes, setLoadingQRCodes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredIds = useMemo(() => {
    if (!searchQuery.trim()) return loqatrIds;
    return loqatrIds.filter((id) =>
      id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [loqatrIds, searchQuery]);

  const handleCopyUrl = async (id: string) => {
    const url = `${getBaseLoqatrIdURL()}${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "URL copied", description: url });
    setTimeout(() => setCopiedId(null), 2000);
  };


  const batch = batches?.find((b) => b.id === Number(batchId));

  useEffect(() => {
    if (batchId) {
      setLoadingQRCodes(true);
      fetchBatchQRCodes(Number(batchId))
        .then(setLoqatrIds)
        .finally(() => setLoadingQRCodes(false));
    }
  }, [batchId, fetchBatchQRCodes]);

  const handleDownloaded = () => {
    if (batchId) {
      markAsDownloaded.mutate(Number(batchId));
    }
  };

  const handlePrinted = () => {
    if (batchId) {
      markAsPrinted.mutate(Number(batchId));
    }
  };

  const getStatusBadge = (batch: QRCodeBatch) => {
    if (batch.is_printed) {
      return <Badge variant="default">Printed</Badge>;
    }
    if (batch.is_downloaded) {
      return <Badge variant="secondary">Downloaded</Badge>;
    }
    if (batch.status === "active") {
      return <Badge variant="outline">Active</Badge>;
    }
    if (batch.status === "retired") {
      return <Badge variant="destructive">Retired</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!batch) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Batch not found</h2>
          <p className="text-muted-foreground mb-4">
            The batch you're looking for doesn't exist.
          </p>
          <Link to="/admin/batches" className="text-accent hover:underline">
            Back to batches
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton to="/admin/batches" label="Back to batches" />

        <div className="flex items-center gap-3">
          <PageHeader
            title={`Batch #${batch.id}`}
            description={batch.notes || "No notes"}
          />
          {getStatusBadge(batch)}
        </div>

        {/* Batch Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">QR Codes</dt>
                <dd className="font-medium">{loqatrIds.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{batch.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Downloaded</dt>
                <dd className="font-medium">{batch.is_downloaded ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {batch.created_at
                    ? formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* QR Code Builder */}
        {loadingQRCodes ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <QRCodeBuilder
            batch={batch}
            loqatrIds={loqatrIds}
            onDownloaded={handleDownloaded}
            onPrinted={handlePrinted}
          />
        )}

        {/* QR Code List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">QR Codes in Batch</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredIds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? "No matching QR codes found" : "No QR codes in this batch"}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filteredIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => handleCopyUrl(id)}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-xs font-mono text-center truncate transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title={`Click to copy URL for ${id}`}
                  >
                    {copiedId === id ? (
                      <Check className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{id}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

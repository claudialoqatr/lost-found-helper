import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout, QRCodeBuilder } from "@/components/admin";
import { useBatches } from "@/hooks/useBatches";
import { PageHeader, LoadingSpinner, BackButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { QRCodeBatch } from "@/types";

/**
 * Admin page for viewing batch details and downloading QR codes
 */
export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { batches, isLoading, fetchBatchQRCodes, markAsDownloaded } = useBatches();
  const [loqatrIds, setLoqatrIds] = useState<string[]>([]);
  const [loadingQRCodes, setLoadingQRCodes] = useState(true);

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

  const getStatusBadge = (batch: QRCodeBatch) => {
    if (batch.is_printed) {
      return <Badge variant="default">Printed</Badge>;
    }
    if (batch.is_downloaded) {
      return <Badge variant="secondary">Downloaded</Badge>;
    }
    if (batch.status === "ready") {
      return <Badge variant="outline">Ready</Badge>;
    }
    return <Badge variant="destructive">Pending</Badge>;
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
          />
        )}

        {/* QR Code List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Codes in Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {loqatrIds.map((id) => (
                <div
                  key={id}
                  className="px-3 py-2 bg-muted rounded text-xs font-mono text-center truncate"
                  title={id}
                >
                  {id}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

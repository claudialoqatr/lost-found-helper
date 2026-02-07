import { AdminLayout, BatchesTable, CreateBatchDialog } from "@/components/admin";
import { useBatches } from "@/hooks/useBatches";
import { PageHeader, LoadingSpinner } from "@/components/shared";

/**
 * Admin page for managing QR code batches
 */
export default function BatchesPage() {
  const { batches, isLoading, generateBatch, markAsPrinted } = useBatches();

  const handleCreateBatch = async (batchSize: number, notes?: string, retailerId?: number) => {
    await generateBatch.mutateAsync({ batchSize, notes, retailerId });
  };

  const handleMarkPrinted = (batchId: number) => {
    markAsPrinted.mutate(batchId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="QR Code Batches"
            description="Generate and manage batches of unique QR codes"
          />
          <CreateBatchDialog
            onCreateBatch={handleCreateBatch}
            isCreating={generateBatch.isPending}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <BatchesTable
            batches={batches || []}
            onMarkPrinted={handleMarkPrinted}
          />
        )}
      </div>
    </AdminLayout>
  );
}

import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import { RetailersTable } from "@/components/admin/RetailersTable";
import { RetailerFormDialog } from "@/components/admin/RetailerFormDialog";
import { PageHeader, LoadingSpinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRetailerAdmin } from "@/hooks/useRetailerAdmin";
import type { Retailer, RetailerFormData } from "@/hooks/useRetailerAdmin";

/**
 * Admin page for managing retail partners and their branding.
 */
export default function RetailersPage() {
  const {
    retailers,
    isLoading,
    createRetailer,
    updateRetailer,
    deleteRetailer,
    uploadLogo,
  } = useRetailerAdmin();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = () => {
    setEditingRetailer(null);
    setDialogOpen(true);
  };

  const handleEdit = (retailer: Retailer) => {
    setEditingRetailer(retailer);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteRetailer.mutate(id);
  };

  const handleSubmit = async (formData: RetailerFormData, logoFile?: File) => {
    setIsSubmitting(true);
    try {
      let logoUrl = formData.partner_logo_url;

      // Upload logo if a new file was selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, formData.name);
      }

      const dataWithLogo = { ...formData, partner_logo_url: logoUrl };

      if (editingRetailer) {
        await updateRetailer.mutateAsync({ ...dataWithLogo, id: editingRetailer.id });
      } else {
        await createRetailer.mutateAsync(dataWithLogo);
      }

      setDialogOpen(false);
      setEditingRetailer(null);
    } catch {
      // Error toast handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Retailers"
            description="Manage retail partners and their white-label branding"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Retailer
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <RetailersTable
            retailers={retailers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <RetailerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        retailer={editingRetailer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </AdminLayout>
  );
}

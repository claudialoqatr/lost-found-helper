import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Retailer } from "@/hooks/useRetailerAdmin";

interface RetailersTableProps {
  retailers: Retailer[];
  onEdit: (retailer: Retailer) => void;
  onDelete: (id: number) => void;
}

/**
 * Table displaying all retailers with inline actions.
 */
export function RetailersTable({ retailers, onEdit, onDelete }: RetailersTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Logo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Colors</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Website</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {retailers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No retailers yet. Add your first retail partner to get started.
              </TableCell>
            </TableRow>
          ) : (
            retailers.map((retailer) => (
              <TableRow key={retailer.id}>
                <TableCell>
                  {retailer.partner_logo_url ? (
                    <img
                      src={retailer.partner_logo_url}
                      alt={`${retailer.name} logo`}
                      className="h-8 w-12 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                      No logo
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{retailer.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {retailer.brand_color_primary && (
                      <div
                        className="h-5 w-5 rounded border"
                        style={{ backgroundColor: retailer.brand_color_primary }}
                        title={`Primary: ${retailer.brand_color_primary}`}
                      />
                    )}
                    {retailer.brand_color_accent && (
                      <div
                        className="h-5 w-5 rounded border"
                        style={{ backgroundColor: retailer.brand_color_accent }}
                        title={`Accent: ${retailer.brand_color_accent}`}
                      />
                    )}
                    {!retailer.brand_color_primary && !retailer.brand_color_accent && (
                      <span className="text-sm text-muted-foreground">Default</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {retailer.contact_name ? (
                    <div className="text-sm">
                      <p>{retailer.contact_name}</p>
                      {retailer.contact_email && (
                        <p className="text-muted-foreground text-xs truncate max-w-[160px]">
                          {retailer.contact_email}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {retailer.partner_url ? (
                    <a
                      href={retailer.partner_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline inline-flex items-center gap-1"
                    >
                      Visit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(retailer)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {retailer.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the retailer and their branding. QR codes
                            linked to this retailer will fall back to LOQATR branding.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(retailer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

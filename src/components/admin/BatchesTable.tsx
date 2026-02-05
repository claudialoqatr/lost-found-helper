import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Check } from "lucide-react";
import { QRCodeBatch } from "@/types";

interface BatchesTableProps {
  batches: QRCodeBatch[];
  onMarkPrinted: (batchId: number) => void;
}

/**
 * Table component for displaying QR code batches
 */
export function BatchesTable({ batches, onMarkPrinted }: BatchesTableProps) {
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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Batch ID</TableHead>
            <TableHead className="w-24">Total QRs</TableHead>
            <TableHead className="w-24">Assigned</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No batches yet. Create your first batch to get started.
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-mono font-medium">#{batch.id}</TableCell>
                <TableCell>{batch.qrcode_count || 0}</TableCell>
                <TableCell>{batch.assigned_count || 0}</TableCell>
                <TableCell>{getStatusBadge(batch)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {batch.notes || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {batch.created_at
                    ? formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/batches/${batch.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View batch</span>
                      </Link>
                    </Button>
                    {batch.is_downloaded && !batch.is_printed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMarkPrinted(batch.id)}
                      >
                        <Printer className="h-4 w-4" />
                        <span className="sr-only">Mark as printed</span>
                      </Button>
                    )}
                    {batch.is_printed && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
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

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

interface CreateBatchDialogProps {
  onCreateBatch: (batchSize: number, notes?: string) => Promise<void>;
  isCreating: boolean;
}

/**
 * Dialog for creating new QR code batches
 */
export function CreateBatchDialog({ onCreateBatch, isCreating }: CreateBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [batchSize, setBatchSize] = useState("10");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseInt(batchSize, 10);
    if (size > 0 && size <= 1000) {
      await onCreateBatch(size, notes || undefined);
      setOpen(false);
      setBatchSize("10");
      setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create QR Code Batch</DialogTitle>
            <DialogDescription>
              Generate a new batch of unique QR codes. Each code will have a unique ID
              in the format LOQ-{"{batch}"}-{"{code}"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batchSize">Number of QR Codes</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="1000"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 1000 codes per batch
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., For retail partner XYZ"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate {batchSize} Codes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

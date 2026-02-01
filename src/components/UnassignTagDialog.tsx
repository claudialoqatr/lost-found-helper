import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface UnassignTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  tagId?: string;
}

export function UnassignTagDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  tagId,
}: UnassignTagDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Unassign Tag?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pt-4 space-y-3">
            <p>
              Are you sure you want to unassign yourself from{" "}
              {tagId ? <span className="font-mono font-semibold">{tagId}</span> : "this tag"}?
            </p>
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
              <p className="font-medium text-destructive">This action will:</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Remove your ownership of this tag</li>
                <li>Delete all item information linked to it</li>
                <li>Clear all item details and descriptions</li>
                <li>Make the tag available for someone else to claim</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground italic">
              This action cannot be undone. The tag will need to be reclaimed and set up again.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Unassigning..." : "Yes, Unassign Tag"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

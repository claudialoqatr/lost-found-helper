import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ItemOwnerNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Dedicated input field for item owner name.
 * Shown when "This is not my item" toggle is enabled.
 * This is separate from generic item details to prevent accidental field type changes.
 */
export function ItemOwnerNameField({ value, onChange }: ItemOwnerNameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="itemOwnerName">Item Owner's Name *</Label>
      <Input
        id="itemOwnerName"
        placeholder="e.g., Sarah, My child, Buddy (pet)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-base"
      />
      <p className="text-sm text-muted-foreground">
        This name will be shown to finders instead of your account name.
      </p>
    </div>
  );
}

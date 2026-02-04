import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function DescriptionField({
  value,
  onChange,
  label = "Description",
  placeholder = "Any additional information for the finder...",
  rows = 4,
}: DescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">{label}</Label>
      <Textarea
        id="description"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="resize-none"
      />
    </div>
  );
}

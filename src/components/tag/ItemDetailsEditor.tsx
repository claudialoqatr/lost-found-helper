import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEM_DETAIL_FIELD_TYPES, type ItemDetail } from "@/types";

// Re-export ItemDetail for backward compatibility
export type { ItemDetail };

interface ItemDetailsEditorProps {
  details: ItemDetail[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "fieldType" | "value", value: string) => void;
}

export function ItemDetailsEditor({ details, onAdd, onRemove, onUpdate }: ItemDetailsEditorProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">Item Details</h3>
      <div className="space-y-3">
        {details.map((detail) => (
          <div key={detail.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={detail.fieldType} onValueChange={(v) => onUpdate(detail.id, "fieldType", v)}>
              <SelectTrigger className="w-full sm:w-[160px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_DETAIL_FIELD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Value"
                value={detail.value}
                onChange={(e) => onUpdate(detail.id, "value", e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => onRemove(detail.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add new detail
      </Button>
    </div>
  );
}

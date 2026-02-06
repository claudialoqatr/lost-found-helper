import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useItemDetailFields } from "@/hooks/useItemDetailFields";
import type { ItemDetail } from "@/types";

// Re-export ItemDetail for backward compatibility
export type { ItemDetail };

interface ItemDetailsEditorProps {
  details: ItemDetail[];
  onAdd: (defaultFieldId: number, defaultFieldType: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "field_id" | "value", value: number | string) => void;
  /** Callback to update fieldType label when field_id changes */
  onFieldChange?: (id: string, field_id: number, fieldType: string) => void;
}

export function ItemDetailsEditor({ details, onAdd, onRemove, onUpdate, onFieldChange }: ItemDetailsEditorProps) {
  const { selectableFields, defaultField, isLoading } = useItemDetailFields();

  const handleFieldIdChange = (detailId: string, newFieldIdStr: string) => {
    const newFieldId = Number(newFieldIdStr);
    const selectedField = selectableFields.find((f) => f.id === newFieldId);
    
    // Update field_id
    onUpdate(detailId, "field_id", newFieldId);
    
    // Also update the fieldType label if callback provided
    if (onFieldChange && selectedField) {
      onFieldChange(detailId, newFieldId, selectedField.type);
    }
  };

  const handleAddDetail = () => {
    if (defaultField) {
      onAdd(defaultField.id, defaultField.type);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">Item Details</h3>
      <div className="space-y-3">
        {details.map((detail) => (
          <div key={detail.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select 
              value={String(detail.field_id)} 
              onValueChange={(v) => handleFieldIdChange(detail.id, v)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full sm:w-[160px] shrink-0">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select type"} />
              </SelectTrigger>
              <SelectContent>
                {selectableFields.map((field) => (
                  <SelectItem key={field.id} value={String(field.id)}>
                    {field.type}
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
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={handleAddDetail} 
        disabled={isLoading || !defaultField}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add new detail
      </Button>
    </div>
  );
}

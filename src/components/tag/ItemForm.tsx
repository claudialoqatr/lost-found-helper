import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ItemFormProps {
  itemName: string;
  setItemName: (name: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  description: string;
  setDescription: (description: string) => void;
  isItemOwner?: boolean;
  onItemOwnerChange?: (isOwner: boolean) => void;
}

export function ItemForm({
  itemName,
  setItemName,
  isPublic,
  setIsPublic,
  description,
  setDescription,
  isItemOwner = true,
  onItemOwnerChange,
}: ItemFormProps) {
  return (
    <div className="space-y-6">
      {/* Item Name */}
      <div className="space-y-2">
        <Label htmlFor="itemName">Item Name</Label>
        <Input
          id="itemName"
          placeholder="e.g., Scooter, Laptop, Keys"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Item Ownership Toggle */}
      {onItemOwnerChange && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="itemOwner"
              checked={isItemOwner}
              onCheckedChange={onItemOwnerChange}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="itemOwner" className="cursor-pointer">
                I own this item
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Toggle off if this item belongs to someone else (e.g., your child's backpack).
                    You'll need to enter the owner's name.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {!isItemOwner && (
            <p className="text-sm text-muted-foreground pl-1">
              Please add the item owner's name in the details below.
            </p>
          )}
        </div>
      )}

      {/* Public/Private Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={!isPublic ? "font-medium" : "text-muted-foreground"}>Private</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Private mode hides your contact details. Finders can only send you a message through our
                platform.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Switch checked={isPublic} onCheckedChange={setIsPublic} />

        <div className="flex items-center gap-2">
          <span className={isPublic ? "font-medium" : "text-muted-foreground"}>Public</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Public mode shows your contact details directly to anyone who scans your QR code.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Any additional information for the finder..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );
}

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ItemNameFieldProps {
  itemName: string;
  setItemName: (name: string) => void;
  /** Optional icon picker element to render inline */
  iconPicker?: React.ReactNode;
}

export function ItemNameField({ itemName, setItemName, iconPicker }: ItemNameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="itemName">Item Name</Label>
      <div className="flex items-center gap-2">
        {iconPicker}
        <Input
          id="itemName"
          placeholder="e.g., Scooter, Laptop, Keys"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="text-base flex-1"
        />
      </div>
    </div>
  );
}

interface NotMyItemToggleProps {
  isNotMyItem: boolean;
  onNotMyItemChange: (isNotMyItem: boolean) => void;
}

export function NotMyItemToggle({ isNotMyItem, onNotMyItemChange }: NotMyItemToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Switch id="notMyItem" checked={isNotMyItem} onCheckedChange={onNotMyItemChange} />
        <div className="flex items-center gap-2">
          <Label htmlFor="notMyItem" className="cursor-pointer">
            This is not my item
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Toggle on if this item belongs to someone else (e.g., your child's backpack). You'll need to enter
                the owner's name.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {isNotMyItem && (
        <p className="text-sm text-muted-foreground pl-1">Please add the item owner's name in the details below.</p>
      )}
    </div>
  );
}

interface PrivacyToggleProps {
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
}

export function PrivacyToggle({ isPublic, setIsPublic }: PrivacyToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className={!isPublic ? "font-medium" : "text-muted-foreground"}>Private</span>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        <span className={isPublic ? "font-medium" : "text-muted-foreground"}>Public</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {isPublic
          ? "Public mode shows your contact details directly to anyone who scans your QR code."
          : "Private mode hides your contact details. Finders can only send you a message through our platform."}
      </p>
    </div>
  );
}

// Legacy component for backwards compatibility
interface ItemFormProps {
  itemName: string;
  setItemName: (name: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  isItemOwner?: boolean;
  onItemOwnerChange?: (isOwner: boolean) => void;
}

export function ItemForm({
  itemName,
  setItemName,
  isPublic,
  setIsPublic,
  isItemOwner = true,
  onItemOwnerChange,
}: ItemFormProps) {
  return (
    <div className="space-y-6">
      <ItemNameField itemName={itemName} setItemName={setItemName} />

      {onItemOwnerChange && (
        <NotMyItemToggle 
          isNotMyItem={!isItemOwner} 
          onNotMyItemChange={(notMyItem) => onItemOwnerChange(!notMyItem)} 
        />
      )}

      <PrivacyToggle isPublic={isPublic} setIsPublic={setIsPublic} />
    </div>
  );
}

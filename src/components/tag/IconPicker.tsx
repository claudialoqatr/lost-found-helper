import { useState } from "react";
import {
  Package,
  Bike,
  Car,
  Home,
  Smartphone,
  Laptop,
  Watch,
  Headphones,
  Camera,
  Key,
  Wallet,
  Briefcase,
  Backpack,
  Dog,
  Cat,
  Baby,
  Plane,
  Train,
  Gamepad2,
  Guitar,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Available icons for item selection
 */
export const ITEM_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "Package", icon: Package, label: "General" },
  { name: "Bike", icon: Bike, label: "Bike" },
  { name: "Car", icon: Car, label: "Car" },
  { name: "Home", icon: Home, label: "Home" },
  { name: "Smartphone", icon: Smartphone, label: "Phone" },
  { name: "Laptop", icon: Laptop, label: "Laptop" },
  { name: "Watch", icon: Watch, label: "Watch" },
  { name: "Headphones", icon: Headphones, label: "Headphones" },
  { name: "Camera", icon: Camera, label: "Camera" },
  { name: "Key", icon: Key, label: "Keys" },
  { name: "Wallet", icon: Wallet, label: "Wallet" },
  { name: "Briefcase", icon: Briefcase, label: "Briefcase" },
  { name: "Backpack", icon: Backpack, label: "Backpack" },
  { name: "Dog", icon: Dog, label: "Pet (Dog)" },
  { name: "Cat", icon: Cat, label: "Pet (Cat)" },
  { name: "Baby", icon: Baby, label: "Child" },
  { name: "Plane", icon: Plane, label: "Luggage" },
  { name: "Train", icon: Train, label: "Transit" },
  { name: "Gamepad2", icon: Gamepad2, label: "Gaming" },
  { name: "Guitar", icon: Guitar, label: "Instrument" },
  { name: "Umbrella", icon: Umbrella, label: "Umbrella" },
];

/**
 * Get a Lucide icon component by name
 */
export function getIconByName(name: string): LucideIcon {
  const found = ITEM_ICONS.find((i) => i.name === name);
  return found?.icon || Package;
}

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

/**
 * Icon picker component for selecting an item icon
 */
export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = getIconByName(value);
  const selectedLabel = ITEM_ICONS.find((i) => i.name === value)?.label || "General";

  return (
    <div className="space-y-2">
      <Label>Item Icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <SelectedIcon className="h-4 w-4 text-accent" />
            </div>
            <span>{selectedLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="grid grid-cols-4 gap-2">
            {ITEM_ICONS.map(({ name, icon: Icon, label }) => (
              <button
                key={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-accent/10",
                  value === name && "bg-accent/20 ring-1 ring-accent"
                )}
                title={label}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    value === name ? "bg-accent/20" : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      value === name ? "text-accent" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

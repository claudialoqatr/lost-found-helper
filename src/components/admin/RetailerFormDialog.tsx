import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import type { Retailer, RetailerFormData } from "@/hooks/useRetailerAdmin";

interface RetailerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer?: Retailer | null;
  onSubmit: (data: RetailerFormData, logoFile?: File) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Dialog form for creating or editing a retailer.
 * Supports logo upload preview and color pickers.
 */
export function RetailerFormDialog({
  open,
  onOpenChange,
  retailer,
  onSubmit,
  isSubmitting,
}: RetailerFormDialogProps) {
  const isEditing = !!retailer;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [partnerUrl, setPartnerUrl] = useState("");
  const [brandColorPrimary, setBrandColorPrimary] = useState("#3b82f6");
  const [brandColorAccent, setBrandColorAccent] = useState("#60a5fa");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Sync form state whenever the dialog opens or the retailer prop changes
  useEffect(() => {
    if (!open) return;

    if (retailer) {
      setName(retailer.name);
      setContactName(retailer.contact_name || "");
      setContactEmail(retailer.contact_email || "");
      setContactNumber(retailer.contact_number || "");
      setPartnerUrl(retailer.partner_url || "");
      setBrandColorPrimary(retailer.brand_color_primary || "#3b82f6");
      setBrandColorAccent(retailer.brand_color_accent || "#60a5fa");
      setLogoPreview(retailer.partner_logo_url || null);
    } else {
      setName("");
      setContactName("");
      setContactEmail("");
      setContactNumber("");
      setPartnerUrl("");
      setBrandColorPrimary("#3b82f6");
      setBrandColorAccent("#60a5fa");
      setLogoPreview(null);
    }
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, retailer]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["svg", "png"].includes(ext)) {
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData: RetailerFormData = {
      name: name.trim(),
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_number: contactNumber.trim() || null,
      partner_url: partnerUrl.trim() || null,
      brand_color_primary: brandColorPrimary || null,
      brand_color_accent: brandColorAccent || null,
      partner_logo_url: logoFile ? null : logoPreview, // Will be replaced after upload
    };

    await onSubmit(formData, logoFile || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Retailer" : "Add Retailer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the retailer's details and branding."
                : "Add a new retail partner with their branding details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="retailerName">Name *</Label>
              <Input
                id="retailerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Makro"
                required
                maxLength={100}
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo (SVG or PNG)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative h-16 w-32 border rounded-lg flex items-center justify-center bg-muted p-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-16 w-32"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,.png,image/svg+xml,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colorPrimary">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="colorPrimary"
                    value={brandColorPrimary}
                    onChange={(e) => setBrandColorPrimary(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={brandColorPrimary}
                    onChange={(e) => setBrandColorPrimary(e.target.value)}
                    placeholder="#3b82f6"
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colorAccent">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="colorAccent"
                    value={brandColorAccent}
                    onChange={(e) => setBrandColorAccent(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={brandColorAccent}
                    onChange={(e) => setBrandColorAccent(e.target.value)}
                    placeholder="#60a5fa"
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Gradient Preview */}
            <div className="space-y-2">
              <Label>Gradient Preview</Label>
              <div
                className="h-12 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${brandColorPrimary} 0%, ${brandColorAccent} 100%)`,
                }}
              />
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Contact Details</Label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="contactName" className="text-xs">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactEmail" className="text-xs">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@retailer.com"
                    maxLength={254}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactNumber" className="text-xs">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+27..."
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* Partner URL */}
            <div className="space-y-2">
              <Label htmlFor="partnerUrl">Website URL</Label>
              <Input
                id="partnerUrl"
                type="url"
                value={partnerUrl}
                onChange={(e) => setPartnerUrl(e.target.value)}
                placeholder="https://www.retailer.com"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Retailer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


# Enhanced Super Admin QR Code Batch Suite

## Overview

This plan upgrades the existing QR code builder with advanced styling controls, improved error correction options, higher resolution output, and better memory management for large batch generation.

## Changes Summary

### 1. Update QR Code Configuration (`src/lib/qrCodeConfig.ts`)

Add support for:
- **Error Correction Levels**: L (7%), M (15%), Q (25%), H (30%)
- **Higher Resolution**: Increase from 300px to 600px for print-ready quality
- **Liquid Design Mode**: New `extra-rounded` dot type for organic/bubbly look

```typescript
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export const qrCodeConfig = (
  data: string,
  gradient: boolean = false,
  showLogo: boolean = true,
  square: boolean = true,
  errorCorrectionLevel: ErrorCorrectionLevel = "M"
): Options => ({
  width: 600,
  height: 600,
  data,
  margin: 10,
  qrOptions: {
    errorCorrectionLevel,
  },
  dotsOptions: {
    color: gradient ? undefined : "#000000",
    type: square ? "square" : "extra-rounded",  // "extra-rounded" for liquid/bubbly look
    gradient: gradient ? { ... } : undefined,
  },
  // ... rest of config
});
```

### 2. Update QR Code Builder Component (`src/components/admin/QRCodeBuilder.tsx`)

**New Features:**
| Feature | Control Type | Description |
|---------|--------------|-------------|
| Circular Shape | Switch | Toggle between square and rounded dots with organic corners |
| Brand Gradient | Switch | Apply purple-to-blue radial gradient |
| Show Logo | Switch | Display logo in center with hidden background dots |
| Error Correction | Select dropdown | Choose L/M/Q/H levels (default: M) |
| Mark as Printed | Button | Update batch status in database |

**UI Layout:**
- Split settings into "Design" and "Technical" sections
- Add Settings2 icon for technical section header
- Include Printer button alongside Download button
- Both progress bars visible during generation

**Memory-Safe Generation:**
- Continue using iterative loop (already implemented)
- Add files directly to ZIP during generation instead of storing in array first

### 3. Update BatchDetailPage (`src/pages/admin/BatchDetailPage.tsx`)

Add `onPrinted` callback prop to pass the `markAsPrinted` mutation to QRCodeBuilder.

---

## Technical Details

### Error Correction Level Select

```typescript
<Select value={errorLevel} onValueChange={setErrorLevel}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Error Correction" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="L">Low (7%)</SelectItem>
    <SelectItem value="M">Medium (15%)</SelectItem>
    <SelectItem value="Q">Quartile (25%)</SelectItem>
    <SelectItem value="H">High (30%)</SelectItem>
  </SelectContent>
</Select>
```

### Updated Props Interface

```typescript
interface QRCodeBuilderProps {
  batch: QRCodeBatch;
  loqatrIds: string[];
  onDownloaded: () => void;
  onPrinted: () => void;  // New prop for marking as printed
}
```

### Optimized Download Function

```typescript
async function downloadBatch() {
  setIsDownloading(true);
  const zip = new JSZip();
  const generator = new QRCodeStyling(qrCodeConfig("", gradient, showLogo, square, errorLevel));

  // Iterative generation - memory safe for large batches
  for (let i = 0; i < loqatrIds.length; i++) {
    const url = `${getBaseLoqatrIdURL()}${loqatrIds[i]}?scan=true`;
    generator.update(qrCodeConfig(url, gradient, showLogo, square, errorLevel));
    
    const blob = await generator.getRawData("svg");
    if (blob) zip.file(`${loqatrIds[i]}.svg`, blob);
    
    setProgress(p => ({ ...p, generate: Math.round(((i + 1) / loqatrIds.length) * 100) }));
  }

  // Generate ZIP with progress tracking
  const content = await zip.generateAsync({ type: "blob" }, (meta) => {
    setProgress(p => ({ ...p, zip: Math.round(meta.percent) }));
  });

  // Trigger download and update database
  // ...
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/qrCodeConfig.ts` | Add ErrorCorrectionLevel type, increase resolution to 600px, add errorCorrectionLevel parameter |
| `src/components/admin/QRCodeBuilder.tsx` | Add error correction select, reorganize UI with Design/Technical sections, add Printer button, update icons |
| `src/pages/admin/BatchDetailPage.tsx` | Pass `onPrinted` callback to QRCodeBuilder |

---

## UI Preview

The settings card will be organized as:

```text
+----------------------------------+
| Style Settings                   |
+----------------------------------+
|                                  |
| DESIGN                           |
| [Switch] Circular Shape          |
|          Organic rounded corners |
|                                  |
| [Switch] Brand Gradient          |
|          Purple to blue gradient |
|                                  |
| [Switch] Show Logo               |
|          Display logo in center  |
|                                  |
| TECHNICAL                        |
| Error Correction                 |
| [Select: Low | Medium | ...]     |
|                                  |
| ================================ |
| Generating SVGs         [75%]   |
| [=============------]           |
|                                  |
| [Download Batch (50)]  [Print]  |
+----------------------------------+
```

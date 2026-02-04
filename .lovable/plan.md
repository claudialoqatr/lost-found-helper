
# Circular Shape QR Code with Transparent Background

## Overview

Update the QR code configuration to produce circular-shaped QR codes (like the reference image) with transparent backgrounds when the "Circular Shape" toggle is enabled.

## Changes Required

### 1. Update `src/lib/qrCodeConfig.ts`

**Current behavior:** The `square` parameter only controls dot styling (`type: 'square'` vs `'extra-rounded'`)

**New behavior:** The `square` parameter will also control:
- **`shape`**: Set to `'circle'` when circular mode is enabled (adds organic random dots around edges)
- **`backgroundOptions.color`**: Set to `'transparent'` when circular mode is enabled
- **`dotsOptions.type`**: Use `'rounded'` for the bubbly liquid look with circle shape

| Property | Square Mode | Circular Mode |
|----------|-------------|---------------|
| `shape` | `'square'` | `'circle'` |
| `backgroundOptions.color` | `'#FFFFFF'` | `'transparent'` |
| `dotsOptions.type` | `'square'` | `'rounded'` |
| `cornersSquareOptions.type` | `'square'` | `'extra-rounded'` |
| `cornersDotOptions.type` | `'square'` | `'dot'` |

**Updated Config:**
```typescript
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
  shape: square ? "square" : "circle",  // NEW: Circle shape for organic look
  qrOptions: {
    errorCorrectionLevel,
  },
  dotsOptions: {
    color: gradient ? undefined : "#000000",
    type: square ? "square" : "rounded",  // Changed from extra-rounded to rounded
    gradient: gradient ? { ... } : undefined,
  },
  backgroundOptions: {
    color: square ? "#FFFFFF" : "transparent",  // NEW: Transparent for circular
  },
  cornersSquareOptions: {
    type: square ? "square" : "extra-rounded",
  },
  cornersDotOptions: {
    type: square ? "square" : "dot",
  },
  // ... rest unchanged
});
```

### 2. Update `src/components/admin/QRCodeBuilder.tsx`

Update the preview container styling to show a checkered background pattern when circular mode is enabled, so users can see the transparent background effect in the preview:

```typescript
<div
  ref={previewRef}
  className={cn(
    "border rounded-lg p-4",
    square ? "bg-white" : "bg-[url('/checkered-pattern.svg')] bg-repeat"
  )}
/>
```

Alternatively, use a CSS pattern for the checkered background:
```typescript
<div
  ref={previewRef}
  className="border rounded-lg p-4"
  style={{
    background: square 
      ? '#FFFFFF' 
      : 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 20px 20px'
  }}
/>
```

### 3. Update Label Description

Update the toggle description to be more accurate:

```typescript
<Label htmlFor="square" className="flex flex-col gap-1">
  <span>Circular Shape</span>
  <span className="font-normal text-xs text-muted-foreground">
    Round shape with transparent background
  </span>
</Label>
```

---

## Technical Details

The `shape: 'circle'` option from qr-code-styling:
- Crops the QR code into a circular shape
- Adds random decorative dots around the edges for an organic appearance
- Combined with transparent background, creates the exact look shown in the reference image

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/qrCodeConfig.ts` | Add `shape` property, update `backgroundOptions.color` to be conditional, change circular dots to `'rounded'` |
| `src/components/admin/QRCodeBuilder.tsx` | Add checkered background preview for transparent mode, update label text |

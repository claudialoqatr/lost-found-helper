
# Retailer White-Labeling Implementation

Full implementation of retailer-specific branding on the Found page, including database changes, data fetching, dynamic theming with contrast-safe text, and admin panel integration.

---

## Step 1: Database Migration

Add `retailer_id` to the `qrcodes` table and update the `generate_qr_batch` function to propagate it to individual QR codes. Also add a public SELECT policy on `retailers` so unauthenticated finders can load branding data.

```sql
-- 1. Add retailer_id column to qrcodes
ALTER TABLE public.qrcodes
  ADD COLUMN retailer_id integer REFERENCES public.retailers(id);

-- 2. Public read policy on retailers (for unauthenticated finder page)
CREATE POLICY "Anyone can read retailers"
  ON public.retailers FOR SELECT
  USING (true);

-- 3. Update generate_qr_batch to set retailer_id on each QR code
CREATE OR REPLACE FUNCTION public.generate_qr_batch(
  batch_size integer,
  batch_notes text DEFAULT NULL,
  p_retailer_id integer DEFAULT NULL
)
RETURNS TABLE(batch_id integer, loqatr_ids text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_batch_id integer;
  generated_ids text[] := '{}';
  i integer;
  j integer;
  unique_id text;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  INSERT INTO qrcode_batches (
    rand_value, retailer_id, staff_id, notes, status
  ) VALUES (
    random(), p_retailer_id, get_user_id(), batch_notes, 'pending'
  ) RETURNING id INTO new_batch_id;

  FOR i IN 1..batch_size LOOP
    unique_id := '';
    FOR j IN 1..6 LOOP
      unique_id := unique_id || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;

    INSERT INTO qrcodes (loqatr_id, batch_id, status, retailer_id)
    VALUES ('LOQ-' || new_batch_id || '-' || unique_id, new_batch_id, 'unassigned', p_retailer_id);

    generated_ids := array_append(generated_ids, 'LOQ-' || new_batch_id || '-' || unique_id);
  END LOOP;

  UPDATE qrcode_batches SET status = 'active' WHERE id = new_batch_id;

  RETURN QUERY SELECT new_batch_id, generated_ids;
END;
$$;
```

---

## Step 2: Type Updates (`src/types/index.ts`)

- Add `retailer_id?: number | null` to `QRCodeData`
- Add new `RetailerBranding` interface

```typescript
export interface RetailerBranding {
  name: string;
  brand_color_primary: string | null;
  brand_color_accent: string | null;
  partner_logo_url: string | null;
  partner_url: string | null;
}
```

---

## Step 3: Contrast Utility (`src/lib/utils.ts`)

Add `getContrastColor` function that uses ITU-R BT.709 luminance formula to return either white or dark text color based on the brightness of a given hex color.

```typescript
export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.5 ? "#1C1C1C" : "#ffffff";
}
```

---

## Step 4: CSS Utility Classes (`src/index.css`)

Add two new utility classes alongside the existing `gradient-loqatr` ones:

```css
.gradient-retailer {
  background: linear-gradient(135deg,
    var(--retailer-primary, hsl(var(--midnight))) 0%,
    var(--retailer-accent, hsl(var(--egg-blue))) 100%);
  color: var(--retailer-primary-fg, white);
}

.gradient-retailer-text {
  background: linear-gradient(135deg,
    var(--retailer-primary, hsl(var(--midnight))) 0%,
    var(--retailer-accent, hsl(var(--egg-blue))) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

When no retailer CSS variables are set, these fall back to the default LOQATR colors automatically.

---

## Step 5: Data Fetching (`src/hooks/useFinderPageData.ts`)

After fetching the QR code data, resolve the retailer:

1. Check `qrData.retailer_id` (per-QR-code override)
2. If null, fall back to `qrcode_batches.retailer_id` via `qrData.batch_id`
3. Fetch retailer record from `retailers` table (name, colors, logo, url)
4. Add `retailer: RetailerBranding | null` to the return value

The fetch logic will look like:
```typescript
// Resolve retailer_id: QR-level override > batch-level
let retailerId = qrData.retailer_id || null;
if (!retailerId && qrData.batch_id) {
  const { data: batchData } = await supabase
    .from("qrcode_batches")
    .select("retailer_id")
    .eq("id", qrData.batch_id)
    .maybeSingle();
  retailerId = batchData?.retailer_id || null;
}

if (retailerId) {
  const { data: retailerData } = await supabase
    .from("retailers")
    .select("name, brand_color_primary, brand_color_accent, partner_logo_url, partner_url")
    .eq("id", retailerId)
    .maybeSingle();
  if (retailerData) setRetailer(retailerData);
}
```

---

## Step 6: FinderPage.tsx -- Dynamic Theming

- Extract `retailer` from the hook
- Compute CSS custom properties using `getContrastColor`:

```typescript
const retailerStyle = retailer?.brand_color_primary ? {
  '--retailer-primary': retailer.brand_color_primary,
  '--retailer-accent': retailer.brand_color_accent || retailer.brand_color_primary,
  '--retailer-primary-fg': getContrastColor(retailer.brand_color_primary),
  '--retailer-accent-fg': retailer.brand_color_accent
    ? getContrastColor(retailer.brand_color_accent)
    : getContrastColor(retailer.brand_color_primary),
} as React.CSSProperties : {};
```

- Apply `style={retailerStyle}` to the page wrapper div
- Replace `gradient-loqatr` with `gradient-retailer` on the background blob
- Replace `gradient-loqatr-text` with `gradient-retailer-text` on the hero heading
- Pass `retailerLogoUrl` to `FinderHeader`

---

## Step 7: FinderHeader.tsx -- Retailer Logo

- Accept optional `retailerLogoUrl?: string | null` prop
- If provided, display the retailer logo instead of the LOQATR logo
- Otherwise, keep the existing light/dark LOQATR logo behavior

---

## Step 8: ContactRevealGate.tsx and PrivateMessageForm.tsx -- Branded Buttons

Replace `gradient-loqatr text-primary-foreground` with `gradient-retailer` on the primary action buttons. The `color` property in the CSS class handles foreground contrast automatically.

---

## Step 9: Admin Panel -- Retailer Selection

### CreateBatchDialog.tsx
- Add a searchable retailer dropdown (fetched from `retailers` table via a simple query)
- Update the `onCreateBatch` callback signature to include optional `retailerId`
- Pass the selected retailer through on submit

### BatchesPage.tsx
- Update `handleCreateBatch` to accept and forward `retailerId`

### useBatches.ts
- Update the `generateBatch` mutation to accept `retailerId` and pass it as `p_retailer_id` to the RPC (currently hardcoded to `null`)

### BatchesTable.tsx
- Add a "Retailer" column displaying the retailer name
- Fetch retailer names alongside batch data (join via `retailer_id`)

---

## Files Changed Summary

| File | Change |
|---|---|
| New migration SQL | Add `retailer_id` to `qrcodes`, update `generate_qr_batch`, add public RLS on `retailers` |
| `src/types/index.ts` | Add `RetailerBranding` interface, add `retailer_id` to `QRCodeData` |
| `src/lib/utils.ts` | Add `getContrastColor` utility |
| `src/index.css` | Add `.gradient-retailer` and `.gradient-retailer-text` utilities |
| `src/hooks/useFinderPageData.ts` | Fetch and return retailer branding data with fallback logic |
| `src/pages/FinderPage.tsx` | Apply dynamic CSS variables, use retailer gradient classes, pass logo to header |
| `src/components/finder/FinderHeader.tsx` | Accept and render optional retailer logo |
| `src/components/finder/ContactRevealGate.tsx` | Replace `gradient-loqatr` with `gradient-retailer` |
| `src/components/finder/PrivateMessageForm.tsx` | Replace `gradient-loqatr` with `gradient-retailer` |
| `src/components/admin/CreateBatchDialog.tsx` | Add retailer dropdown |
| `src/pages/admin/BatchesPage.tsx` | Forward retailer ID |
| `src/hooks/useBatches.ts` | Accept retailer ID in mutation |
| `src/components/admin/BatchesTable.tsx` | Display retailer name column |

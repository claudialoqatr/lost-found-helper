

# Super Admin QR Code Batch Generation System

## Overview

This plan implements a complete QR code batch generation system for Super Admins. The feature allows admins to create batches of unique QR codes in the format `LOQ-{batchID}-{qrID}`, store them in the database, preview/download them as SVG files, and manage all batches through a dedicated admin dashboard.

## Architecture

```text
+-------------------+     +--------------------+     +------------------+
|  Admin Dashboard  | --> | Generate Batch API | --> | qrcode_batches   |
|  /admin/batches   |     | (Edge Function)    |     | qrcodes tables   |
+-------------------+     +--------------------+     +------------------+
         |                                                    |
         v                                                    v
+-------------------+     +--------------------+     +------------------+
| Batch Details     | --> | QR Code Builder    | --> | Download as ZIP  |
| /admin/batches/:id|     | (Client-side gen)  |     | (JSZip + SVG)    |
+-------------------+     +--------------------+     +------------------+
```

## Implementation Tasks

### 1. Database Changes

**New RLS Policies for Super Admin Access**

Add policies to allow Super Admins to insert into `qrcode_batches` and `qrcodes` tables:

- `qrcode_batches`: Super Admins can INSERT, UPDATE, and SELECT all batches
- `qrcodes`: Super Admins can INSERT new QR codes

**New Database Function**

Create a secure function `generate_qr_batch(batch_size integer, notes text)` that:
- Creates a new batch record in `qrcode_batches`
- Generates unique 6-character alphanumeric IDs for each QR code
- Inserts QR codes with format `LOQ-{batch_id}-{unique_id}`
- Returns the batch ID and generated `loqatr_id` values

### 2. New Dependencies

Install the following npm packages:
- `qr-code-styling`: For generating styled QR code SVGs with logo support
- `jszip`: For bundling multiple QR codes into a downloadable ZIP file

### 3. New Files to Create

**Admin Pages**

| File | Description |
|------|-------------|
| `src/pages/admin/BatchesPage.tsx` | Lists all QR code batches in a table with status, counts, and actions |
| `src/pages/admin/BatchDetailPage.tsx` | Shows batch details and QR code builder with download functionality |

**Admin Components**

| File | Description |
|------|-------------|
| `src/components/admin/AdminLayout.tsx` | Layout wrapper with admin navigation (extends AppLayout) |
| `src/components/admin/BatchesTable.tsx` | Table component for displaying batches |
| `src/components/admin/QRCodeBuilder.tsx` | QR code preview and batch download component |
| `src/components/admin/CreateBatchDialog.tsx` | Dialog for creating new batches with quantity input |

**Hooks**

| File | Description |
|------|-------------|
| `src/hooks/useBatches.ts` | Hook for fetching and managing batches |

**Types**

Add to `src/types/index.ts`:
```typescript
export interface QRCodeBatch {
  id: number;
  rand_value: number;
  retailer_id: number | null;
  staff_id: number | null;
  notes: string | null;
  status: string;
  is_downloaded: boolean;
  is_printed: boolean;
  created_at: string | null;
  updated_at: string | null;
}
```

**Edge Function**

| File | Description |
|------|-------------|
| `supabase/functions/generate-batch/index.ts` | Secure endpoint for batch generation with admin validation |

### 4. Routing Updates

Update `src/App.tsx` to add admin routes:
```typescript
<Route path="/admin/batches" element={<BatchesPage />} />
<Route path="/admin/batches/:batchId" element={<BatchDetailPage />} />
```

### 5. Navigation Updates

Update `src/components/AppLayout.tsx` to conditionally show admin navigation items when `isSuperAdmin` is true.

---

## Technical Details

### QR Code ID Generation

Each QR code will have a unique identifier following the format:
- **Format**: `LOQ-{batchID}-{uniqueID}`
- **Example**: `LOQ-76-kf2r4f`
- **uniqueID**: 6 lowercase alphanumeric characters generated using `crypto.getRandomValues()`

### Database Function: generate_qr_batch

```sql
CREATE OR REPLACE FUNCTION generate_qr_batch(
  batch_size integer,
  batch_notes text DEFAULT NULL,
  p_retailer_id integer DEFAULT NULL
)
RETURNS TABLE(batch_id integer, loqatr_ids text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_batch_id integer;
  generated_ids text[] := '{}';
  i integer;
  unique_id text;
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  -- Verify caller is super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  -- Create batch record
  INSERT INTO qrcode_batches (
    rand_value, retailer_id, staff_id, notes, status
  ) VALUES (
    random(), p_retailer_id, get_user_id(), batch_notes, 'pending'
  ) RETURNING id INTO new_batch_id;

  -- Generate QR codes
  FOR i IN 1..batch_size LOOP
    -- Generate 6-char unique ID
    unique_id := '';
    FOR j IN 1..6 LOOP
      unique_id := unique_id || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    
    -- Insert QR code
    INSERT INTO qrcodes (loqatr_id, batch_id, status)
    VALUES ('LOQ-' || new_batch_id || '-' || unique_id, new_batch_id, 'unassigned');
    
    generated_ids := array_append(generated_ids, 'LOQ-' || new_batch_id || '-' || unique_id);
  END LOOP;

  -- Update batch status
  UPDATE qrcode_batches SET status = 'ready' WHERE id = new_batch_id;

  RETURN QUERY SELECT new_batch_id, generated_ids;
END;
$$;
```

### QR Code Builder Component

The QR Code Builder will:
1. Display a live preview of a sample QR code
2. Allow toggling styling options (gradient, logo, shape)
3. Generate all QR codes as SVGs on download
4. Bundle into a ZIP file named `batch-{id}.zip`
5. Track download and print status in the database

### Batches Table Features

The batches table will display:
- Batch ID
- QR Code count
- Status (pending, ready, downloaded, printed)
- Created date
- Staff who created it
- Notes
- Action buttons (View, Download)

### Security Considerations

1. **Server-side validation**: The `generate_qr_batch` function checks `is_super_admin()` before proceeding
2. **RLS policies**: Only Super Admins can insert/update batch and QR code records
3. **Frontend protection**: Admin routes check `useSuperAdmin()` and redirect unauthorized users
4. **Unique constraint**: Database ensures `loqatr_id` uniqueness to prevent duplicates

### QR Code Styling Configuration

```typescript
export const qrCodeConfig = (
  data: string,
  gradient: boolean = false,
  showLogo: boolean = true,
  square: boolean = true
) => ({
  width: 300,
  height: 300,
  data,
  margin: 10,
  dotsOptions: {
    color: gradient ? undefined : "#000000",
    type: square ? "square" : "rounded",
    gradient: gradient ? {
      type: "radial",
      colorStops: [
        { offset: 0, color: "#8B5CF6" },
        { offset: 1, color: "#0EA5E9" }
      ]
    } : undefined
  },
  backgroundOptions: {
    color: "#FFFFFF"
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 5
  },
  image: showLogo ? "/logo-icon.png" : undefined,
  cornersSquareOptions: {
    type: square ? "square" : "extra-rounded"
  },
  cornersDotOptions: {
    type: square ? "square" : "dot"
  }
});
```

---

## User Flow

1. **Access Admin Dashboard**: Super Admin navigates to `/admin/batches`
2. **Create New Batch**: Clicks "Create Batch" button, enters quantity and optional notes
3. **Batch Generation**: System generates unique QR codes and stores them in database
4. **View Batch**: Admin clicks on a batch to see all QR codes
5. **Configure Style**: Admin can toggle gradient, logo, and shape options
6. **Download**: Admin downloads all QR codes as a ZIP file of SVGs
7. **Track Status**: System marks batch as downloaded; admin can mark as printed


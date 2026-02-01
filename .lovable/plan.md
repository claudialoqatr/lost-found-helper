

# Fix Public QR Code Owner Contact Display

## Overview
Enable the Finder Page to display owner contact details (name, phone, email) when scanning a **public** QR code, while keeping owner info hidden for private QR codes.

## Changes Required

### 1. Database Migration - RLS Policy Update

Add a new Row Level Security policy to the `users` table that allows anyone to read user info when that user owns a public QR code:

```sql
CREATE POLICY "Anyone can read user info for public qrcode owners"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM qrcodes 
    WHERE qrcodes.assigned_to = users.id 
    AND qrcodes.is_public = true
  )
);
```

### 2. Update FinderPage.tsx - Conditional Owner Fetching

Modify the data fetching logic to only query owner details when the scanned QR code is public:

- Wrap the owner fetch in a condition: `if (qrData.is_public)`
- For private QR codes, skip the owner fetch entirely (owner remains null)
- This ensures the contact cards only render for public QR codes

## Expected Results

| Scenario | What Happens |
|----------|--------------|
| Scan public QR | Shows owner's name + Call/WhatsApp/Email buttons |
| Scan private QR | Shows anonymous "Send a Secure Message" form |
| Owner scans own QR | Redirects to edit page at `/tag/{code}` |

## Files Modified
1. New SQL migration for RLS policy
2. `src/pages/FinderPage.tsx` - conditional owner fetching




# Fix Webhook Secret Decoding Error

## Problem Identified

The `send-email` edge function is failing with a **500 error** because the webhook signature verification is failing with:

> "Base64Coder: incorrect characters for decoding"

**Root Cause**: The `standardwebhooks` library expects only the base64 secret portion, but the code is passing the full Supabase webhook secret format (`v1,whsec_...`).

## Solution

Update the edge function to extract only the base64 secret from the Supabase webhook secret format before passing it to the `Webhook` class.

## Changes Required

### 1. Update `supabase/functions/send-email/index.ts`

Add logic to parse the webhook secret and extract the correct portion:

```text
Before (line 71):
const wh = new Webhook(SEND_EMAIL_HOOK_SECRET);

After:
// Supabase webhook secrets are in format: v1,whsec_<base64secret>
// The standardwebhooks library only needs the base64 secret part
let webhookSecret = SEND_EMAIL_HOOK_SECRET;
if (webhookSecret.includes("whsec_")) {
  // Extract just the base64 part after "whsec_"
  webhookSecret = webhookSecret.split("whsec_")[1];
}
const wh = new Webhook(webhookSecret);
```

This extracts `OBlQ1fmYhfPHHYvUb/K1FQDR7LZlmF9ryrq8UaOFY1G+uPiryt485jaZpXnDDiAtwnT2YKKAw4sD800i` from the full secret string.

## Technical Details

- The Supabase dashboard provides secrets in format: `v1,whsec_<base64>`
- The `v1` indicates the signature version
- The `whsec_` is a prefix identifier
- Only the base64 portion after `whsec_` should be passed to the webhook verification library

## Testing

After the fix is deployed, test the forgot password flow again to verify:
1. Click "Forgot password?" on the login page
2. Enter an email address
3. The password reset email should be sent successfully


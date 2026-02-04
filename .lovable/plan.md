

# Admin User Re-verification System

## Overview

Create an admin-only page and edge function that allows super admins to send re-verification emails to migrated users one at a time. Each user will receive a branded email with a Supabase-generated invite link to set up their account properly.

---

## What Gets Built

### 1. New Admin Page: User Management

A new admin page at `/admin/users` where super admins can:
- View all migrated users (those who have never signed in)
- See each user's email and verification status
- Click a button to send a re-verification email to individual users
- See success/error feedback after sending

### 2. Edge Function: reverify-user

A secure edge function that:
- Accepts a single email address
- Generates a legitimate Supabase invite link
- Sends a branded email via Resend
- Returns success/error response

### 3. Email Template: Account Migration

A new email template explaining:
- Their account has been migrated to the new system
- They need to click the link to set up their account
- Styled consistently with existing LOQATR emails

---

## User Flow

```text
Admin Dashboard                    Edge Function                 User
      |                                  |                         |
      |  Click "Send Invite"             |                         |
      |--------------------------------->|                         |
      |                                  |                         |
      |              Generate Supabase   |                         |
      |              invite link         |                         |
      |                                  |                         |
      |              Send email via      |                         |
      |              Resend              |                         |
      |                                  |------------------------>|
      |                                  |     "Set Up Account"    |
      |  Success message                 |         email           |
      |<---------------------------------|                         |
      |                                  |                         |
      |                                  |   User clicks link      |
      |                                  |<------------------------|
      |                                  |                         |
      |                                  |   Supabase handles      |
      |                                  |   verification +        |
      |                                  |   password setup        |
      |                                  |                         |
      |                                  |   User redirected       |
      |                                  |   to app, logged in     |
      |                                  |------------------------>|
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/UsersPage.tsx` | Admin page showing migrated users with invite buttons |
| `src/components/admin/UsersTable.tsx` | Table component displaying users and their status |
| `src/components/admin/InviteUserDialog.tsx` | Confirmation dialog before sending invite |
| `src/hooks/useMigratedUsers.ts` | Hook to fetch migrated users from auth.users |
| `src/hooks/useReverifyUser.ts` | Hook to call the reverify-user edge function |
| `supabase/functions/reverify-user/index.ts` | Edge function to generate link and send email |
| `supabase/functions/send-email/_templates/reverify.ts` | Email template for account migration |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route for `/admin/users` |
| `src/components/admin/AdminLayout.tsx` | Add "Users" nav item |
| `src/components/admin/index.ts` | Export new components |
| `supabase/config.toml` | Register reverify-user function |

---

## Technical Details

### Edge Function Security

The function requires an `x-admin-secret` header matching a new secret `REVERIFY_ADMIN_SECRET`. This prevents unauthorized access while allowing admin-triggered requests.

### Database Query for Migrated Users

```sql
SELECT id, email, email_confirmed_at, last_sign_in_at, created_at
FROM auth.users
WHERE last_sign_in_at IS NULL
ORDER BY created_at DESC
```

This query runs via the Supabase Admin API in the edge function (service role access required).

### Invite Link Generation

```typescript
const { data, error } = await supabase.auth.admin.generateLink({
  type: "invite",
  email: userEmail,
  options: {
    redirectTo: `${siteUrl}/auth`
  }
});
// data.properties.action_link contains the invite URL
```

### Email Content

The re-verification email will include:
- LOQATR branding header
- Explanation that their account was migrated
- "Set Up Your Account" button with the Supabase invite link
- Note that they'll need to create a new password
- Standard footer

---

## Admin UI Design

The Users page will display a table with:

| Column | Description |
|--------|-------------|
| Email | User's email address |
| Status | "Pending" (never verified) or "Needs Password" (verified but never signed in) |
| Created | Account creation date |
| Action | "Send Invite" button |

After clicking "Send Invite":
1. Confirmation dialog appears
2. On confirm, edge function is called
3. Success toast: "Invitation sent to user@example.com"
4. Button changes to "Sent" (disabled) temporarily

---

## Required Secret

Before implementation, you'll need to add the `REVERIFY_ADMIN_SECRET` secret. This will be used to authenticate admin requests to the edge function.

---

## Post-Implementation

Once deployed:
1. Navigate to `/admin/users` as a super admin
2. See the list of 60 migrated users
3. Click "Send Invite" for any user
4. User receives email and can set up their account
5. After setup, user can log in normally


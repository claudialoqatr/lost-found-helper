

# My Profile Page

## Overview
Add a dedicated profile management page where authenticated users can view and update their personal information (name, phone, email), with secure email change verification via the existing Supabase Auth and email infrastructure.

## What will be built

**A new `/profile` page** accessible from the main navigation, allowing users to:
- View their current name, phone number, and email
- Edit their name and phone number with instant database updates
- Request an email change, which triggers a verification email to the new address
- See a "pending verification" notice after requesting an email change

---

## Navigation changes

**AppLayout.tsx (header):**
- Add a "My Profile" link with a `User` icon to the desktop nav bar and mobile sheet menu, positioned after "Messages"
- Make the greeting text ("Hey, [name]!") clickable, linking to `/profile`

**App.tsx (routing):**
- Register `/profile` route pointing to the new `ProfilePage`

---

## Profile page design

The page will use the existing `AppLayout` wrapper and follow the same card-based layout pattern used elsewhere (e.g., EditTagPage). It will contain:

1. **Page header** -- "My Profile" title with a back button
2. **Profile info card** -- Three editable fields in a form:
   - **Name** -- standard text input with the same validation as signup (2-100 chars, letters/spaces/hyphens/apostrophes)
   - **Phone** -- reuses the existing `PhoneInput` component with the same validation rules
   - **Email** -- text input; changes trigger `supabase.auth.updateUser({ email: newEmail })` and show a pending verification toast
3. **Save button** -- gradient-styled, only enabled when changes are detected
4. **Loading state** -- uses existing `LoadingSpinner` while profile data loads

---

## Technical details

### New files
- `src/pages/ProfilePage.tsx` -- the profile page component

### Modified files
- `src/App.tsx` -- add `/profile` route
- `src/components/AppLayout.tsx` -- add "My Profile" nav item + clickable greeting

### Data flow

```text
useUserProfile() --> fetch name, email, phone from public.users
                     (already cached via TanStack Query)

Save name/phone --> supabase.from("users").update({ name, phone })
                    .eq("auth_id", user.id)
                 --> useInvalidateUserProfile() to refresh cache

Change email   --> supabase.auth.updateUser({ email: newEmail })
                --> Triggers Supabase Auth Hook --> send-email Edge Function
                --> email_change template sent to new address
                --> On verification, Supabase updates auth.users.email
                --> handle_new_auth_user trigger syncs to public.users
```

### Validation (Zod schema)
- **Name**: 2-100 characters, letters/spaces/hyphens/apostrophes only (matches signup schema)
- **Phone**: 10-20 characters, valid international format (matches signup schema)
- **Email**: max 254 characters, valid email format (matches signup schema)

### RLS coverage
The existing RLS policy on `public.users` already restricts updates to rows where `auth_id = auth.uid()`, so no database migration is needed.

### Email change flow
The existing `send-email` Edge Function already handles the `email_change` action type, routing it to the `email-change.ts` template. The `handle_new_auth_user` database trigger syncs `auth.users.email` changes back to `public.users`. After requesting an email change, a toast will inform the user to check their new inbox. The email field will show the current email as read-only with a "pending" badge until confirmed.

### Auth guard
The page will redirect unauthenticated users to `/auth` using the same pattern as `MyTagsPage` (check `user` from `useAuth`, redirect if not present).




# Fix: Phone Display + Email Pending Effect Coordination

## Problem Summary

There are two issues in `ProfilePage.tsx`:

1. **Phone number still blank**: The `formInitialized` guard from the previously approved plan was never applied. The `PhoneInput` component only reads its `value` prop once during initialization (`useState` initializer). Because the form renders before the `useEffect` populates the `phone` state, `PhoneInput` mounts with an empty string and never updates.

2. **Email pending detection can conflict**: The `useEffect` on line 64-69 that detects `user?.new_email` runs independently of the form data population effect. If `user` resolves before `userProfile`, it could set `emailPending` before the form is even initialized, which is harmless now but fragile.

## Changes

### `src/pages/ProfilePage.tsx`

**A. Add `formInitialized` state flag**

Add a new state variable:
```typescript
const [formInitialized, setFormInitialized] = useState(false);
```

**B. Consolidate the form population and email pending effects into one**

Replace the two separate effects (lines 55-69) with a single coordinated effect:

```typescript
// Populate form and detect pending email -- runs once when both data sources are ready
useEffect(() => {
  if (userProfile && !formInitialized) {
    console.log("Profile data fetched:", userProfile);
    console.log("Setting phone state to:", userProfile.phone);
    setName(userProfile.name || "");
    setPhone(userProfile.phone || "");
    setEmail(userProfile.email || "");
    setFormInitialized(true);
  }
}, [userProfile, formInitialized]);

// Detect pending email change -- only after form is initialized
useEffect(() => {
  if (formInitialized && user?.new_email) {
    setEmailPending(true);
  }
}, [user, formInitialized]);
```

This ensures:
- The form fields are populated before anything else happens
- The `formInitialized` flag prevents re-running on subsequent `userProfile` updates (e.g., after saving)
- The email pending check waits for the form to be ready, so it doesn't conflict with the initial data load

**C. Guard PhoneInput rendering**

Replace the current PhoneInput block (lines 228-234) with a conditional render that only shows PhoneInput after the form state has been initialized:

```tsx
{formInitialized ? (
  <PhoneInput
    key={phone || "empty"}
    value={phone}
    onChange={setPhone}
    placeholder="Phone number"
    maxLength={20}
  />
) : (
  <Input disabled placeholder="Loading..." />
)}
```

This is the critical fix: it prevents `PhoneInput` from mounting with an empty `value` prop. Once `formInitialized` flips to `true`, React mounts a fresh `PhoneInput` that receives the correct phone number (e.g., `"+27726244915"`) on its very first render, allowing `parseInitialValue` to correctly split the country code and local number.

**D. No changes to handleSave**

The save logic is already correct:
- Phone is written only to `public.users` via `.update({ name, phone })`
- `supabase.auth.updateUser` only syncs `data: { name }` -- no phone in auth
- Email changes go through `supabase.auth.updateUser({ email })` for proper verification

### No other files changed

The `PhoneInput` component, `useUserProfile` hook, and database/RLS configuration all remain unchanged.

## Summary of effects after the fix

| Effect | Depends on | Purpose |
|--------|-----------|---------|
| Auth guard | `user`, `authLoading` | Redirect to /auth if not logged in |
| Form population | `userProfile`, `formInitialized` | One-time init of name/phone/email state |
| Email pending detection | `user`, `formInitialized` | Show "pending" badge only after form is ready |



# Remove Unused Turnstile Site Key

## Summary
Remove the redundant `TURNSTILE_SITE_KEY` secret from Supabase and fix `AuthPage.tsx` to use the environment variable instead of a hardcoded key.

## Changes

### 1. Delete Supabase Secret
Remove `TURNSTILE_SITE_KEY` from Supabase secrets - this is the one **without** the `VITE_` prefix. It's not used anywhere in the code (only `VITE_TURNSTILE_SITE_KEY` is used).

### 2. Fix AuthPage.tsx (Line 22)
**Current (hardcoded):**
```typescript
const TURNSTILE_SITE_KEY = "0x4AAAAAACXfjBOjTCebi7m3";
```

**Updated (use environment variable):**
```typescript
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAABDpqobG9QdvKn-D";
```

This matches the pattern already used in `ContactRevealGate.tsx` and ensures consistency.

## Final State
| Secret | Status |
|--------|--------|
| `VITE_TURNSTILE_SITE_KEY` | Keep - used by frontend |
| `TURNSTILE_SECRET_KEY` | Keep - used by edge functions |
| `TURNSTILE_SITE_KEY` | Delete - unused |

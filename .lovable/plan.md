

# Testing Strategy Implementation Plan

## Overview

This plan establishes a comprehensive test suite for your LOQATR application, covering critical user flows, business logic, and edge functions. The goal is to move from zero coverage to meaningful protection against regressions.

## Testing Priorities

Based on your codebase, I've identified four testing tiers:

| Priority | Area | Risk Level | Approach |
|----------|------|------------|----------|
| 1 | Pure utility functions | Low complexity | Unit tests (easy wins) |
| 2 | Business logic hooks | Medium | Unit tests with mocks |
| 3 | Page routing logic | High risk | Integration tests |
| 4 | Edge functions | Critical | Deno tests |

---

## Phase 1: Unit Tests for Utilities (Quick Wins)

These are pure functions with no external dependencies - easiest to test.

### 1.1 Password Strength Validation
**File**: `src/lib/__tests__/passwordStrength.test.ts`

Tests for the `isPasswordStrong` function:
- Rejects passwords under 8 characters
- Requires uppercase, lowercase, number, special character
- Returns true only when all requirements met

### 1.2 Utility Functions  
**File**: `src/lib/__tests__/utils.test.ts`

Tests for the `cn()` class merging utility:
- Merges multiple class names
- Handles conditional classes
- Properly deduplicates Tailwind classes

### 1.3 QR Code Configuration
**File**: `src/lib/__tests__/qrCodeConfig.test.ts`

Tests for `qrCodeConfig` and `getBaseLoqatrIdURL`:
- Default configuration values
- Gradient vs solid color modes
- Square vs rounded styles
- Error correction level settings

---

## Phase 2: Component Unit Tests

### 2.1 PasswordStrengthIndicator Component
**File**: `src/components/__tests__/PasswordStrengthIndicator.test.tsx`

- Renders nothing for empty password
- Shows "Very weak" for single character
- Shows "Strong" when all requirements pass
- Displays checkmarks for passed requirements

### 2.2 Form Validation Schema Tests
**File**: `src/pages/__tests__/authSchemas.test.ts`

Test the Zod schemas used in AuthPage:
- Login schema validation (email format, password length)
- Signup schema validation (all required fields)
- Password confirmation matching
- Phone number format validation

---

## Phase 3: Routing Logic Tests (High Priority)

### 3.1 QR Scan Router Logic
**File**: `src/pages/__tests__/QRScanRouter.test.tsx`

This is critical business logic that determines where users go:

```text
Test Cases:
+-----------------------+---------------------------+
| QR Code State         | Expected Redirect         |
+-----------------------+---------------------------+
| Doesn't exist         | Error message displayed   |
| Unclaimed (no owner)  | /tag/:code (claim page)   |
| Claimed, user=owner   | /my-tags/:code (edit)     |
| Claimed, user≠owner   | /found/:code (finder)     |
| Claimed, user=anon    | /found/:code (finder)     |
+-----------------------+---------------------------+
```

Requires mocking:
- Supabase client responses
- React Router navigation
- useAuth hook

### 3.2 Auth Page Redirect Logic
**File**: `src/pages/__tests__/AuthPage.test.tsx`

- Redirects authenticated users to home
- Respects `redirect_after_auth` session storage
- Mode switching (login/signup/forgot-password)

---

## Phase 4: Hook Tests with Mocks

### 4.1 useAuth Hook
**File**: `src/hooks/__tests__/useAuth.test.tsx`

Tests for authentication context:
- Throws error when used outside provider
- Initial loading state is true
- Updates user/session on auth state change
- signUp/signIn/signOut call correct Supabase methods

### 4.2 useMyTags Hook  
**File**: `src/hooks/__tests__/useMyTags.test.tsx`

- Returns empty array when no profile
- Fetches tags with scan data in single queries
- unassignTag mutation updates cache correctly
- Handles errors gracefully

---

## Phase 5: Edge Function Tests (Deno)

### 5.1 submit-finder-message Tests
**File**: `supabase/functions/submit-finder-message/index.test.ts`

```text
Test Cases:
+--------------------------------+------------------+
| Input                          | Expected Result  |
+--------------------------------+------------------+
| Missing name                   | 400 Bad Request  |
| Missing email AND phone        | 400 Bad Request  |
| Valid data                     | 200 + loqatr_id  |
| CORS preflight                 | 200 "ok"         |
+--------------------------------+------------------+
```

### 5.2 reveal-contact Tests
**File**: `supabase/functions/reveal-contact/index.test.ts`

- Rejects missing required fields
- Verifies Turnstile token
- Returns 429 on rate limit
- Returns contact data on success

---

## Implementation Details

### Test File Organization

```text
src/
├── test/
│   ├── setup.ts              (existing)
│   ├── example.test.ts       (to be removed)
│   └── mocks/
│       ├── supabase.ts       (Supabase client mock)
│       └── router.ts         (React Router mock)
├── lib/
│   └── __tests__/
│       ├── utils.test.ts
│       ├── passwordStrength.test.ts
│       └── qrCodeConfig.test.ts
├── components/
│   └── __tests__/
│       └── PasswordStrengthIndicator.test.tsx
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.tsx
│       └── useMyTags.test.tsx
└── pages/
    └── __tests__/
        ├── authSchemas.test.ts
        └── QRScanRouter.test.tsx

supabase/functions/
├── submit-finder-message/
│   ├── index.ts
│   └── index.test.ts
└── reveal-contact/
    ├── index.ts  
    └── index.test.ts
```

### Mock Setup Requirements

**Supabase Mock** (`src/test/mocks/supabase.ts`):
- Mock `supabase.auth` methods
- Mock `supabase.from()` query builder with chainable methods
- Mock `supabase.functions.invoke()`

**Router Mock** (`src/test/mocks/router.ts`):
- Mock `useNavigate`, `useParams`, `useSearchParams`
- Track navigation calls for assertions

### Test Helpers

**Wrapper Component** for hooks that need providers:
```typescript
// Creates wrapper with QueryClient, AuthProvider, Router
function createTestWrapper() { ... }
```

---

## Technical Considerations

### Mocking Strategy

The tests will use Vitest's mocking capabilities:
- `vi.mock()` for module mocks
- `vi.spyOn()` for tracking calls
- `vi.fn()` for mock implementations

### Async Testing

Many operations are async (Supabase calls, navigation):
- Use `waitFor` from Testing Library
- Use `act()` for state updates
- Handle promise rejections in tests

### Test Isolation

Each test will:
- Reset mocks with `beforeEach`
- Clear query cache between tests
- Restore all mocks with `afterEach`

---

## Estimated Test Count

| Category | Files | Tests |
|----------|-------|-------|
| Utility functions | 3 | ~15 |
| Components | 1 | ~6 |
| Auth schemas | 1 | ~8 |
| Routing logic | 2 | ~10 |
| Hooks | 2 | ~12 |
| Edge functions | 2 | ~10 |
| **Total** | **11** | **~61** |

---

## Implementation Progress

### ✅ Completed

- [x] **Phase 1.1**: Password strength validation tests (12 tests)
- [x] **Phase 1.2**: Utils `cn()` tests (19 tests)  
- [x] **Phase 1.3**: QR code configuration tests (25 tests)
- [x] **Phase 3.1**: QRScanRouter routing logic tests (10 tests)
- [x] Test mocks infrastructure (Supabase, Router)
- [x] Removed placeholder `example.test.ts`

**Total: 66 tests passing**

### 🔲 Remaining

- [ ] Phase 2: Component tests (PasswordStrengthIndicator, Auth schemas)
- [ ] Phase 3.2: AuthPage redirect logic tests
- [ ] Phase 4: Hook tests (useAuth, useMyTags)
- [ ] Phase 5: Edge function tests (Deno)

---

## Notes

- Tests focus on business logic and user flows, not UI styling
- Edge function tests use Deno's built-in test runner
- Frontend tests run via `npm test` or `vitest`



# FinderPage Refactoring Plan

## Overview

This plan refactors the 500+ line `FinderPage.tsx` into smaller, focused modules following the existing codebase patterns. The goal is to improve maintainability, testability, and code reuse without changing any functionality.

## Architecture

```text
Before (monolithic):
+------------------------------------------+
|              FinderPage.tsx              |
|  - Location tracking logic               |
|  - Data fetching (QR, item, owner name)  |
|  - Owner notification logic              |
|  - Message form state + submission       |
|  - Display name calculation              |
|  - All JSX rendering (~220 lines)        |
+------------------------------------------+

After (modular):
+------------------------------------------+
|              FinderPage.tsx (~150 lines) |
|  - Orchestration + routing logic         |
|  - Minimal state (revealedContact)       |
|  - Composition of child components       |
+------------------------------------------+
            |
            v
+-------------------+  +------------------------+
| useLocationData   |  | useFinderPageData      |
| (new hook)        |  | (new hook)             |
| - Geolocation API |  | - QR code fetching     |
| - Reverse geocode |  | - Item + details       |
| - Address lookup  |  | - Owner name (public)  |
+-------------------+  | - Scan notification    |
                       | - Display name helper  |
                       +------------------------+
            |
            v
+-------------------+  +------------------------+  +----------------------+
| FinderHeader      |  | ItemDetailsCard        |  | PrivateMessageForm   |
| (new component)   |  | (new component)        |  | (new component)      |
| - Logo + auth btns|  | - Item details list    |  | - Form fields        |
+-------------------+  | - Description display  |  | - Validation + send  |
                       +------------------------+  | - Success state      |
                                                   +----------------------+
```

## Files to Create

### 1. `src/hooks/useLocationData.ts`
**Purpose:** Encapsulate geolocation and reverse geocoding logic

**Responsibilities:**
- Request browser geolocation
- Reverse geocode coordinates to address (Nominatim API)
- Manage loading state
- Handle errors gracefully

**Interface:**
```typescript
interface UseLocationDataReturn {
  location: LocationData;
  loading: boolean;
  refresh: () => void;
}
```

### 2. `src/hooks/useFinderPageData.ts`
**Purpose:** Handle all data fetching and routing logic for the finder page

**Responsibilities:**
- Fetch QR code by loqatr_id
- Redirect unclaimed tags to `/tag/:code`
- Redirect owner scans to `/my-tags/:code`
- Fetch item and item details
- Fetch owner's first name (for public tags)
- Trigger owner notification on physical scan (`?scan=true`)
- Provide `getDisplayOwnerName()` helper

**Interface:**
```typescript
interface UseFinderPageDataReturn {
  loading: boolean;
  qrCode: QRCodeData | null;
  item: ItemInfo | null;
  itemDetails: ItemDetailDisplay[];
  getDisplayOwnerName: () => string;
  setQRCode: (qr: QRCodeData) => void;
}
```

### 3. `src/components/finder/FinderHeader.tsx`
**Purpose:** Reusable header for the finder page

**Responsibilities:**
- Logo with theme-aware switching
- Sign in/Sign up buttons for unauthenticated users

### 4. `src/components/finder/ItemDetailsCard.tsx`
**Purpose:** Display item details in a card

**Responsibilities:**
- Render item detail fields (excluding "Item owner name")
- Show description if present
- Show empty state message

### 5. `src/components/finder/PrivateMessageForm.tsx`
**Purpose:** Self-contained form for private tag messaging

**Responsibilities:**
- Form state management (name, email, phone, message)
- Validation (name required, email or phone required)
- Message submission via edge function
- Success state display

**Props:**
```typescript
interface PrivateMessageFormProps {
  item: ItemInfo;
  qrCode: QRCodeData;
  locationAddress: string | null;
}
```

## File Modifications

### `src/pages/FinderPage.tsx`
**Changes:**
- Import and use new hooks: `useLocationData`, `useFinderPageData`
- Import new components: `FinderHeader`, `ItemDetailsCard`, `PrivateMessageForm`
- Remove all extracted logic (~350 lines removed)
- Keep orchestration: loading state, contact reveal state, mode switching
- Final size: ~150 lines

### `src/components/finder/index.ts`
**Changes:**
- Add exports for new components

## Implementation Details

### Hook: useLocationData
- Uses `navigator.geolocation.getCurrentPosition`
- Calls Nominatim API for reverse geocoding
- Returns `LocationData` type from `src/types`
- Memoizes with `useCallback` to prevent re-renders

### Hook: useFinderPageData
- Takes `code`, `user`, `isScan`, and `location` as parameters
- Uses `useEffect` with proper dependencies
- Calls `notifyTagScanned` from `src/lib/notifications`
- Uses `supabase.rpc("get_public_owner_name")` for public tags
- Calculates display name from item details, owner name, or revealed contact

### Component: PrivateMessageForm
- Manages own form state with `useState`
- Calls `supabase.functions.invoke("submit-finder-message")`
- Shows toast notifications for success/error
- Displays success UI with CheckCircle icon after send

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Lines in FinderPage | ~503 | ~150 |
| Testable units | 1 (hard) | 5+ (easy) |
| Reusability | None | Hooks can be used elsewhere |
| Separation of concerns | Mixed | Clear boundaries |
| Code navigation | Difficult | Logical file structure |

## Execution Order

1. Create `useLocationData.ts` hook
2. Create `useFinderPageData.ts` hook
3. Create `FinderHeader.tsx` component
4. Create `ItemDetailsCard.tsx` component
5. Create `PrivateMessageForm.tsx` component
6. Update `finder/index.ts` exports
7. Refactor `FinderPage.tsx` to use new modules
8. Test all functionality end-to-end


# Fix Item Details Persistence in Edit Tag Page

## Problem Summary
When editing a tag and saving changes, the item details (including "Item owner name" and other details) are correctly saved to the database but are not displayed when returning to the edit page. This creates a confusing experience where saved data appears to be lost.

## Root Causes Identified

### 1. Form Initialization Race Condition
The `useEditTagData` hook uses a `formInitialized` flag to prevent re-initialization. When React Query returns cached data first, the form initializes with potentially stale/empty data. When fresh data arrives, the flag is already `true`, so fresh data is ignored.

### 2. Missing Field Type Synchronization
The `ItemDetailsEditor` component has an `onFieldChange` callback for updating the `fieldType` display label when the user changes the dropdown. This callback is not being passed from the page components, causing display mismatches.

### 3. Disconnected State Management
The `useItemDetailsManager` hook maintains its own internal state that becomes disconnected from the fetched data after the initial load. There's no mechanism to sync it when new data arrives.

## Solution

### Step 1: Fix Data-Dependent Form Initialization
**File: `src/hooks/useEditTagData.ts`**

Change the initialization logic to depend on the actual data, not just a boolean flag. Use the item ID as the key for initialization:

```text
Replace the formInitialized boolean with a reference to the item ID that was initialized.
Only re-initialize when loading a different item, not just on first render.
```

### Step 2: Add Field Type Update Handler
**File: `src/hooks/useItemDetailsManager.ts`**

Add a function to update both `field_id` and `fieldType` together:

```text
Add updateDetailField function that updates both field_id and fieldType atomically.
This ensures the display label stays in sync with the selected field ID.
```

### Step 3: Pass Field Change Callback
**Files: `src/pages/EditTagPage.tsx` and `src/pages/ClaimTagPage.tsx`**

Pass the `onFieldChange` callback to `ItemDetailsEditor`:

```text
Add onFieldChange prop that calls the new updateDetailField function.
```

### Step 4: Improve Cache Invalidation Timing
**File: `src/hooks/useEditTagData.ts`**

Ensure cache is invalidated and form state is reset properly after save:

```text
After invalidateQRCode, reset formInitialized so fresh data loads properly.
Consider using a unique identifier per item rather than a boolean.
```

## Technical Implementation Details

### useEditTagData.ts Changes:
1. Replace `formInitialized: boolean` with `initializedItemId: number | null`
2. Change the guard condition from `if (formInitialized)` to `if (initializedItemId === item?.id)`
3. After successful save, don't reset the initialized ID (the data should match what was just saved)
4. Reset `initializedItemId` to `null` when navigating to a different item

### useItemDetailsManager.ts Changes:
1. Add `updateDetailField(id: string, field_id: number, fieldType: string)` function
2. This function updates both properties in a single state update

### ItemDetailsEditor Integration:
1. Export the new function from the hook
2. Pass it as `onFieldChange` prop to the editor component

## Files to Modify
1. `src/hooks/useEditTagData.ts` - Fix initialization logic
2. `src/hooks/useItemDetailsManager.ts` - Add combined field update function
3. `src/pages/EditTagPage.tsx` - Pass onFieldChange callback
4. `src/pages/ClaimTagPage.tsx` - Pass onFieldChange callback

## Expected Outcome
After these changes:
- Saved item details will persist and display correctly when reopening the edit page
- The "This is not my item" toggle will retain its state
- Item owner name will be saved and loaded properly
- Field type labels will stay synchronized with selected field IDs

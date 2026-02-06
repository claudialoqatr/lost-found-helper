
# Fix Item Details Persistence - Final Resolution

## Problem Summary
Even though the technical implementation details were applied (initializedItemId, updateDetailField, onFieldChange), item details are still not persisting correctly when the edit page is reopened. The data IS being saved to the database, but is not being loaded back properly.

## Root Cause Analysis

The issue is a **data reference equality problem** in the initialization logic:

```typescript
// In useEditTagData.ts, line 137:
if (initializedItemId === item.id) return;
```

This check happens BEFORE `fetchedDetails` (the item details from the database) are evaluated. The problem is:

1. First render: `item.id = 161`, `fetchedDetails = []` (empty from cache)
2. Form initializes with empty details, sets `initializedItemId = 161`
3. Fresh data arrives: `item.id = 161`, `fetchedDetails = [{Age: 12}, {Owner: Sarah}]`
4. Check runs: `initializedItemId (161) === item.id (161)` → **RETURNS EARLY**
5. Fresh details are NEVER loaded into form state

The guard only checks `item.id`, but when cached and fresh data have the same item ID but DIFFERENT item details, the fresh details are ignored.

## Solution

The initialization guard must ALSO consider whether the fetched details have changed. This can be done by:

1. **Adding a data fingerprint check** - Compare a hash of the fetched details to detect when fresh data differs from what was used to initialize

2. **Or tracking the fetched details reference** - Since React Query returns new array references when data changes, we can detect this

### Recommended Approach: Track fetchedDetails Length

Add an additional check that compares the current form state against what's being fetched. If the fetched details are different and haven't been applied, re-initialize:

```text
File: src/hooks/useEditTagData.ts

Change the initialization effect to:
1. Keep the initializedItemId check for basic item identity
2. Add a secondary check: if fetchedDetails has data but local itemDetails is empty, 
   AND we're not currently saving, re-sync the form state

OR more robustly:
3. Store a "dataVersion" or "lastFetchedAt" timestamp that changes when React Query 
   refreshes, and use that in the dependency check
```

## Files to Modify

### 1. src/hooks/useEditTagData.ts

**Current code (lines 133-137):**
```typescript
// Verify ownership and initialize form when data loads
useEffect(() => {
  if (qrLoading || !qrCode || !item) return;
  
  // Skip if already initialized for this specific item
  if (initializedItemId === item.id) return;
```

**Updated code:**
```typescript
// Verify ownership and initialize form when data loads
useEffect(() => {
  if (qrLoading || !qrCode || !item) return;
  
  // Skip if already initialized for this specific item AND we have the same data
  // The fetchedDetails array reference changes when React Query fetches fresh data
  // So we need to re-initialize when fetchedDetails changes, even for the same item
  if (initializedItemId === item.id && fetchedDetails.length === itemDetails.length) {
    // Additional check: if we have fetched data but empty local state, something is wrong
    if (fetchedDetails.length > 0 || itemDetails.length > 0) {
      return;
    }
  }
```

This adds a safety check: if we fetched details from the server but our local state is empty, we should re-initialize even if the item ID matches.

### Alternative Approach (More Robust)

Track a "data hash" to detect when fresh data arrives:

```typescript
// Add state to track what data was used for initialization
const [initializedDataHash, setInitializedDataHash] = useState<string>("");

// Create a hash of the fetched details
const dataHash = useMemo(() => {
  return JSON.stringify(fetchedDetails.map(d => ({ field_id: d.field_id, value: d.value })));
}, [fetchedDetails]);

// In the effect
useEffect(() => {
  if (qrLoading || !qrCode || !item) return;
  
  // Skip if already initialized with this exact data
  if (initializedItemId === item.id && initializedDataHash === dataHash) return;
  
  // ... initialization code ...
  
  setInitializedItemId(item.id);
  setInitializedDataHash(dataHash);
}, [/* deps including dataHash */]);
```

## Expected Outcome

After this fix:
- When navigating to the edit page, item details will load correctly from the database
- The "This is not my item" toggle will reflect the saved state (on if owner name exists)
- Item owner name will be displayed in the dedicated field
- Saving and returning to the page will show all previously saved details
- The cache invalidation after save will trigger a fresh fetch that properly re-initializes the form

## Technical Details

### Why the current code fails:

1. **TanStack Query caching**: Returns cached (possibly empty) data immediately
2. **Same item ID**: `initializedItemId === item.id` passes even with stale data
3. **No data comparison**: The guard doesn't check if the actual details data has changed
4. **Premature exit**: The effect returns early, never applying fresh data to form state

### Why the fix works:

1. **Data-aware guard**: Checks both item identity AND data content
2. **Handles cache refresh**: When React Query fetches fresh data, the hash/length changes
3. **Re-initializes form**: Fresh details are properly copied to form state
4. **Preserves user edits**: Once initialized, subsequent fetches don't overwrite user changes (as long as data matches)

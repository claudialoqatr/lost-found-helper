

## Fix Critical RLS Policy Bug in `item_details` Table

### Problem Summary

The current INSERT policy for the `item_details` table contains a logic error that allows any authenticated user who owns at least one QR code to insert item details for **any item in the system**, not just their own items.

### The Bug

**Current (Broken) Policy:**
```sql
(EXISTS ( SELECT 1
   FROM qrcodes q
  WHERE ((q.item_id = q.item_id) AND (q.assigned_to = get_user_id()))))
```

The condition `q.item_id = q.item_id` is always `true` for every row in the `qrcodes` table (a column always equals itself). This means the policy only checks if the user owns **any** QR code, not if they own the specific item being inserted.

### The Fix

**Corrected Policy:**
```sql
(EXISTS ( SELECT 1
   FROM qrcodes q
  WHERE ((q.item_id = item_details.item_id) AND (q.assigned_to = get_user_id()))))
```

This correctly checks that the user owns a QR code linked to the **specific item** for which details are being inserted.

---

### Implementation

**Database Migration:**

1. Drop the existing buggy INSERT policy on `item_details`
2. Create a new INSERT policy with the corrected condition that references `item_details.item_id`

```sql
-- Drop the buggy policy
DROP POLICY IF EXISTS "Item owners can insert item_details" ON public.item_details;

-- Create corrected policy
CREATE POLICY "Item owners can insert item_details" 
ON public.item_details 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM qrcodes q 
    WHERE q.item_id = item_details.item_id 
    AND q.assigned_to = get_user_id()
  )
);
```

---

### Security Impact

| Before Fix | After Fix |
|------------|-----------|
| Any authenticated user with 1+ QR codes can insert details for ANY item | Users can only insert details for items linked to their own QR codes |
| Data pollution/tampering possible | Proper ownership enforcement |

---

### Testing Verification

After applying the fix:
1. Navigate to `/my-tags/LOQ-TEST-003` and verify you can still add/edit item details for your own items
2. The claim tag flow should continue to work normally
3. Users should not be able to insert details for items they don't own


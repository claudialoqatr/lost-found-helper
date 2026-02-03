
# Alternate Item Owner Feature

## Overview

This feature allows QR code owners to specify that the tagged item belongs to someone else (e.g., a parent tagging their child's backpack). When enabled, an "Item owner name" field becomes **required**, and the finder page will display this name instead of the QR owner's name.

## How It Will Work

### Claiming/Editing a Tag
1. A new toggle appears in `ItemForm`: **"I own this item"** (ON by default)
2. When toggled OFF:
   - An "Item owner name" entry is **automatically added** to the Item Details section
   - This entry is **required** - validation prevents saving without it
   - The user fills in the owner's name using the existing `ItemDetailsEditor` UI

### Finder Experience
When someone scans the QR code:
- If "Item owner name" exists: **"You have found Max's Backpack!"**
- If not: **"You have found John's Backpack!"** (QR owner's name, as before)
- WhatsApp/Email messages use the same logic for personalization

---

## Implementation Details

### 1. Database: Add Field Type

```sql
INSERT INTO item_detail_fields (type) VALUES ('Item owner name');
```

This adds "Item owner name" as a field type option (ID will be 7).

### 2. Update ItemDetailsEditor.tsx

Add "Item owner name" to the available field types so it appears in the dropdown and can be managed like other details.

```typescript
const FIELD_TYPES = [
  "Item owner name",  // New - added first for visibility
  "Emergency contact", 
  "Return address", 
  "Reward offer", 
  "Medical info", 
  "Pet info", 
  "Other"
];
```

### 3. Update ItemForm.tsx

Add a new toggle with conditional logic:

**New Props:**
- `isItemOwner: boolean` - Whether the QR owner is also the item owner
- `setIsItemOwner: (value: boolean) => void`
- `onItemOwnerToggle: (isOwner: boolean) => void` - Callback when toggle changes (to add/remove the required detail)

**New UI (after Item Name field):**
```text
I own this item:  [ON ●━━━] 

(When OFF, displays helper text):
"Please add the item owner's name in the details below"
```

### 4. Update ClaimTagPage.tsx

**State Management:**
- Add `isItemOwner` state (default: `true`)
- Track whether "Item owner name" detail exists

**Toggle Handler:**
When toggle is switched OFF:
- Automatically add an empty "Item owner name" entry to `itemDetails`

When toggle is switched ON:
- Remove any "Item owner name" entry from `itemDetails`

**Validation on Submit:**
- If `isItemOwner` is false, check that an "Item owner name" detail exists with a non-empty value
- Show error toast if missing

### 5. Update EditTagPage.tsx

Same changes as ClaimTagPage, plus:
- On data load, check if "Item owner name" detail exists → set `isItemOwner` to `false`
- Preserve existing "Item owner name" value when editing

### 6. Update FinderPage.tsx

**New Helper Function:**
```typescript
const getDisplayOwnerName = () => {
  // Check for "Item owner name" in item details
  const ownerNameDetail = itemDetails.find(
    d => d.type === "Item owner name"
  );
  
  if (ownerNameDetail?.value) {
    return ownerNameDetail.value.split(" ")[0]; // First name only
  }
  
  // Fall back to QR owner's name
  return getOwnerFirstName();
};
```

**Updates:**
1. **Hero heading** (line 395-399): Use `getDisplayOwnerName()` instead of `getOwnerFirstName()`
2. **getWhatsAppLink()**: Replace `getOwnerFirstName()` with `getDisplayOwnerName()`
3. **getEmailLink()**: Replace `getOwnerFirstName()` with `getDisplayOwnerName()`
4. **Contact section header** (line 450): Use `getDisplayOwnerName()`

**Hide from Item Details Display:**
Filter out "Item owner name" from the visible item details list since it's used for display purposes, not as an info field:

```typescript
{itemDetails
  .filter(d => d.type !== "Item owner name")
  .map((detail, index) => (
    // ... existing render
  ))}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tag/ItemDetailsEditor.tsx` | Add "Item owner name" to FIELD_TYPES |
| `src/components/tag/ItemForm.tsx` | Add "I own this item" toggle with callback |
| `src/pages/ClaimTagPage.tsx` | Add state, toggle handler, validation |
| `src/pages/EditTagPage.tsx` | Add state, toggle handler, load existing value |
| `src/pages/FinderPage.tsx` | Add getDisplayOwnerName(), update display/messages |

---

## User Flow Example

### Scenario: Parent tagging child's backpack

1. Parent scans unclaimed QR code
2. Enters item name: "School Backpack"
3. Toggles "I own this item" → OFF
4. System auto-adds "Item owner name" row to Item Details
5. Parent enters "Max" in the Item owner name field
6. Saves the tag

**Finder sees:** "You have found **Max's** School Backpack!"

**WhatsApp message:** "Hi **Max**! I found your School Backpack tagged with Loqatr..."

---

## Validation Rules

1. If "I own this item" is OFF:
   - "Item owner name" detail must exist
   - Value cannot be empty
   - Show toast: "Please enter the item owner's name"

2. If "I own this item" is ON:
   - Any existing "Item owner name" detail is removed on save
   - Normal validation applies (item name required)


# Refactor: Separate Claim & Edit Pages with Owner Redirect

## Overview

This refactor will split the current `ClaimTagPage.tsx` into two distinct pages while sharing core components for uniformity. Additionally, when an owner scans their own QR code, they will be redirected to `/my-tags/:code` instead of `/tag/:code`.

---

## Current Flow vs. New Flow

```text
CURRENT FLOW:
┌─────────────────────────────────────────────────────────────┐
│  /tag/:code (ClaimTagPage.tsx)                              │
│  - If unclaimed → Show claim form                           │
│  - If claimed by current user → Show edit form              │
│  - If claimed by someone else → Redirect to /found/:code    │
└─────────────────────────────────────────────────────────────┘

NEW FLOW:
┌─────────────────────────────────────────────────────────────┐
│  /tag/:code (ClaimTagPage.tsx - Simplified)                 │
│  - If unclaimed → Show claim form                           │
│  - If claimed by current user → Redirect to /my-tags/:code  │
│  - If claimed by someone else → Redirect to /found/:code    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  /my-tags/:code (EditTagPage.tsx - New)                     │
│  - Edit item details                                        │
│  - View scan history                                        │
│  - Unassign tag option                                      │
│  - Full management features                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  /found/:code (FinderPage.tsx - Updated)                    │
│  - If owner scans → Redirect to /my-tags/:code              │
│  - Otherwise → Show finder view                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create

### 1. Shared Components

**`src/components/tag/ItemForm.tsx`**
Reusable form for item name, description, and public/private toggle.

**`src/components/tag/ItemDetailsEditor.tsx`**
Reusable component for adding/editing dynamic item details (emergency contact, reward offer, etc.).

**`src/components/tag/ContactDetailsCard.tsx`**
Displays the owner's contact information that will be shown to finders.

**`src/components/tag/LoqatrIdCard.tsx`**
Displays the Loqatr ID badge for the tag.

### 2. New Page

**`src/pages/EditTagPage.tsx`**
A dedicated management page for owners at `/my-tags/:code` that includes:
- Item editing form (using shared components)
- Scan history
- Unassign tag option
- Contact details preview

---

## Files to Modify

### 1. `src/App.tsx`
Add the new route:
```tsx
<Route path="/my-tags/:code" element={<EditTagPage />} />
```

### 2. `src/pages/ClaimTagPage.tsx`
Simplify to only handle unclaimed tags:
- Remove all edit functionality
- Redirect owners to `/my-tags/:code` instead of showing edit form
- Keep only the claim flow

### 3. `src/pages/FinderPage.tsx`
Update owner redirect:
```tsx
// Line 163-166: Change redirect destination
if (currentUserId === qrData.assigned_to) {
  navigate(`/my-tags/${code}`);  // Changed from /tag/:code
  return;
}
```

### 4. `src/components/AppLayout.tsx`
Update notification click handler to navigate to `/my-tags/:code`:
```tsx
// Line 72-74: Update navigation
if (data?.loqatr_id) {
  navigate(`/my-tags/${data.loqatr_id}`);  // Changed from /tag/:code
}
```

### 5. `src/pages/MyTagsPage.tsx`
Update tag card navigation:
```tsx
// Line 273: Update onClick navigation
onClick={() => navigate(`/my-tags/${tag.loqatr_id}`)}
```

---

## Technical Details

### Shared Component Props

```typescript
// ItemForm props
interface ItemFormProps {
  itemName: string;
  setItemName: (name: string) => void;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  description: string;
  setDescription: (description: string) => void;
}

// ItemDetailsEditor props
interface ItemDetailsEditorProps {
  details: ItemDetail[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "fieldType" | "value", value: string) => void;
}

// ContactDetailsCard props
interface ContactDetailsCardProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

// LoqatrIdCard props
interface LoqatrIdCardProps {
  loqatrId: string;
}
```

### EditTagPage Features
- Uses `AppLayout` for consistent header
- Fetches existing item data on load
- Displays `ScanHistory` component
- Includes unassign functionality (moved from MyTagsPage context menu)
- Shows success after save, stays on page (no redirect)

### ClaimTagPage Simplification
- Only handles new tag claims
- After successful claim, redirects to `/my-tags/:code`
- Removes all "existingItem" conditional logic

---

## Route Summary

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/tag/:code` | Claim unclaimed tags | Yes |
| `/my-tags/:code` | Edit/manage owned tags | Yes |
| `/found/:code` | Finder view for non-owners | No |
| `/my-tags` | Dashboard listing all tags | Yes |

---

## Benefits

1. **Clear Separation of Concerns**: Claiming and editing have distinct purposes and UX
2. **Cleaner URLs**: `/my-tags/:code` clearly indicates ownership context
3. **Simpler Components**: Each page has focused logic without complex conditionals
4. **Better Maintainability**: Shared components reduce code duplication
5. **Improved UX**: Owners always land on management view when scanning their own tags

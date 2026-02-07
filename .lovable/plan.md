

# FinderHeader: Retailer Logo Link Behavior

A small, focused update to make the header logo link to the retailer's website when white-label branding is active.

---

## What Changes

The header logo on the "Found" page will behave differently depending on whether a retailer has provided both a logo and a website URL:

- **Retailer logo + website URL provided**: Clicking the logo opens the retailer's website in a new tab
- **Retailer logo only (no URL)**: Logo displays but links to the internal LOQATR dashboard as usual
- **No retailer branding**: Standard LOQATR logo linking to the dashboard (current behavior)

---

## Technical Details

### 1. FinderHeader.tsx

- Add a `partnerUrl` prop alongside the existing `retailerLogoUrl` prop
- Replace the single `Link` wrapper with conditional rendering:
  - If both `retailerLogoUrl` and `partnerUrl` exist, wrap the `img` in an `<a>` tag with `href={partnerUrl}`, `target="_blank"`, and `rel="noopener noreferrer"`
  - Otherwise, keep the existing `<Link to="/my-tags">` wrapper
- No changes to the image styling or auth buttons

### 2. FinderPage.tsx

- Pass `retailer?.partner_url` as a new `partnerUrl` prop to `FinderHeader`

### 3. useFinderPageData.ts -- No changes needed

The hook already fetches `partner_url` from the `retailers` table in the `resolveRetailer` function and returns it as part of the `RetailerBranding` object.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/finder/FinderHeader.tsx` | Add `partnerUrl` prop, conditional `<a>` vs `<Link>` wrapper |
| `src/pages/FinderPage.tsx` | Pass `retailer?.partner_url` to `FinderHeader` |


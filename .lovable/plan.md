

# LOQATR - Lost & Found QR Tagging System 🏷️
*Reconnecting people with their belongings through community collaboration*

---

## Design System (From Brand Guide)

### Color Palette
- **Primary**: Black (#000000), White (#FFFFFF)
- **Accent**: Midnight Blue (#003366), Egg Blue/Cyan (#00DCE4)
- **Signature Gradient**: Midnight Blue → Egg Blue
- **Neutral Shades**: Woodsmoke (#1C1C1C), Chicago (#555555), Gunsmoke (#888888)

### Typography
- **Font**: Lexend (Google Fonts)
- **Scale**: 1.250 ratio (h1: 2.986rem → xs: 0.694rem)

### Visual Style
- Clean, minimalist aesthetic
- High contrast with selective Egg Blue accent pops
- Gradient overlays for depth
- Modern, urban feel

---

## Phase 1: Foundation & Authentication

### Connect Supabase
- Link your existing Supabase project with pre-built tables
- Set up RLS policies for secure data access

### Design System Setup
- Implement LOQATR brand colors and typography in Tailwind config
- Add Lexend font from Google Fonts
- Create gradient utilities for the signature blue gradient

### Login & Signup Page
- Clean, minimal design with gradient accents
- Email/password authentication
- Smooth transitions and modern feel
- Error handling with friendly messaging

---

## Phase 2: Smart QR Code Scanning Page ⭐

### The Dual-Purpose Public Page
When anyone scans a QR code (`/tag/:code`):

**If QR code is UNCLAIMED:**
- Clean "Claim This Tag" interface
- If logged in → Show claim form with item details fields
- If not logged in → Prompt to login/signup, redirect back after

**If QR code is CLAIMED:**
- Display item name, description, and custom fields
- Owner's contact preferences
- "I Found This!" form for finders
- Empowering messaging: "You're helping reunite someone with their belongings!"
- No login required for finders
- Sleek design with gradient accents

---

## Phase 3: User Dashboard

### Overview Dashboard
- **Stats cards** with clean, modern styling:
  - Total claimed tags
  - Recent scans on your items
  - Unread finder messages
- **Quick actions**: View my tags, see messages
- **Activity feed**: Recent scans and finder contacts
- Midnight blue to egg blue gradient accents
- High contrast, minimalist layout

---

## Phase 4: My Tags Management

### Tags List
- Clean table/card view of all claimed QR codes
- Status indicators (active, scanned recently)
- Search and filter functionality

### Edit Tag Details
- Update item name and description
- Dynamic custom fields (from `item_detail_fields`)
- View scan history with timestamps
- Location data when available

---

## Phase 5: Finder Messages (Loqatrs)

### Message Inbox
- Modern inbox-style interface
- See which tag each message relates to
- Read/unread status
- Mark as resolved when item is returned
- Finder's contact info to respond
- Celebration moment when marking as "Returned!"

---

## Technical Notes
- Supabase connection using Lovable Cloud integration
- Uses your existing table structure
- Mobile-first responsive design
- Lexend font loaded from Google Fonts

---

## Future Phases (After MVP)
- Superadmin panel for QR code batch generation
- Scan analytics with Leaflet maps
- Your custom round/branded QR code styling
- Photo uploads for items
- Push notifications for new scans


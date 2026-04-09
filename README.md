# CoffeeMeet — Frontend

React SPA for CoffeeMeet, a coffee-chat scheduling platform for organizations. Three completely separate portals for admins, hosts, and participants — each with purpose-built UX.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 19** | Component model, hooks, concurrent rendering |
| Routing | **React Router v7** | Client-side routing, URL params for join codes |
| Build | **Vite 7** | Fast HMR in dev, optimized production bundles |
| Styling | **Plain CSS** (index.css / App.css) | No dependency overhead; custom design system with CSS variables |
| HTTP | **fetch** (native) | No extra library needed; thin wrapper in `src/api.js` |
| Deployment | **Vercel** | Auto-deploy from `main`, edge CDN, env vars |

No UI component library was used — every component is custom-built to match the CoffeeMeet brand (warm browns, amber accents, cream backgrounds).

---

## App Structure

```
src/
├── App.jsx                     # Route definitions
├── api.js                      # All backend API calls in one place
├── index.css                   # Global design system + component styles
├── pages/
│   ├── LandingPage.jsx         # Role-selection entry point
│   ├── CustomerPage.jsx        # Participant booking portal
│   ├── BookingAccessPage.jsx   # Email-only entry page (from email links)
│   ├── BaristaDashboard.jsx    # Host dashboard (slot management)
│   ├── OwnerPage.jsx           # Admin portal entry
│   └── owner/
│       ├── OwnerLogin.jsx      # Admin login/register
│       ├── OwnerDashboard.jsx  # Cafe list
│       └── OwnerCafeView.jsx   # Full cafe management view
└── components/
    ├── Header.jsx
    ├── CalendarGrid.jsx        # Monthly calendar (participant view)
    ├── DayTimeline.jsx         # Slot list for selected day (participant)
    ├── DayCell.jsx             # Individual calendar day cell
    ├── BaristaSidebar.jsx      # Host profile cards with bio hover popup
    ├── BookingModal.jsx        # Slot selection confirmation
    ├── BookingPage.jsx         # Participant name/email entry form
    ├── CelebrationOverlay.jsx  # Post-booking success animation
    ├── SlotCard.jsx            # Slot card in day timeline
    ├── SlotPopup.jsx           # Slot detail popup
    ├── barista/
    │   ├── BaristaLogin.jsx        # Two-tab login (new host / returning host)
    │   ├── BaristaCalendarGrid.jsx # Calendar with drag-to-create
    │   ├── BaristaDayTimeline.jsx  # Host day view with slot management
    │   ├── BaristaSlotCard.jsx     # Slot card with edit/delete actions
    │   ├── BaristaSlotPopup.jsx    # Slot detail + actions popup
    │   ├── BaristaTimeRangePicker.jsx # Time picker for slot creation
    │   └── HostSlotsSidebar.jsx    # Sidebar showing all booked slots for this host
    └── owner/
        ├── OwnerDayTimeline.jsx    # Admin slot management view
        ├── OwnerSettings.jsx       # Cafe settings panel
        └── ShareLinksPopup.jsx     # Displays both join codes for sharing
```

---

## Routes

| Path | Component | Who uses it |
|------|-----------|-------------|
| `/` | `LandingPage` | Everyone — role selection |
| `/cafe/:joinCode` | `CustomerPage` | Participants — booking portal |
| `/booking/:participantCode` | `BookingAccessPage` | Participants returning from email links |
| `/barista` | `BaristaDashboard` | Hosts — slot management |
| `/owner` | `OwnerPage` | Admins — login/register |
| `/owner/cafe/:cafeId` | `OwnerCafeView` | Admins — cafe management |

---

## The Three Portals

### Participant Portal (`/cafe/:joinCode`)
- Monthly calendar grid showing available and booked dates
- Host sidebar with profile cards, bios, and hover popups
- Day timeline showing open slots for a selected date
- Booking flow: slot selection → name/email entry → celebration overlay
- Persistent "Your Booking" widget (bottom-left, golden) shows booking details and a cancel button
- "Already made a booking?" button restores session by email
- Session stored in `sessionStorage` — persists through refresh, clears when tab closes
- Handles host-cancelled bookings gracefully: clears stale session on page load

### Host Dashboard (`/barista?code=XXXXXX`)
- Two-tab login: new host (full form) or returning host (email only)
- Session persisted in `localStorage` keyed by join code — survives browser restarts
- Drag-to-create on the calendar: click and drag a time range to define a new slot
- "Your Bookings" sidebar shows all participants booked with this host, including email and meeting link
- Edit modal: update location and virtual meeting link
- Cancel booking with confirmation popup

### Admin Portal (`/owner`)
- Register or log in with email + password
- Dashboard showing all cafes
- Per-cafe view: manage hosts (add/remove), view all participants, manage all slots
- ShareLinksPopup: displays both host join code and participant join code for sharing
- CSV export: full data dump of bookings, hosts, and participants
- Cafe settings: edit name, dates, one-slot policy

---

## Key Design Decisions

**No state management library.** All state lives in the component that owns it and is passed down as props. The app is small enough that useState + prop drilling is clearer than introducing Redux or Zustand.

**Session per role, per browser:**
- Participants use `sessionStorage` (anonymous, short-lived)
- Hosts use `localStorage` keyed by join code (long-lived, role appropriate)
- Admins use `sessionStorage` (explicitly logged in/out)

**Single `api.js` module.** All fetch calls go through one file with consistent error handling. No per-component fetch logic. Makes it easy to see every API surface at a glance.

**Separate public and authenticated slot endpoints.** `getSlots()` calls the public endpoint (no customer email). `getHostSlots()` calls the authenticated endpoint with the host's token — so customer contact info is only ever sent to verified hosts.

**Email-link access flow.** Clicking "Manage my booking" in any email goes to `/booking/:code`, a standalone page that asks for the participant's email. On success it stores the session and redirects to the main portal. No tokens or personal data are embedded in email URLs.

**Optimistic UI.** Booking, unbooking, and slot edits update local state immediately before the API responds, making the UI feel fast on slow connections.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (e.g. `https://your-app.railway.app`) |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set env
echo "VITE_API_URL=http://localhost:8000" > .env.local

# 3. Run
npm run dev
```

App available at `http://localhost:5173`.

---

## Deployment (Vercel)

1. Connect your GitHub repo to a Vercel project
2. Set `VITE_API_URL` in Vercel project settings → Environment Variables
3. Push to `main` — Vercel auto-deploys
4. `vercel.json` is configured to rewrite all routes to `index.html` for client-side routing

---

*Built by Penn Engineering Student.*

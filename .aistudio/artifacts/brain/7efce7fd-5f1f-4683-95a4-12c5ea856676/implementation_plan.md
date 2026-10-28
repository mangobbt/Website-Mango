# Implementation Plan: Interactive Zoomable Map & Secret Mango Footer Password Unlock

Enhance the Travel Cartography Map with seamless zoom/pan, click-to-zoom city focus, and individual mountain-labeled saved spot markers with detail cards. Replace traditional edit links with a secret password unlock triggered exclusively by clicking the footer mango emoji (default passcode `mango` with in-app customization).

---

### User Review Required

> [!IMPORTANT]
> **Key Decisions Confirmed by User:**
> 1. **Secret Edit Access**: Clicking the `🥭` emoji in the footer ("Fueled by fresh mangoes 🥭") opens a password unlock modal. Default password is `mango` with an option to customize it in localStorage. When unlocked, full edit privileges (adding entries, editing/deleting any entry across all sections) are activated.
> 2. **Zoomable Map**: The map supports intuitive zoom in/out (buttons, scroll-wheel, plus click-and-drag pan), with a dedicated "Reset / World View" button.
> 3. **City Zoom & Saved Spots**: Clicking any city pin zooms the map directly into that city. All saved spots in that city (`travelSpots`) appear labeled with the mountain emoji `🏔️`.
> 4. **Spot Detail Card**: Clicking any mountain spot pin opens an interactive location detail card displaying the spot name, neighborhood, mountain rating, photo preview, notes, and a direct Google Maps button.

---

### Proposed Changes

#### Types & Data
#### `src/types/index.ts`
- Add optional `coordinates?: TravelCoords` to `TravelSpot` interface so saved spots can have precise or derived local coordinates.

#### `src/data/initialEntries.ts`
- Enrich saved `travelSpots` across Tokyo, Kyoto, Lisbon, Vancouver, Banff, Taipei, and Big Sur with local coordinates around their respective cities for crisp spatial layout when zoomed in.

---

#### Map Interaction
#### `src/components/map/InteractiveMap.tsx`
- **Dynamic Zoom & Pan Engine**:
  - Implement smooth viewBox transitions or transformed SVG container supporting zoom levels from 1x (world view) up to 5x (city focus).
  - Add drag-to-pan handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`) and mouse wheel zoom support.
- **City Click Focus**:
  - When a city pin is clicked, automatically calculate the target center coordinate and animate/transition zoom into that city.
  - Show a floating "← World View" badge to quickly zoom back out.
- **Mountain Labeled Spot Markers**:
  - When zoomed into a selected city (or when a city is selected), render its `travelSpots` as mountain markers:
    - Mountain badge: `🏔️` with rating indicator.
    - Spot title label with halo text for readability.
- **Spot Location Detail Card**:
  - Clicking a mountain spot pin displays an interactive popover card with:
    - Spot name and neighborhood badge.
    - Mountain rating.
    - Photo thumbnail (if available).
    - Curated notes/field dispatch.
    - Direct "Open in Google Maps" external link button.

---

#### Secret Mango Footer Password Unlock
#### `src/components/modals/PasswordUnlockModal.tsx` *(New Component)*
- Create a clean modal dialog with:
  - Mango seal icon `🥭` and title "Unlock Journal Editor".
  - Password input with toggleable visibility and error shake animation on incorrect passcode.
  - Option to update/change passcode once authenticated.
  - Clear "Unlock" and "Cancel" buttons.
- Supports default passcode `mango`, persisted in `localStorage.getItem('danny_owner_password') || 'mango'`.

#### `src/App.tsx`
- Replace direct edit links with the secret mango unlock flow:
  - In the footer (`Fueled by fresh mangoes 🥭`), make the `🥭` emoji an interactive button with a subtle hover effect and tooltip.
  - Clicking `🥭` when in public mode opens `PasswordUnlockModal`.
  - Upon entering the correct password, activates `isOwnerMode` and shows a confirmation toast: `"Editor access unlocked 🥭"`.
  - Clicking `🥭` while already in editor mode displays a management popover/sheet with:
    - "Switch to Public Mode" (lock editor)
    - "Change Passcode"
    - "Add New Entry" quick action.

---

### Verification Plan

#### Automated Verification
- Run `lint_applet` (`npm run lint` / `tsc --noEmit`) to verify zero TypeScript errors.
- Run `compile_applet` (`npm run build`) to ensure successful Vite bundling.

#### Manual Verification
1. **Interactive Map Zoom & City Spots**:
   - Navigate to the **Travelling** section.
   - Use Zoom In / Zoom Out buttons or mouse wheel to zoom the map. Click and drag to pan across the globe.
   - Click a city marker (e.g. Tokyo, Kyoto, Lisbon).
   - Verify the map zooms directly into the city.
   - Verify the saved locations appear marked with the `🏔️` mountain emoji and names.
   - Click a mountain spot pin to verify the detail card opens with notes, rating, and Google Maps link.
   - Click "World View" to zoom back out cleanly.
2. **Secret Mango Footer Password Unlock**:
   - Scroll to the footer in public view.
   - Verify there is no obvious edit link or public login button.
   - Click the `🥭` emoji in the footer.
   - Verify password prompt appears.
   - Enter wrong password -> verify feedback/error.
   - Enter default password `mango` -> verify editor mode is unlocked and toast notification appears.
   - Verify full edit capabilities (Add Entry in navbar, Edit/Delete on all entries).
   - Click `🥭` again -> verify option to lock back to public mode or change passcode.

# Implementation Plan: Travel Layout Restoration & Photo Modal Stack

Revert the Travel view layout so the interactive map is on top with an independently scrollable places/spots carousel below, remove sorting from the travel section, and update the clicked photo modal to stack photos on top and backstory descriptions on the bottom while preserving current photo gallery grid views.

---

### User Review Required

> [!IMPORTANT]
> **Key Decisions Confirmed by User:**
> 1. **Travel Section Layout**: Map returns to the top at full container width. Below it, "Places Visited & Travel Spots" is rendered as a clean, smooth **horizontal scrolling cards carousel with snap alignment** and intuitive left/right navigation indicators.
> 2. **Travel Sorting Removed**: Sort controls (by rating/date) are completely removed from Travel. Only Food & Dining and Books & Movies retain sorting.
> 3. **Photo Gallery Unchanged on Main Page**: Masonry/grid layout and studio gray palette in `PhotosView` are preserved intact.
> 4. **Clicked Photo Modal Redesign**: When an image or backstory card is clicked, the modal opens with **photos on top** (carousel/image showcase) and **backstory narratives & metadata below**, rather than a side-by-side split.

---

### Proposed Changes

#### Travel View
#### `src/components/views/TravelView.tsx`
- **Remove Sort Controls**:
  - Remove `sortBy` state, `ArrowUpDown` lucide import, and the rating/date sorting button group.
- **Restore Layout Hierarchy**:
  - Top: Header and region filter chips.
  - Middle: Full-width Interactive Map (`h-[440px] md:h-[500px]`), showing visited cities with generous spacing, pin selection, and detail overlays.
  - Bottom: "Places Visited & Travel Spots" section.
- **Horizontal Scrolling Cards Carousel**:
  - Implement a dedicated horizontal scroll container (`flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-stone-300`) with smooth wheel/touch scrolling and snap alignment (`snap-start`).
  - Add optional quick left/right arrow controls or swipe indicators for easy desktop & mobile navigation.
  - Keep active city highlight synchronizing with the map pins above.

---

#### Photo Gallery & Story Modal
#### `src/components/views/PhotosView.tsx`
- **Retain Main Grid Display**:
  - Maintain the existing visual layout of photo cards, filter categories, and soft warm studio gray aesthetic (`#F4F4F5`, slate blue accents).
- **Restructure Expanded Modal Layout**:
  - Change the modal content container from `flex flex-col lg:flex-row` to a clean vertical stack:
    - **Top Section**: Expanded photo viewer with navigation arrows, image counter badge, photo caption, and full-resolution viewing area.
    - **Bottom Section**: Scrollable narrative panel with backstory text, location tags, camera metadata (lens, focal length, aperture), Google Maps link, and related journal entry reference.
  - Ensure responsive viewport constraints so both the photo and narrative remain comfortable on both desktop and mobile screens.

---

### Verification Plan

#### Automated Verification
- Run `lint_applet` (`npm run lint` / `tsc --noEmit`) to verify no missing imports, type mismatches, or syntax errors.
- Run `compile_applet` (`npm run build`) to ensure Vite bundle builds cleanly.

#### Manual Verification
1. **Travel Section**:
   - Verify Interactive Map sits prominently across the top.
   - Verify no sorting button bar is shown in the travel section.
   - Verify "Places Visited & Travel Spots" sits directly below the map and scrolls horizontally with snap behavior.
   - Verify clicking a city pin on the map scrolls to or highlights that spot in the carousel below.
2. **Photos Section**:
   - Verify the main photo gallery grid remains untouched in its clean layout and studio gray style.
   - Click on any photo or "Read backstory":
     - Confirm modal presents the photo prominently on top.
     - Confirm backstory narrative, location, camera specs, and action buttons appear below the photo.
   - Verify multi-photo stories allow stepping through images with next/prev arrows on the top viewer.

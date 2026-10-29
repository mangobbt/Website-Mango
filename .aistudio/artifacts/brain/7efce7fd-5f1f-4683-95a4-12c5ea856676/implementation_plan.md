# Enhanced Cartography, Library Reading Shelves, Duration Tracking & Home Activity Calendar

A comprehensive design and architectural plan to elevate the commonplace journal: uniting the Eurasian continent into an accurate, contiguous landmass; introducing progressive deep-zoom cartographic labels for major freshwater lakes and rivers; adding "Currently Reading" and "To Read / Watch" shelves to Books & Movies; introducing start/end dates for travel trips and book reading durations; and rendering an interactive monthly calendar on the Home page.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed through interactive clarification and will govern the build:

- **Home Page Calendar**: An interactive monthly grid with day cells featuring colored category badges and horizontal span bars for travel trips and reading durations, complete with month-switching controls and an expandable day-activity inspector.
- **Library Shelves Organization**: Dedicated tabbed shelves in `LibraryView` separating **Currently Reading**, **To Read / To Watch**, and **Finished Works**, with counts and quick shelf-movement affordances.
- **Lake & River Map Labels**: Progressive reveal activated at deep zoom ($\ge 5\times$) so global and regional overviews remain clean, while close-up exploration reveals crisp cartographic typography along waterways and inland lakes.

---

## 1. Overview & Core Concept

This update transforms the journal into an intimate personal log of life and leisure across time and geography:
1. **Accurate World Atlas**: Europe and Asia are united into a single contiguous continental mass, correctly proportioned relative to Africa and the Americas. Ocean labels are softened and scaled down, while inland lakes (Great Lakes, Caspian, Baikal, Victoria) and rivers (Amazon, Nile, Danube, Yangtze, Mississippi) receive elegant vector name labels when zoomed in close ($\ge 5\times$).
2. **Reading & Viewing Shelves**: The Books & Movies library gains dedicated tabs for books currently in progress, items on the backlog (TBR / TBW), and completed works, giving Danny a functional personal reading tracker.
3. **Trip & Reading Duration**: Travel dispatches and book entries support both an exact date and an optional `startDate` / `endDate` range to capture trip timelines and how long a book took to read.
4. **Home Activity Calendar**: An interactive monthly calendar on the front page aggregates visits, dining outings, photo captures, essays, and multi-day reading/travel spans, providing a bird's-eye view of how Danny spent his time.

---

## 2. User Experience & Visual Design

### A. Unified Eurasian Cartography & Zoom Typography
- **Contiguous Eurasia**: Replaces separate European and Asian polygons with a unified continental landmass spanning from the Atlantic Iberian coast to the Pacific Kamchatka peninsula, naturally bounded by the Arctic Ocean, Mediterranean, Black Sea, Caspian Sea, and Indian Ocean.
- **Scaled Oceans**: Ocean typography font size is reduced by ~35% (`fontSize={Math.max(1.1, 5.2 * invZoom)}`) and opacity lowered to 0.65 for a tranquil, atlas-grade ocean backdrop.
- **Deep Zoom Waterway Labels**: At `zoomLevel >= 4.8`, elegant muted slate-blue (`#4B7088`) serif labels gracefully appear alongside rivers (e.g., *Amazon*, *Nile*, *Danube*, *Yangtze*, *Mississippi*) and centered over freshwater lakes (e.g., *Lake Superior*, *Caspian Sea*, *Lake Baikal*, *Lake Victoria*).

### B. Library Shelves & Reading Workflow
- **Shelf Segmented Tabs**:
  - For Books: `Currently Reading (N)` · `Want to Read / TBR (N)` · `Finished (N)`
  - For Movies: `Watchlist / TBW (N)` · `Watched (N)`
- **Reading Progress Cards**: "Currently Reading" cards highlight current progress, reading start date, and a gentle "Mark as Finished" action.
- **Backlog Cards**: "Want to Read" and "Want to Watch" cards display publication year, author/director, and reasons for adding to the list.

### C. Date Ranges & Entry Form
- **Timeline Inputs**: For `travel` and `library` sections, the entry creator/editor includes start and end date pickers alongside the primary event date.
- **Duration Display**: Cards and detail modals cleanly format duration as `Oct 12 – Oct 24, 2026 · 12 days` without cluttered pill enclosures.

### D. Interactive Home Calendar Widget
- **Monthly Grid**: A 7-column calendar (Mon–Sun) with current month header and intuitive previous/next month controls.
- **Multi-Day Span Bars**: Travel trips and reading periods render as colored horizontal span ribbons across day cells:
  - Forest Sage (`#2D5A43`) for travel trips.
  - Terracotta / Amber (`#B45309`) for books currently read or finished.
- **Single-Day Activity Markers**: Discreet micro-dots for dining moments (mango gold) and photo backstories (slate blue).
- **Day Inspector Modal / Drawer**: Clicking any date reveals all journal events recorded on that day with quick click-through to open the full detail view.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Continuous Landmass vs Separate Continents**:
  - *Chosen Approach*: Merge Europe and Asia into one unified SVG path coordinate sequence while keeping accurate coastlines (Baltic, Mediterranean, Black Sea, Caspian Sea, Red Sea).
  - *Why*: Europe is a subcontinent of Eurasia, not a detached island. Drawing it separately created a jarring, artificial rift across the Ural/Caucasus region.
- **Decision 2: Calendar Placement on Home Page**:
  - *Chosen Approach*: Position the interactive calendar directly under the hero section as an anchor exploration widget, complementing the section cards below.
  - *Why*: It immediately answers "what happened recently and how has Danny spent his days?" before diving into specific vertical sections.
- **Decision 3: Storage Schema Backward Compatibility**:
  - *Chosen Approach*: Add `startDate`, `endDate`, and `status` (`'currently_reading' | 'to_read' | 'finished' | 'to_watch' | 'watched'`) as optional fields in `JournalEntry.metadata` and populate sensible defaults for existing initial entries.
  - *Why*: Ensures zero data migration loss and preserves user-created entries in `localStorage`.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App State                                 │
│  • entries: JournalEntry[] (with startDate, endDate, readingStatus)    │
│  • isOwnerMode: boolean (mango passcode protected)                     │
│  • selectedEntryForDetail / editingEntry                               │
└───────────────────┬─────────────────────────────────┬──────────────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│           HomeView                   │  │         LibraryView          │
│  • ActivityCalendar (Monthly Grid)   │  │  • Shelf Tabs:               │
│    - Date range span math            │  │    Currently Reading         │
│    - Multi-category event dots       │  │    Want to Read / Watch      │
│    - Day Inspector Popover           │  │    Finished Reviews          │
│  • Section Portals & Recents         │  │  • Card Duration Badges      │
└──────────────────────────────────────┘  └──────────────────────────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│         InteractiveMap               │  │      EntryModal Form         │
│  • Contiguous Scaled Eurasia Landmass│  │  • Exact Date Picker         │
│  • Scaled Down Ocean Typography      │  │  • Start & End Date Pickers  │
│  • Deep Zoom (≥5x) Lake/River Labels │  │    (Travel & Books)          │
│  • Collision-safe city & spot pins   │  │  • Shelf Status Selectors    │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Component & File Changes
1. `src/types.ts`:
   - Extend `JournalEntry.metadata` with `startDate?: string`, `endDate?: string`, and `readingStatus?: 'currently_reading' | 'to_read' | 'finished' | 'to_watch' | 'watched'`.
2. `src/data/initialEntries.ts`:
   - Add sample dates, start/end date ranges, and reading statuses to existing travel and book entries so the calendar and shelves come alive immediately.
3. `src/components/map/InteractiveMap.tsx`:
   - Replace separate Europe & Eurasia paths with a unified, scaled Eurasian continent path.
   - Scale down ocean label typography font size and opacity.
   - Add SVG text elements for major lakes and rivers with `opacity: zoomLevel >= 4.8 ? 1 : 0`.
4. `src/components/views/LibraryView.tsx`:
   - Add tabbed shelves for Currently Reading, Want to Read / Watch, and Finished.
   - Support updating shelf status and displaying reading durations.
5. `src/components/calendar/ActivityCalendar.tsx` (New Component):
   - Monthly grid computation (handling leap years, week start on Monday).
   - Multi-day range bar calculation for travel and reading periods.
   - Day click inspector modal to view events on that date.
6. `src/components/views/HomeView.tsx`:
   - Embed `ActivityCalendar` with responsive layout and section deep-linking.
7. `src/components/modals/EntryModal.tsx` & `EntryDetailModal.tsx`:
   - Add Start Date, End Date, and shelf status input fields to the entry editor.
   - Display trip and reading duration in the entry detail view.

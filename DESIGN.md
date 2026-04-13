# Cozyy — Design Document

> A macro-scale calendar for people who plan in months, not minutes.

---

## 1. Product Philosophy

Most calendar apps obsess over the granularity of a Tuesday afternoon. Cozyy doesn't care about your 2:30 PM. Cozyy cares about your next 6 months.

Cozyy is a **sprint-oriented timeline planner** built for students, early-career professionals, and anyone running long arcs — recruiting cycles, application seasons, semester-long projects, personal growth commitments. It visualizes life at the macro scale: months and quarters, not hours and days.

**Core tension we're solving:** Tools like Jira and Notion handle this for 200-person engineering orgs. Google Calendar handles your dentist appointment. Nothing sits in the middle for a college junior juggling IB recruiting, two club projects, and grad school apps simultaneously — and needs to *see* all of it at once without drowning in Gantt chart enterprise UX.

**Design North Star:** If a stressed-out sophomore opens this at 11 PM, they should immediately feel like they have a grip on their life. Calm, clear, forward-looking.

---

## 2. Aesthetic Direction

### Tone: **Warm Minimalism — "Studio Ghibli meets Linear"**

Not cold productivity software. Not bubbly Gen-Z chaos. Cozyy is **warm, grounded, and quietly confident** — like a well-organized desk with a candle on it.

### Typography

| Role | Font | Rationale |
|------|------|-----------|
| Display / Headings | **Fraunces** (variable, optical size) | Soft serif with personality. Feels approachable and slightly editorial without being corporate. |
| Body / UI (default) | **Libre Baskerville** | The workhorse. A warm, highly readable serif that carries the "cozy editorial" identity. Designed specifically for body text on screen — slightly wider letter-spacing and taller x-height than traditional Baskerville, so it stays crisp at small sizes. Free via Google Fonts, zero licensing friction. |
| UI Labels / Secondary | **DM Sans** (fallback sans) | Used sparingly for small UI elements where a sans-serif improves scanability — filter dropdowns, badges, date labels, button text. Keeps things legible at `11-12px` where serifs can get muddy. |
| Mono / Data | **JetBrains Mono** | For dates, countdowns, and any numerical display. Adds subtle technical credibility. |

> **Font loading note:** All fonts are free. Load Libre Baskerville and DM Sans from Google Fonts, JetBrains Mono from Google Fonts or self-hosted. Load Libre Baskerville weights `400` (regular) and `700` (bold). Use `font-display: swap` to avoid FOIT.

### Color System

```
--cozy-bg:            #FAF8F5       /* Warm off-white, the foundation */
--cozy-surface:       #FFFFFF       /* Cards and modals */
--cozy-border:        #E8E4DF       /* Subtle warm gray borders */
--cozy-text-primary:  #1A1A1A       /* Near-black, not pure black */
--cozy-text-secondary:#6B6560       /* Muted warm gray */
--cozy-text-tertiary: #A39E98       /* Hints and placeholders */

--cozy-accent:        #C15F3C       /* Warm terracotta — the signature */
--cozy-accent-hover:  #A84E30       /* Darker press state */
--cozy-accent-light:  #C15F3C1A     /* 10% opacity for subtle backgrounds */

--cozy-today:         #D94F4F       /* Today marker — assertive red */
--cozy-today-line:    #D94F4F       /* Vertical "you are here" line */

--cozy-success:       #4A9E6D       /* Checked-off / completed */
--cozy-warning:       #D4A843       /* Approaching deadlines */
--cozy-info:          #5B8FB9       /* Informational badges */
```

**Schedule bar colors** — users pick from a curated palette (default: `#C15F3C`). Suggested preset palette:

```
#C15F3C  Terracotta (default)
#5B8FB9  Slate Blue
#4A9E6D  Forest
#D4A843  Amber
#7C6DAF  Muted Purple
#C9735B  Salmon
#3D7A8A  Teal
#8B6E4E  Warm Brown
```

Bars render at **full saturation** on the roadmap. Checked-off items use `opacity: 0.4` with a `line-through` treatment.

### Visual Language

- **Rounded corners:** `8px` on cards, `6px` on buttons, `12px` on modals. Nothing sharp.
- **Shadows:** Minimal. Use `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` for elevation. Modals get slightly heavier: `0 8px 30px rgba(0,0,0,0.12)`.
- **Spacing scale:** Base unit `4px`. Use multiples: `8, 12, 16, 24, 32, 48, 64`.
- **Transitions:** `200ms ease` for hovers, `300ms cubic-bezier(0.4, 0, 0.2, 1)` for modals and state changes.
- **No harsh dividers.** Use whitespace and subtle background shifts to separate sections.

### Dark Mode (future consideration)

Not in MVP, but the color system is structured with CSS variables to make a dark theme a straightforward swap later. When implemented, lean into deep warm tones (`#1C1917` bg) rather than cold blue-blacks.

---

## 3. Information Architecture

```
Cozyy
├── Roadmap View (top 35% of viewport)
│   ├── Timeline Duration Toggle [1mo | 3mo | 6mo | 12mo]
│   ├── + Add Schedule (button)
│   ├── Schedule Bars (horizontal, stacked)
│   │   ├── Schedule label (left-anchored)
│   │   ├── Deadline/date markers (notches on bar)
│   │   └── Click → Edit Schedule Modal
│   └── Today Marker (red vertical line)
│
├── What's Ahead (bottom 60-65% of viewport)
│   ├── Filter Dropdown: [All | Deadlines | Tasks | Important Dates]
│   ├── Today Column
│   │   └── Items (checkable, with type badge)
│   ├── This Week Column
│   │   └── Items (excludes Today)
│   └── This Month Column
│       └── Items (excludes Today + This Week)
│
└── Schedule Modal (overlay)
    ├── Mandatory: Title, Date Range, Color
    └── Optional: Description, Tasks, Deadlines, Important Dates
```

---

## 4. Component Specifications

### 4.1 Roadmap View

**Layout:** Full-width horizontal band. Fixed to top of main content area (not sticky-scrolling — it's always visible as the anchor). Height: `35vh`, min `280px`, max `400px`.

**Timeline Header:**
- Duration toggle pills: `1M | 3M | 6M | 12M` — pill-style selector, active state uses `--cozy-accent`.
- Current range displayed as text: e.g., "Jan 2026 — Jun 2026"
- `+ Add Schedule` button: right-aligned, accent-colored, subtle.

**Timeline Grid:**
- Alternating month/week stripes using very subtle background bands (`rgba(0,0,0,0.02)` alternating with transparent).
- Month labels along the top edge.
- **1M view:** Stripes per week. Day numbers visible.
- **3M view:** Stripes per 2-week interval. Month labels prominent.
- **6M view:** Stripes per month.
- **12M view:** Stripes per month, more compressed.

**Schedule Bars:**
- Horizontal bars, stacked vertically. Each bar has:
  - **Color fill** matching the user's chosen schedule color.
  - **Left-anchored label** — schedule title in white (or dark text on light bars), truncated with ellipsis if needed. Rendered *inside* the bar if bar width allows, or as a floating label to the left if the bar starts off-screen.
  - **Notch markers** for deadlines and important dates — small vertical ticks or diamond shapes on the bar at the correct date position. Hovering a notch shows a tooltip with the item name and date.
  - **Click interaction:** Clicking anywhere on a bar opens the Edit Schedule Modal.
- If bars overlap vertically (i.e., concurrent schedules), they stack. No limit on stacking, but the roadmap area scrolls vertically if > 6 bars are visible.

**Today Marker:**
- Vertical line: `2px solid var(--cozy-today)`.
- Small label above: "Today" in `--cozy-today` color, `font-size: 11px`.
- Extends full height of the roadmap area.
- If today falls outside the visible range, show a subtle arrow indicator at the nearest edge.

### 4.2 What's Ahead

**Layout:** Below the roadmap. Three-column layout on desktop (`grid-template-columns: 1fr 1fr 1fr`), stacking to single column on mobile with tab navigation.

**Column Headers:**
- "Today" / "This Week" / "This Month"
- Subtext showing the date range: e.g., "Apr 12" / "Apr 13–18" / "Apr 19–30"
- Item count badge.

**Items are exclusive:** Today items don't appear in This Week. This Week items don't appear in This Month.

**Filter Dropdown:**
- Positioned above the three columns, right-aligned.
- Options: All (default), Deadlines, Tasks, Important Dates.
- Single select dropdown. Filters all three columns simultaneously.

**Item Cards:**

Each item is a small card containing:
- **Type indicator:** Small colored badge or icon.
  - 🔴 Deadline — uses `--cozy-today` tint
  - ☑️ Task — uses `--cozy-text-secondary` tint
  - 📌 Important Date — uses `--cozy-warning` tint
- **Item title** — primary text.
- **Schedule name** — secondary text, colored to match the schedule bar.
- **Date** (if not obvious from column context) — tertiary text.
- **Check-off interaction:**
  - Hover: subtle highlight, cursor pointer.
  - Click: draws a `line-through` on the title, reduces card opacity to `0.4`, adds a subtle checkmark icon. Transition: `300ms ease`.
  - Checked items sink to the bottom of their column, below unchecked items.
  - State persists. No delete — items remain visible but muted.

**Empty States:**
- If a column is empty: "Nothing here — enjoy the breathing room." in `--cozy-text-tertiary`.

### 4.3 Schedule Modal

**Trigger:** `+ Add Schedule` button OR clicking an existing bar.

**Appearance:** Centered overlay modal with backdrop blur (`backdrop-filter: blur(8px)`) and semi-transparent dark overlay. Modal width: `560px` max, responsive down to full-screen on mobile.

**Animation:** Fade-in + slight scale-up (`transform: scale(0.97)` → `scale(1)`, `opacity: 0` → `1`, `300ms`).

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | Text input | ✅ | Max 80 chars. Placeholder: "e.g., IB Recruiting 2027" |
| Date From | Date picker | ✅ | Calendar dropdown. No time selection. |
| Date To | Date picker | ✅ | Must be after Date From. |
| Color | Color swatches | ✅ | Preset palette (see §2). Default: `#C15F3C`. |
| Description | Textarea | ❌ | Max 500 chars. Collapsible section. |
| Deadlines | Repeatable item group | ❌ | See sub-item spec below. |
| Tasks | Repeatable item group | ❌ | See sub-item spec below. |
| Important Dates | Repeatable item group | ❌ | See sub-item spec below. |

**Sub-item spec (Deadlines / Tasks / Important Dates):**

Each is an expandable section with a `+ Add` button. Each sub-item has:
- **Name** — text input.
- **Date** — date picker (must fall within schedule date range for deadlines/dates; optional for tasks).
- **Recurrence toggle** — None (default), Daily, Weekly, Biweekly, Monthly. If recurring, auto-generates instances within the schedule date range.
- **Delete** — small `×` button per item.

**Edit Mode:**
- When opened from an existing bar, all fields pre-populate.
- A `Delete Schedule` button appears at the bottom in `--cozy-today` color with a confirmation step ("Are you sure? This can't be undone.").

**Actions:**
- `Save` — accent-colored primary button. Validates required fields.
- `Cancel` — ghost button.
- Click outside modal or press `Esc` to close (with unsaved changes warning if dirty).

---

## 5. Interaction Patterns

### Navigation
- **No page routing in MVP.** Single-page app. Everything lives on one screen. The roadmap and What's Ahead are the entire experience.
- Duration toggle (1M/3M/6M/12M) is the primary navigation mechanism.

### Keyboard Shortcuts (nice-to-have for MVP)
- `N` — New schedule
- `Esc` — Close modal
- `1/3/6/9` — Switch timeline duration (9 for 12M to avoid conflict)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| `>1024px` | Full layout: roadmap top, 3-column What's Ahead below |
| `768–1024px` | Roadmap slightly compressed, What's Ahead becomes 2-column (Today + This Week side-by-side, This Month below) |
| `<768px` | Roadmap becomes horizontally scrollable. What's Ahead becomes tabbed single-column (Today / This Week / This Month tabs) |

### Scroll Behavior
- Roadmap stays pinned at the top of viewport on scroll (becomes sticky once the page scrolls past any potential header/nav).
- What's Ahead scrolls naturally.

---

## 6. Data Model (MVP)

```
Schedule {
  id:          UUID
  title:       string (max 80)
  description: string (max 500, nullable)
  date_from:   date
  date_to:     date
  color:       string (hex)
  created_at:  timestamp
  updated_at:  timestamp
}

ScheduleItem {
  id:          UUID
  schedule_id: FK → Schedule
  type:        enum [deadline, task, important_date]
  title:       string (max 120)
  date:        date (nullable for non-recurring tasks)
  recurrence:  enum [none, daily, weekly, biweekly, monthly]
  checked:     boolean (default false)
  created_at:  timestamp
}
```

For MVP, this can be entirely **client-side** using `localStorage` or IndexedDB. No backend needed to validate the core UX. When user-submitted schedules arrive (post-MVP), this migrates to a proper backend with user auth.

---

## 7. Post-MVP: User-Submitted Schedules

Not in scope for build, but the design should not paint us into a corner.

**Concept:** Users can publish their schedules as templates. Other users can browse, preview, and one-click import them.

**Design Implications for MVP:**
- The `Schedule` data model already captures everything needed for a template. A future `Template` model is essentially a `Schedule` with author metadata and a `public` flag.
- The modal structure should be exportable — "Share as Template" becomes a future button in the edit modal.
- Color choices should remain user-editable on import (you don't want 50 users all with identical terracotta bars).

**Future UI Surface:**
- A "Browse Templates" section or separate page.
- Template cards with: title, author, date range, description preview, item count, "Add to My Calendar" CTA.
- Profile pages for template creators (the finance influencer use case).

---

## 8. Technical Recommendations

### Stack (suggested)
- **Framework:** React (Vite) or Next.js — component model fits naturally.
- **Component System:** **shadcn/ui** — the right call here. Unstyled Radix primitives under the hood, but you own every line of CSS. This matters because Cozyy's aesthetic is specific enough that a pre-styled library (MUI, Chakra) would fight you constantly. shadcn gives you the accessibility and interaction logic for free (modals, dropdowns, date pickers, toggles) while letting Tiempos Text and the warm palette shine through without override hell. Install only what you need: `Dialog`, `DropdownMenu`, `Popover`, `Calendar`, `Toggle`, `Button`, `Input`, `Textarea`, `Badge`.
- **Styling:** Tailwind CSS + CSS variables for the token system. shadcn is built on Tailwind, so this is a natural pairing. Override shadcn's default `--radius`, `--primary`, `--foreground` etc. with the Cozyy token values from §2 in your `globals.css`.
- **State:** Zustand or React Context for MVP. Dead simple, no over-engineering.
- **Storage (MVP):** localStorage with JSON serialization. Wrap in a service layer so swapping to an API later is a one-file change.
- **Date handling:** `date-fns` — lightweight, tree-shakeable, no Moment.js bloat. Also powers shadcn's `Calendar` component natively.
- **Deployment:** Vercel. Zero-config for React/Next.

### shadcn/ui Customization Notes

shadcn components need to be reskinned to match the Cozyy identity. Key overrides:

```css
/* globals.css — override shadcn's CSS variable defaults */
:root {
  --background:    36 33% 97%;     /* #FAF8F5 in HSL */
  --foreground:    0 0% 10%;       /* #1A1A1A */
  --primary:       16 53% 50%;     /* #C15F3C */
  --primary-foreground: 0 0% 100%; /* White text on accent */
  --muted:         25 8% 64%;      /* #A39E98 */
  --border:        30 12% 89%;     /* #E8E4DF */
  --radius:        0.5rem;         /* 8px — matches Cozyy's rounded corners */
  --font-sans:     'Libre Baskerville', Georgia, serif;  /* Yes, the "sans" var is a serif. shadcn uses this as the default body font variable. */
}
```

- **Dialog** → Schedule Modal. Use `DialogContent` with custom max-width `560px`.
- **Calendar** → Date pickers in the modal. Restyle the day cells to use Tiempos numerals.
- **DropdownMenu** → Filter selector for What's Ahead.
- **Toggle / ToggleGroup** → Timeline duration switcher (1M/3M/6M/12M).
- **Badge** → Item type indicators (Deadline, Task, Important Date).
- **Button** → All CTAs. Primary = accent fill, secondary = ghost/outline.

### Performance Considerations
- The roadmap canvas with many overlapping bars could get heavy. For MVP with <20 schedules, DOM-based rendering (divs positioned absolutely) is fine. If it scales past that, consider `<canvas>` or a virtualized approach.
- Recurring item generation should be computed and cached, not recalculated on every render.

---

## 9. What's Explicitly Out of Scope (MVP)

To keep the build tight:

- ❌ Time-of-day scheduling (by design philosophy — this isn't Google Calendar)
- ❌ Location fields
- ❌ Video call / collaboration integrations
- ❌ User accounts / authentication
- ❌ Backend / API
- ❌ User-submitted schedule marketplace
- ❌ Dark mode
- ❌ Mobile native apps
- ❌ Notifications / push reminders (requires backend)
- ❌ Drag-and-drop schedule resizing (cool but not MVP)
- ❌ Multi-calendar / shared calendars

---

## 10. Success Metrics (for self-evaluation)

Since this is a student/personal project initially, here's how to know the MVP is working:

1. **5-second test:** Can someone look at the roadmap and understand what's going on in their life within 5 seconds?
2. **Schedule creation < 60 seconds:** Adding a new schedule with 3-4 deadlines should feel fast, not like filling out a tax form.
3. **"I actually use this":** If you find yourself opening Cozyy instead of checking Notion or a spreadsheet to see what's coming up — it's working.
4. **Template virality signal:** If someone screenshots their roadmap view and shares it — the visual design is doing its job.

# ClockRail / Mind Mapping App — Implementation Roadmap

## 1. Sprint Objective

Build the complete ClockRail web app as a deployable frontend product, excluding all AI integration.

This sprint should produce a polished, working app that:
- accepts text input
- generates a deterministic clock-based map
- allows segment editing
- supports presentation mode
- persists drafts locally
- looks and feels production-ready
- is ready for Vercel deployment

---

## 2. Scope of This Sprint

### Included
- frontend app structure
- deterministic text segmentation
- keyword extraction using rules
- icon assignment from a built-in library
- radial clock layout
- editable segment cards
- presentation mode
- responsive styling
- local persistence
- production build readiness
- Vercel deployment readiness

### Excluded
- AI text analysis
- AI-generated icon or image suggestions
- external model/API integration
- login/accounts
- cloud sync
- collaboration
- PDF export unless it becomes trivial later and is clearly non-AI

---

## 3. Roadmap Milestones

### Milestone 1 — Product Foundation
Goal: establish the app shell, structure, and visual system.

Deliverables:
- stable app layout
- dark premium theme
- responsive base styling
- core component boundaries
- base data types

### Milestone 2 — Deterministic Generation Engine
Goal: convert input text into usable segments without AI.

Deliverables:
- segmentation utility
- keyword extraction utility
- icon mapping utility
- preview generation utility
- layout position utility

### Milestone 3 — ClockRail Visualization
Goal: render the circular memory map.

Deliverables:
- clock face
- center topic node
- segment cards around the circle
- active segment highlighting
- responsive placement logic

### Milestone 4 — Editing and Review
Goal: allow user customization.

Deliverables:
- edit keyword
- edit segment text
- cycle icons
- update topic title
- live UI refresh on edit

### Milestone 5 — Presentation Mode
Goal: support rehearsing and presenting from the map.

Deliverables:
- fullscreen/presentation-like view
- next/previous navigation
- progress state
- keyboard support
- active segment focus state

### Milestone 6 — Persistence and Polish
Goal: make the app feel complete and durable.

Deliverables:
- localStorage draft persistence
- reset / new session behavior
- polished interactions
- responsive refinements
- final visual cleanup

### Milestone 7 — Build and Deployment
Goal: verify production readiness and prepare for Vercel.

Deliverables:
- successful production build
- lint/build verification
- deployment configuration check
- final Vercel-ready output

---

## 4. File-by-File Implementation Plan

## 4.1 `src/types.ts`
Purpose:
- central type definitions for the app

Responsibilities:
- define `Segment`
- define app state models
- define layout and generation result types

Expected exports:
- `Segment`
- `GenerationResult`
- `PresentationState`
- optional `LayoutMode` later if needed

---

## 4.2 `src/data/iconLibrary.ts`
Purpose:
- hold the built-in icon set for deterministic mapping

Responsibilities:
- export a reusable icon dictionary
- map keywords or concepts to emoji/icon strings
- keep the library easy to extend

Expected exports:
- `iconLibrary`
- helper for lookup by keyword or fallback

---

## 4.3 `src/utils/segmentText.ts`
Purpose:
- convert raw input text into content blocks

Responsibilities:
- split by paragraph breaks
- fall back to sentence grouping
- normalize segment count for the clock layout
- return ordered segment candidates

Expected exports:
- `parseTextIntoSegments`
- `combineSegments`
- `splitLongSegments`

---

## 4.4 `src/utils/extractKeyword.ts`
Purpose:
- generate short recall labels for each segment

Responsibilities:
- remove common stop words
- pick short meaningful phrases
- trim punctuation
- keep keywords concise and memorable

Expected exports:
- `extractKeyword`

---

## 4.5 `src/utils/assignIcon.ts`
Purpose:
- assign a visual cue to each segment

Responsibilities:
- search the icon library for matching terms
- use a deterministic fallback when no keyword match is found
- keep icon assignment stable for the same text

Expected exports:
- `assignIcon`

---

## 4.6 `src/utils/segmentPreview.ts`
Purpose:
- generate short readable preview text for each segment

Responsibilities:
- trim text to a manageable length
- append ellipsis if needed
- keep preview length consistent

Expected exports:
- `createPreview`

---

## 4.7 `src/utils/layoutClock.ts`
Purpose:
- calculate circular placement for segment cards

Responsibilities:
- calculate angle positions
- calculate x/y placement around the center
- support responsive radius adjustments
- support different segment counts

Expected exports:
- `getClockPositions`
- optional helpers for angle conversion and radius logic

---

## 4.8 `src/utils/storage.ts`
Purpose:
- save and restore drafts locally

Responsibilities:
- read/write localStorage
- serialize app state
- safely handle missing or invalid stored data

Expected exports:
- `loadDraft`
- `saveDraft`
- `clearDraft`

---

## 4.9 `src/components/AppShell.tsx`
Purpose:
- overall page shell and layout wrapper

Responsibilities:
- render top-level structure
- provide background/ambient visual wrappers
- organize sections consistently

Expected exports:
- `AppShell`

---

## 4.10 `src/components/TopBar.tsx`
Purpose:
- render the brand header and actions

Responsibilities:
- show brand name
- show new/reset action
- show present action
- provide consistent top navigation

Expected exports:
- `TopBar`

---

## 4.11 `src/components/InputPanel.tsx`
Purpose:
- accept pasted text and trigger generation

Responsibilities:
- text area input
- character count
- generate action
- optional reset/new draft action

Expected exports:
- `InputPanel`

---

## 4.12 `src/components/ClockRail.tsx`
Purpose:
- render the circular segment visualization

Responsibilities:
- render the center node
- place segments around the circle
- show active state
- support click selection

Expected exports:
- `ClockRail`

---

## 4.13 `src/components/SegmentCard.tsx`
Purpose:
- render one segment in the clock map

Responsibilities:
- display icon
- display keyword
- display preview
- handle active / inactive state
- handle click selection

Expected exports:
- `SegmentCard`

---

## 4.14 `src/components/EditorPanel.tsx`
Purpose:
- allow segment editing

Responsibilities:
- edit keyword
- edit text
- cycle icon
- update topic title
- trigger immediate updates

Expected exports:
- `EditorPanel`

---

## 4.15 `src/components/PresentationMode.tsx`
Purpose:
- provide the presentation / rehearsal UI

Responsibilities:
- show current segment
- show current progress
- allow next / previous controls
- support keyboard navigation
- make the active cue obvious

Expected exports:
- `PresentationMode`

---

## 4.16 `src/components/Toast.tsx` or `src/components/Notification.tsx`
Purpose:
- show lightweight feedback such as saved state or updates

Responsibilities:
- display transient messages
- support success/info feedback

Expected exports:
- `Toast` or `Notification`

---

## 4.17 `src/App.tsx`
Purpose:
- coordinate the full application

Responsibilities:
- store the main app state
- call generation utilities
- manage active segment
- coordinate editing and presentation
- load and save local drafts
- pass state to child components

Expected exports:
- default `App`

---

## 4.18 `src/App.css`
Purpose:
- main app styling

Responsibilities:
- layout styles
- theme styling
- clock visuals
- responsive behavior
- component styling if not split further

---

## 4.19 `src/index.css`
Purpose:
- global base styling

Responsibilities:
- reset base spacing
- define root font smoothing
- establish base color behavior
- set global defaults

---

## 4.20 `src/main.tsx`
Purpose:
- application entry point

Responsibilities:
- render `App`
- attach root to DOM

---

## 5. Build Order by File Dependencies

Recommended implementation sequence:

1. `src/types.ts`
2. `src/data/iconLibrary.ts`
3. `src/utils/segmentText.ts`
4. `src/utils/extractKeyword.ts`
5. `src/utils/assignIcon.ts`
6. `src/utils/segmentPreview.ts`
7. `src/utils/layoutClock.ts`
8. `src/utils/storage.ts`
9. `src/components/SegmentCard.tsx`
10. `src/components/ClockRail.tsx`
11. `src/components/InputPanel.tsx`
12. `src/components/EditorPanel.tsx`
13. `src/components/PresentationMode.tsx`
14. `src/components/TopBar.tsx`
15. `src/components/AppShell.tsx`
16. `src/App.tsx`
17. `src/App.css`
18. `src/index.css`
19. `src/main.tsx` if needed for integration cleanup
20. production build verification

---

## 6. Testing Milestones

### Milestone A — Utility Testing
Check that:
- text segmentation works
- keywords are readable
- icons are assigned consistently
- preview text is correct
- layout positions are valid

### Milestone B — UI Testing
Check that:
- the clock renders correctly
- clicking segments updates active state
- editing updates the map
- layout remains readable at smaller sizes

### Milestone C — Presentation Testing
Check that:
- next and previous navigation work
- keyboard shortcuts work
- active state is clear
- the UI remains legible in presentation mode

### Milestone D — Persistence Testing
Check that:
- data is saved to localStorage
- data reloads correctly
- reset clears the draft

### Milestone E — Production Testing
Check that:
- the app builds successfully
- no lint errors remain
- the output is deployable to Vercel

---

## 7. Deployment Notes

### Vercel Readiness
The app should remain compatible with:
- standard Vite production build
- static frontend deployment

### Final Output
The final sprint should end with:
- a buildable app
- a clean `dist` output
- a Vercel-ready deployment path

---

## 8. AI Policy for This Sprint

AI integration is intentionally excluded from this sprint.

That means:
- no AI API calls
- no external model dependency
- no AI prompt orchestration
- no AI-driven segmentation

The entire map generation flow should be deterministic and local for now.

---

## 9. Summary

This roadmap turns the documentation into a concrete build plan. The sprint should proceed from data model to utilities, to UI components, to state coordination, to persistence, and finally to production deployment readiness — all without AI integration.

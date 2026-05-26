# Phase 2B: Fullscreen + Responsive Fit-First Presentation

## Goal

Improve presentation control while making every map surface reliably visible and legible across editor, presentation, companion, and mobile contexts.

## Scope

- add fullscreen controls for the active map surface
- support `F` hotkey outside typing contexts
- auto-attempt fullscreen when launching Companion mode
- keep presentation usable if fullscreen is denied or unsupported
- refactor shared map framing so Clock, Grid, and Linear expose consistent controls
- shift responsive behavior to fit-first sizing instead of desktop-biased minimums
- ensure Clock view never clips nodes, numerals, or topic banner at the edges
- compact mobile chrome to prioritize the map itself

## Deliverables

### Fullscreen control
- icon-only fullscreen toggle in the map header
- same control available in presentation shell header
- browser fullscreen state kept in sync with app UI

### Fit-first surfaces
- shared map-frame wrapper for all map views
- active map surface can enter fullscreen without expanding the entire app shell
- responsive surface sizing for normal editor and presentation contexts

### Clock visibility refinement
- radius and node placement derived from live container bounds
- smaller mobile-safe node, hub, and orbit calculations
- shorter hands and tighter rings on narrow screens
- top topic banner preserved without clipping

### Mobile compaction
- tighter map headers
- reduced helper text footprint
- denser status rail
- smaller padding and spacing around the canvas

## Acceptance Criteria

- Clock, Grid, and Linear can enter and exit fullscreen from the top-right control
- `F` toggles fullscreen unless focus is inside editable content
- Companion mode attempts fullscreen automatically and degrades gracefully if blocked
- Clock view remains fully visible on narrow mobile widths with no node clipping
- Presentation and Companion reuse the same fit logic as the main editor view
- Existing generation, editing, icon selection, presentation navigation, and PDF export still work

## Notes

- fullscreen scope is the current map surface only
- mobile strategy is scale-to-fit, not pan-and-zoom
- preserving whole-map visibility takes priority over showing maximum text length on very small screens

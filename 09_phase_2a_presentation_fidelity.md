# Allison's Memory ClockRay - Phase 2A

## Presentation Fidelity + Wall-Clock UI Sprint

### 1. Sprint Goal

Upgrade the Clock view into a true wall-clock interaction surface while preserving the current AI generation and editing workflow.

This phase focuses on:
- visual fidelity of the core clock metaphor
- presentation and rehearsal usability
- companion-first delivery polish

### 2. Scope

#### Included
- full `1-12` numeral ring around the clock face
- active-tracking long/minute and short/hour hands
- top-mounted topic banner on the clock stage
- center hub conversion to clock pivot metadata
- companion presentation variant with stronger active-node focus
- keyboard expansion in presentation (`Arrow`, `Space`, `PageUp`, `PageDown`, `Esc`)
- responsive tuning for `3, 4, 6, 8, 12` nodes

#### Deferred
- audience split-view URL
- clicker hardware SDK integration
- backend API changes

### 3. Interface and Type Changes

- `ClockRay` now supports `variant?: 'default' | 'companion'`
- `PresentationState` now includes `mode: 'standard' | 'companion'`
- new pure utility contract for deterministic hand logic:
  - `getClockHourSlotForIndex(index, segmentCount)`
  - `getClockDegreesForHourSlot(hourSlot)`
  - `getClockHandAngles(activeIndex, segmentCount)`

### 4. UX Behavior

- Numeral ring remains fixed and complete (`1-12`) regardless of segment count.
- Node hour labels map to explicit clock hour slots.
- Minute hand points to active node slot.
- Hour hand advances in coarse 12-step buckets based on progress.
- Companion variant visually dims non-active nodes/connectors and amplifies active focus.

### 5. Acceptance Checklist

- Numeral ring appears for all supported segment counts.
- Topic appears as a top banner; center no longer contains full topic text.
- Selecting any node updates both clock hands.
- Companion mode can be launched from top actions.
- Presentation keyboard controls include `PageUp/PageDown`.
- Grid and Linear views remain unchanged functionally.
- AI generation and PDF export continue to work.

### 6. Notes

Phase 1 docs remain valid as implementation history. Phase 2A is the first presentation-first expansion pass on top of the post-MVP codebase that already includes AI analysis and export.

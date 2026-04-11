# Allison's Memory ClockRail — Technical Notes

## 1. Purpose of This Document

This document records the practical technical assumptions and implementation notes needed to build the ClockRail app in a clean, maintainable way.

It is meant to support the transition from product documentation into actual implementation.

---

## 2. Recommended Technical Direction

The current project already uses:
- React
- TypeScript
- Vite

This is a strong base for the frontend showcase and early MVP work because it provides:
- fast development
- component-based structure
- TypeScript safety
- easy browser-based testing
- good support for animations and state-driven UI

---

## 3. Frontend Architecture Notes

### Suggested Structure
The app should be organized into:
- top-level application shell
- input or generation panel
- clock visualization container
- segment editor panel
- presentation mode panel or overlay
- shared UI components
- utility functions for segmentation and layout calculations

### Why This Structure Works
The ClockRail product has multiple modes and visual states. Separating the app into clear UI regions will make it easier to maintain and expand later.

---

## 4. State Management Notes

### Expected State Categories
The application will likely need to store:
- raw input text
- generated segment list
- selected active segment
- overall topic title
- edited keywords
- segment icons or visual cues
- presentation mode state
- local saved draft state

### Implementation Approach
For the MVP:
- local component state is acceptable for smaller pieces
- shared app state can be lifted into the main app component or a lightweight global store later

### Why This Matters
The app is interaction-heavy, so state should be organized carefully even before introducing a formal global store.

---

## 5. Segmentation Logic Notes

### Basic Strategy
The segmentation engine should:
1. detect paragraphs
2. if needed, split by sentence groups
3. merge or split segments to stay within the clock-friendly range
4. produce clean segment objects for the UI

### Segment Object Shape
A segment can reasonably contain:
- `id`
- `text`
- `keyword`
- `icon`
- `preview`
- optional `order`
- optional `colorTone`

### Important Constraint
The generated segments should be readable enough for presentation and memorable enough for recall.

---

## 6. Layout and Visualization Notes

### ClockRail Layout
The circular layout should use:
- a center topic node
- radial positioning of segments around the center
- consistent spacing around the circle
- visual emphasis on the selected segment

### Layout Calculation Considerations
The app may need utility functions for:
- computing angles
- placing nodes around a circle
- adjusting radius by screen size
- scaling visual density based on segment count

### Future Upgrade Path
Later versions may replace simple layout math with more advanced drag-and-drop or canvas/SVG rendering.

---

## 7. Styling and UI System Notes

### Visual Direction
The interface should feel:
- dark
- premium
- polished
- modern
- presentation-ready

### UI Styling Approach
The current visual direction can be built with:
- custom CSS
- CSS variables for color tokens
- panel-based layout
- soft gradients
- translucent surfaces
- strong typography hierarchy

### UI Goal
The clock should always be the most important visual element.

---

## 8. Animation Notes

### Recommended Animation Use
Animation should support:
- segment entrance
- segment selection
- presentation transitions
- panel reveal or fade
- state changes during editing

### Implementation Considerations
Use modest animations that improve clarity without distracting from the memory-map purpose.

---

## 9. Responsiveness Notes

### Priority Devices
The first target should be:
- desktop
- tablet

### Responsive Behavior
The UI should:
- collapse side-by-side panels on smaller screens
- scale the clock visualization safely
- keep controls accessible
- avoid visual crowding

### Constraint
The circular layout must remain understandable even when resized.

---

## 10. Persistence Notes

### MVP Persistence
The app may persist data locally in the browser using:
- localStorage
- session state
- optional draft save logic

### Stored Data Candidates
- raw content
- generated segment list
- edited labels
- icon choices
- topic title
- presentation preferences

### Why This Matters
Users should not lose work while editing or practicing.

---

## 11. Export Notes

### Not Required Immediately
Export is not a required part of the current showcase or MVP stage.

### Likely Future Export Methods
- image generation via canvas or SVG
- PDF generation
- printable sheet output

### Technical Consideration
Export will likely require a separate pipeline from the screen-rendered UI.

---

## 12. Backend Notes for Later Phases

### Not Required for the Current Showcase
The current stage can remain frontend-only.

### Likely Future Backend Needs
- content processing API
- AI segmentation endpoint
- user account storage
- saved project history
- export generation service

### Suggested Future Stack Direction
When backend work begins, a TypeScript-friendly server stack will likely be easiest to maintain alongside the current frontend.

---

## 13. Recommended Implementation Order

1. define data model and segment shape
2. build input and generation flow
3. build circular clock visualization
4. add editing controls
5. add presentation mode
6. add local persistence
7. improve styling and motion
8. add export support later
9. add backend and AI later if needed

---

## 14. Risks and Constraints

### Risks
- overcrowding the circle with too many segments
- weak keyword extraction
- visuals that look decorative instead of mnemonic
- poor responsive scaling
- overly complex future expansion

### Constraints
- the app must stay easy to use
- the clock metaphor must remain central
- the MVP should stay simple and presentation-focused

---

## 15. Summary

The ClockRail app is best implemented as a React + TypeScript frontend with clear component boundaries, local state for early versions, and a carefully managed circular layout. The technical design should prioritize clarity, memory support, and easy expansion into AI, export, and cloud features later.

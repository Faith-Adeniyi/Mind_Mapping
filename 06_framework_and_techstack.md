# ClockRail / Mind Mapping App — Framework and Tech Stack

## 1. Purpose of This Document

This document defines the framework and technology stack used for the ClockRail project and explains why each choice fits the product.

It is intended to keep the implementation aligned with the product vision and to prevent unnecessary technology drift.

---

## 2. Core Frontend Framework

### Chosen Framework
- **React**
- **TypeScript**
- **Vite**

### Why This Choice Fits
This stack is well suited for ClockRail because:
- it supports fast UI iteration
- it works well for interactive single-page experiences
- it gives strong typing for complex segment data
- it is lightweight and easy to build on top of
- it is already installed in the current project

### Role in the Product
This stack will power:
- the input interface
- the circular clock visualization
- the editing controls
- presentation mode
- responsive layout behavior

---

## 3. Styling System

### Recommended Styling Approach
- custom CSS
- CSS variables for theme tokens
- modular component styling
- responsive media queries
- gradient and glass-style visual treatment

### Why This Fits
ClockRail needs a premium visual identity. A flexible CSS-based approach makes it easier to:
- create the dark presentation style
- control the circular layout precisely
- support responsive behavior
- keep the clock visually dominant

### Current Direction
The current implementation should prioritize:
- dark theme
- layered panels
- strong contrast
- soft glow effects
- clean typography

---

## 4. Component Model

### Recommended Component Direction
React components should be used to split the product into clear UI pieces such as:
- application shell
- top bar
- input panel
- clock visualization
- segment cards
- editor panel
- presentation overlay
- reusable buttons and badges

### Why This Fits
The product has multiple distinct UI sections. A component-based structure keeps each part maintainable and easier to expand.

---

## 5. State Management Approach

### MVP Approach
For the current stage:
- local React state is sufficient for small app sections
- shared state can be lifted into the main app component
- a global store is not required immediately

### Future Option
If the app grows in complexity:
- lightweight state management can be added later
- persistent state or global store can be introduced if needed

### Why This Fits
The MVP and showcase are interaction-driven but still small enough to avoid unnecessary overhead.

---

## 6. Data Handling Strategy

### Core Data Shape
The app should work with a `segment` object that includes:
- id
- text
- keyword
- icon
- preview
- order or position metadata
- optional visual tone

### Supporting Data
The app should also manage:
- raw input text
- topic title
- active segment index
- presentation state
- local saved draft data

### Why This Fits
This model is simple, expressive, and easy to transform into the clock visualization.

---

## 7. Animation and Motion

### Recommended Tools
- CSS transitions
- CSS keyframe animations
- optional future use of Framer Motion if richer motion is needed

### Why This Fits
ClockRail needs motion, but the animation should remain light and clear. Simple motion is enough for:
- segment emphasis
- content reveal
- presentation mode transitions
- active state changes

---

## 8. Visualization Technology

### Current Recommendation
The circular clock UI can be built using:
- standard React DOM layout
- CSS absolute positioning
- transform-based radial placement

### Future Upgrade Paths
If needed later:
- SVG rendering
- Canvas rendering
- advanced drag-and-drop libraries
- more complex layout engines

### Why This Fits
The MVP should stay simple and easy to debug, while still allowing future visual upgrades.

---

## 9. Persistence and Storage

### Current Recommendation
- browser localStorage for drafts and simple persistence

### Why This Fits
The app should not lose user work during edits or rehearsals, but it does not yet need a backend database.

### Future Upgrade Path
Later versions may add:
- cloud storage
- user accounts
- project history
- sync across devices

---

## 10. Backend and API Direction

### Current Stage
The current project can remain frontend-only for the showcase and MVP prototype work.

### Future Backend Candidates
A backend may later be used for:
- AI processing
- file uploads
- export generation
- saved projects
- account management

### Why This Fits
Separating frontend and backend now keeps the current build focused, while leaving room for scale later.

---

## 11. Suggested Supporting Libraries

These are optional future additions, not requirements for the current stage:
- Framer Motion for richer animation
- Zustand for lightweight app state
- Prisma for database access if backend persistence is introduced
- Supabase or PostgreSQL for storage
- PDF export library for document output

---

## 12. Current Project Fit

The current project already matches the chosen direction because it is built with:
- React
- TypeScript
- Vite

This gives a strong base for:
- building the showcase UI
- iterating quickly
- testing the layout in the browser
- expanding toward the MVP later

---

## 13. Recommended Stack Summary

### Current Core Stack
- React
- TypeScript
- Vite
- CSS

### Optional Growth Stack
- Framer Motion
- Zustand
- localStorage
- Supabase or PostgreSQL
- Prisma
- PDF export tooling

---

## 14. Final Recommendation

Use React + TypeScript + Vite as the foundation, keep styling in CSS for precise control, and add supporting tools only when the product needs them. This keeps ClockRail fast, maintainable, and visually strong while preserving a clean path to future features.

---

## 15. Summary

The framework and tech stack for ClockRail should prioritize speed, clarity, and visual control. The current React + TypeScript + Vite setup is the right base for the product, and the rest of the stack should be added only when the product requirements justify it.

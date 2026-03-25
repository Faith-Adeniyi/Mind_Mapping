# ClockRail / Mind Mapping App — Feature Breakdown

## 1. Purpose of This Document

This document breaks the product into functional feature groups so each part of the app can be built, tested, and expanded in a controlled way.

The purpose is to define:
- what each feature does
- how the feature should behave
- what rules it must follow
- what data it needs
- how it supports the overall ClockRail experience

---

## 2. Feature Group: Content Input

### Description
The app must allow the user to input content that will later be turned into a visual memory map.

### Supported Input Types
- pasted plain text
- written notes
- lecture or speech text
- presentation content
- project summaries

### Required Behavior
- accept long-form content
- show character or content length feedback
- allow reset or replacement of the current content
- preserve user input while editing until the user regenerates the map

### Notes
This input is the source material for all downstream segmentation and visualization.

---

## 3. Feature Group: Segmentation Engine

### Description
This feature divides the input into meaningful content blocks.

### Core Rules
- segments should represent logical chunks
- chunking should support memory and presentation flow
- content should not create too many tiny fragments
- the system should try to keep segment count within the clock-friendly range

### Suggested Segmentation Strategy
1. detect paragraph breaks first
2. if paragraphs are too few, split by sentence groups
3. if content is too long, merge adjacent small segments
4. if content is too short, split longer segments where necessary

### Output of This Feature
Each segment should contain:
- a unique id
- full text content
- a short keyword
- an icon or visual cue
- a preview string
- optional metadata for ordering or grouping

---

## 4. Feature Group: ClockRail Visualization

### Description
This is the main visual interface of the app.

### Layout Rules
- display content in a circular or radial structure
- arrange segments clockwise
- reserve the center for the main topic or title
- keep the outer ring readable and balanced
- support a maximum of 12 major positions in the classic clock mode

### Visual Structure
- central topic node
- outer segment nodes/cards
- optional markers or numbers for reference
- connection styling toward the center or between segments
- active/highlight state for the selected segment

### Design Principles
- the clock shape must be obvious immediately
- the layout must feel stable, not chaotic
- each segment should be visually distinct
- the display should remain legible at presentation distance

---

## 5. Feature Group: Visual Anchors

### Description
Every segment needs a memory cue that helps the user remember its meaning.

### Required Anchor Types
- emoji icon
- symbolic icon
- object representation
- image placeholder or uploaded image in future phases

### Anchor Behavior
- each segment should have exactly one primary anchor in the MVP
- the anchor must be editable
- the anchor should be visually strong enough to trigger recall quickly

### Memory Rule
The anchor should not be decorative only. It must support recall of the text segment.

---

## 6. Feature Group: Keywords and Labels

### Description
Each segment should have a short memory label.

### Keyword Rules
- keep keywords short
- prioritize 1–3 memorable words
- avoid long sentences in the label field
- make the label easy to scan while presenting

### Display Rules
- keyword should be visually prominent
- keyword should sit near the icon or visual cue
- the full text should remain secondary to the keyword

---

## 7. Feature Group: Editing Controls

### Description
Users need to customize the generated map.

### Editable Fields
- segment keyword
- segment text
- segment icon or cue
- overall topic title

### Editing Requirements
- edits should update the visualization immediately or on save
- the user should not need to regenerate the entire map for small changes
- editing should feel lightweight and reversible

### Future Expansion
Later versions may support:
- drag-and-drop segment rearrangement
- image replacement
- advanced color coding
- custom layouts

---

## 8. Feature Group: Presentation Mode

### Description
Presentation mode is the rehearsal and speaking mode.

### Required Behavior
- show the current segment clearly
- allow next/previous navigation
- allow keyboard navigation
- show progress through the map
- keep the visual map readable in a presentation context

### Presentation UI Goals
- large focus state
- minimal distraction
- simple navigation controls
- clear active segment indication

### Presentation Logic
- moving forward should follow the clock order
- moving backward should return to the previous segment
- the current segment should be obvious at all times

---

## 9. Feature Group: Progress and State Feedback

### Description
The user should always know where they are in the workflow.

### Required Feedback
- content length or input state
- generation status
- active segment state
- progress through presentation mode
- empty state when no content exists

### Why This Matters
The app must feel guided and understandable, especially for first-time users.

---

## 10. Feature Group: Responsiveness

### Description
The layout must adapt to the available screen size.

### Requirements
- work on desktop and tablet first
- preserve the circular layout
- reduce complexity on smaller screens
- keep controls usable on narrower widths

### Responsive Behavior
- collapse side-by-side sections into stacked sections on smaller screens
- scale the clock visualization safely
- keep important controls reachable

---

## 11. Feature Group: Browser Persistence

### Description
The app should keep useful state locally in the browser for the MVP.

### Suggested Persistent Data
- pasted content
- generated segments
- current topic title
- user-edited keywords
- segment icon choices

### Scope
This should be simple local persistence only. No account-based cloud syncing is required in the MVP.

---

## 12. Feature Group: Export and Sharing

### Current MVP Position
This is not required in the MVP, but it should remain a planned feature boundary.

### Future Export Ideas
- PNG export
- PDF export
- printable sheet
- shareable link
- presentation handout

---

## 13. Feature Priority Order

1. input
2. segmentation
3. clock visualization
4. editing
5. presentation mode
6. responsive behavior
7. local persistence
8. export-related expansion later

---

## 14. Summary

The feature breakdown defines the behavior of each major part of the ClockRail app. The product depends on a strong pipeline from content input to segmentation, visualization, editing, and presentation. Each feature must support the goal of making text easier to remember and present visually.

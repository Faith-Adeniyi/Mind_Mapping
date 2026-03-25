# ClockRail / Mind Mapping App — MVP Breakdown

## 1. MVP Purpose

The MVP should prove the core promise of the product:
turn a text-based speech, lecture, presentation, or project note into a simple visual clock-rail memory map that helps the user remember and present the content.

The MVP must focus on the smallest useful version of the experience, not the full long-term vision.

---

## 2. MVP Definition

The MVP should include:
- text input
- automatic or semi-automatic segmentation
- circular clock-style visualization
- editable labels and visual cues
- presentation mode
- basic persistence in the browser
- responsive layout for desktop and tablet

The MVP should not depend on advanced AI, database infrastructure, or complex export tools.

---

## 3. Minimum User Flow

### Step 1: Enter Content
The user pastes a speech, lecture, presentation, or project note into the input area.

### Step 2: Generate Segments
The app breaks the text into a manageable number of content blocks.

### Step 3: Visualize on ClockRail
The blocks are arranged clockwise around the clock map.

### Step 4: Edit for Memory
The user adjusts:
- the keyword
- the icon or visual cue
- the segment text if needed

### Step 5: Present or Review
The user enters presentation mode and follows the clock visually.

---

## 4. MVP Screens

### 4.1 Input Screen
Purpose:
- allow the user to paste or type content

Elements:
- title area
- large text input field
- generate button
- short instruction area

### 4.2 ClockRail Visualization Screen
Purpose:
- show the generated segments around a circular layout

Elements:
- central topic area
- clockwise segment ring
- segment cards or nodes
- segment numbering
- active highlight state

### 4.3 Editor Panel
Purpose:
- allow quick customization of the generated segments

Elements:
- segment keyword input
- visual/icon selector
- text preview or detail editor
- save/update interaction

### 4.4 Presentation Mode
Purpose:
- help the user rehearse or present from memory

Elements:
- large current segment display
- next/previous navigation
- progress state
- simplified clock reference

---

## 5. Required MVP Behaviors

### 5.1 Segmentation
The app should divide the content into segments that are:
- meaningful
- short enough to remember
- few enough to fit the clock metaphor

Suggested range:
- minimum: 4 segments
- ideal: 5–12 segments
- maximum: 12 segments for the standard clock layout

### 5.2 Visual Anchoring
Each segment must display:
- a visual cue such as an icon, emoji, or object-like symbol
- a short memory keyword
- a small text preview or supporting phrase

### 5.3 Editable Content
The user must be able to edit:
- segment keyword
- segment text
- segment icon or cue
- overall topic title

### 5.4 Presentation Flow
The user must be able to:
- move through segments in sequence
- identify the current active segment
- use the map as a speaking guide

---

## 6. MVP Scope Boundaries

### Included in MVP
- text entry
- segmentation
- circular visual layout
- segment editing
- presentation mode
- responsive visual design
- local browser state

### Not Included in MVP
- login and user accounts
- cloud sync
- advanced AI image generation
- PDF export
- voice recording
- speech-to-text
- multi-layout engine
- full analytics
- collaboration features

---

## 7. MVP Success Criteria

The MVP is successful if:
- users can paste content and get a usable map quickly
- the layout clearly reads as a clock-based system
- the segments are easy to understand and edit
- presentation mode feels useful during rehearsal
- the design feels polished enough to demo

---

## 8. MVP Priority Order

1. input area
2. segmentation logic
3. circular clock UI
4. editing controls
5. presentation mode
6. responsive polish
7. local persistence

---

## 9. Summary

The MVP is the smallest complete version of ClockRail that proves the concept. It should let users transform text into a clock-based memory map and use that map as a confident speaking aid.

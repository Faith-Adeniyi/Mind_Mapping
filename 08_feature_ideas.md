# Allison's Memory ClockRay — Extended Feature Ideas

## 1. Purpose of This Document

This document captures a set of high-value feature ideas for expanding ClockRay beyond the MVP. Each idea is described with its user value, how it works, and why it strengthens the product technically.

These features are not required for the first release but represent strong candidates for phases 2 through 5 of the roadmap.

---

## 2. Feature: Rehearsal Mode with Intelligent Fade

### What It Does

During a rehearsal session, the app progressively hides the text labels on each clock node, leaving only the visual icon or anchor visible. The user is forced to recall the content from memory using only the spatial position and visual cue.

### How It Works

- The user enters rehearsal mode from the clock view
- Labels fade out one by one, starting with the nodes the user marked as confident in previous sessions
- The user taps or clicks a node to reveal the hidden label and confirm or deny recall
- The app tracks which nodes the user struggles with
- Struggling nodes receive higher visual weight (brighter glow, pulsing border) in future sessions
- Over multiple sessions, a recall history is built per node

### Why It Matters

This transforms ClockRay from a one-time mapping tool into an active memory training platform. It applies spaced repetition principles directly to spatial memory nodes, which is a technically distinct and defensible combination.

### Patent Relevance

The combination of spatial node-based recall tracking with adaptive visual weighting driven by session history is novel as an integrated system. No existing memory palace or mind-map tool implements this specific feedback loop.

---

## 3. Feature: Live Speech-to-Clock Mapping

### What It Does

The user speaks into their microphone and the app maps what they are saying onto the clock in real time. As the user speaks each section of their content, the corresponding clock node highlights, showing them visually where they are in their structure.

### How It Works

- The user activates speech input mode
- Browser-based speech-to-text captures the live audio stream
- The transcribed text is matched against the existing clock node content using semantic similarity
- The matching node highlights or pulses on the clock face
- After the session, a transcript is saved alongside the map
- Optionally, if no clock map exists yet, the app builds one from the live speech in real time

### Why It Matters

This is a genuinely novel interaction model. It gives speakers real-time structural feedback while practising a speech or lecture, without requiring them to look at notes. It also creates a use case for live lecture capture and structured note-taking from spoken content.

### Patent Relevance

Real-time speech-to-spatial-structure mapping with live node highlighting is a strong, novel technical claim. It combines ASR, semantic matching, and a spatial memory UI in a single integrated pipeline.

---

## 4. Feature: Confidence Scoring Per Node

### What It Does

After each rehearsal session, every clock node receives a confidence score based on how often the user recalled it correctly versus incorrectly. The clock face reflects these scores visually so the user can see at a glance where they are strong and where they need more practice.

### How It Works

- Each node stores a recall history: timestamps, correct recalls, failed recalls
- A confidence score is calculated per node (e.g. weighted average of recent sessions)
- The clock face renders nodes with visual confidence indicators:
  - High confidence: bright, solid appearance
  - Medium confidence: normal appearance
  - Low confidence: dimmed, marked with a subtle warning indicator
- The user can view a confidence breakdown panel alongside the clock
- The app uses confidence scores to decide which nodes to hide first in rehearsal mode

### Why It Matters

This turns each clock map into a living memory dashboard. Users can track their preparation progress over time and know exactly which parts of their content need more rehearsal before a presentation.

### Patent Relevance

Node-level adaptive confidence scoring applied to a spatial memory interface, combined with visual rendering driven by recall history, is a technically distinctive and defensible system.

---

## 5. Feature: Document and PDF Import

### What It Does

The user uploads an existing document — PDF, Word file, or plain text file — and the app automatically extracts the structure, runs it through the AI segmentation engine, and generates a clock map without the user needing to paste or type anything manually.

### How It Works

- The user uploads a file via a drag-and-drop or file picker interface
- The backend extracts the raw text content from the file
- The text is passed to the existing AI segmentation endpoint
- A clock map is generated and displayed for the user to review and edit
- For structured documents (headings, sections), the parser respects existing document structure as segmentation hints

### Why It Matters

Most users already have their content in documents. Removing the copy-paste step dramatically reduces friction and makes the app practical for professionals, students, and teachers who work with prepared materials.

### Patent Relevance

Structure-aware document parsing used as a pre-processing layer before AI segmentation into a spatial memory format is a novel pipeline when combined with the ClockRay output format.

---

## 6. Feature: Presentation Companion Mode

### What It Does

A clean, fullscreen view of the clock map designed for use during a live presentation. The presenter advances through the clock nodes one at a time using a keyboard shortcut or clicker button, with the current node visually highlighted and all others dimmed.

### How It Works

- The user enters Companion Mode from the clock view
- The screen shows only the clock, stripped of all editing controls
- The current active node is highlighted with a strong visual indicator
- The presenter presses space bar, arrow key, or a connected clicker to advance clockwise to the next node
- Optionally, a minimal text preview of the current node content appears at the bottom of the screen
- A secondary URL or tab can be opened for audience view with limited detail visible

### Why It Matters

This is a direct, practical tool for public speakers. It replaces teleprompters and linear slide notes with a spatial, circular cue system. It is the most immediate real-world use case for the product.

### Patent Relevance

A presenter-controlled spatial clock navigation interface with node-advance input binding and audience/presenter split-view mode is a novel application of the ClockRay format.

---

## 7. Feature: Multi-Clock Nesting (Sub-Clocks)

### What It Does

For very long or complex content, a single clock node can be expanded into its own full 12-node sub-clock. The main clock becomes a top-level outline and each node can hold a second layer of detail.

### How It Works

- Any node on the main clock can be marked as expandable
- Clicking the expand control opens a sub-clock view for that node
- The sub-clock is a full 12-position clock generated from the content of the parent node
- The user can navigate between the parent clock and sub-clocks via breadcrumb navigation
- Sub-clocks can be collapsed back into the parent node at any time
- The AI segmentation engine can generate sub-clocks automatically when content is detected as too dense for a single node

### Why It Matters

This solves the core limitation of a 12-node structure for longer content. A two-level nesting gives 144 addressable memory positions, which is enough for a full lecture, a thesis chapter, or a long structured report.

### Patent Relevance

Hierarchical spatial memory nesting using a consistent circular metaphor at each level, with AI-driven depth detection to decide when to nest, is a technically novel and defensible structural innovation.

---

## 8. Feature: Template Library by Content Type

### What It Does

A library of pre-configured clock structures designed for common content formats. The user selects a template and the AI fills in the nodes using their pasted or uploaded content, adapted to fit the structure of that template.

### Template Examples

- **5-Point Sermon** — Opening, Scripture, Point 1, Point 2, Point 3, Illustration, Application, Call to Action, Prayer, Closing
- **STAR Interview Answer** — Situation, Task, Action, Result, Reflection
- **Product Pitch** — Problem, Market, Solution, Demo, Traction, Team, Ask
- **3-Act Presentation** — Setup, Confrontation, Resolution (expanded into sub-nodes)
- **Lecture Outline** — Learning Objectives, Context, Core Concept, Examples, Common Errors, Summary, Q&A
- **Project Review** — Goals, Progress, Blockers, Decisions Made, Next Steps

### How It Works

- The user browses a template gallery
- They select a template and paste or upload their content
- The AI adapts the content to fit the template's node structure
- The user reviews, edits, and adjusts before finalising the map

### Why It Matters

Templates remove the blank-page problem. They also create recurring, professional use cases across industries and make the app immediately practical for users who do not know how to structure their content from scratch.

### Patent Relevance

AI-driven content-to-template fitting within a spatial circular memory structure, with domain-specific template schemas, is a novel application layer on top of the core segmentation engine.

---

## 9. Summary

These features expand ClockRay across four dimensions:

- **Memory depth** — rehearsal mode, confidence scoring, spaced repetition
- **Input flexibility** — document import, live speech capture
- **Presentation utility** — companion mode, template library
- **Structural power** — multi-clock nesting, sub-clocks

Each feature is designed to add practical value for real users while also deepening the technical complexity of the product in ways that strengthen its intellectual property position.

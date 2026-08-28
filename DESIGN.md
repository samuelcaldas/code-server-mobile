---
name: code-server
description: Precision remote VS Code workbench optimized for desktop and mobile touch
colors:
  primary: "#5772f5"
  primary-dark: "#1a56db"
  focus-ring: "#3f83f8"
  canvas-dark: "#1e1e1e"
  canvas-light: "#f4f7fc"
  surface-dark: "#1f2937"
  surface-light: "#fafdf8"
  text-primary: "#111111"
  text-secondary: "#555555"
  border-subtle: "#dddddd"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "6rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono:
    fontFamily: "Consolas, 'Courier New', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "5px"
  lg: "8px"
spacing:
  touch-min: "44px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  input-text:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: code-server

## Overview

**Creative North Star: "The Pocket IDE & Studio"**

code-server brings full-fidelity VS Code into the browser on any remote infrastructure. The design system reconciles two distinct physical realities: maximum information density and precision for desktop mouse-and-keyboard development, paired with ergonomic, touch-first clarity for mobile phone and tablet interaction.

On desktop and high-resolution displays (including Samsung DeX), the interface recedes to provide uncompromised editor and multi-split tooling. On constrained mobile viewports, the workbench dynamically switches into a compact single-pane topology, elevating touch targets to comfortable accessibility floors, containing overscroll, and transforming sidebars and tool panels into transient, non-destructive navigation drawers.

**Key Characteristics:**

- **Dynamic Geometry Adaptation:** Adapts in real time to viewport dimensions without reload or user-agent sniffing.
- **Utilitarian & Ergonomic:** Adheres strictly to VS Code dark/light token semantics with a mandatory 44px touch target floor on small screens.
- **Transient Overlays:** Sidebars and panels open as overlay drawers, ensuring code editors retain full visible width without grid deformation.
- **Zero Desktop Regressions:** Desktop density, split views, and keyboard acceleration remain completely unhindered.

## Colors

The palette embraces VS Code's theme-driven token ecosystem for the workbench, complemented by a confident electric blue accent and clean neutral backgrounds for wrapper authentication and error surfaces.

### Primary

- **Royal Code Blue** (`#5772f5` / Dark mode `#1a56db`): Primary action color on web landing, login, and submission buttons.

### Accent

- **Electric Focus Blue** (`#3f83f8`): High-visibility focus rings and interactive field outlines.

### Neutral

- **VS Code Dark Canvas** (`#1e1e1e` / `var(--vscode-editor-background)`): Canonical editor canvas in dark mode.
- **Web Canvas Light** (`#f4f7fc`): Background canvas for standalone web pages in light mode.
- **Dark Card Surface** (`#1f2937` / `#252526`): Surface background for cards, headers, and sidebar panels in dark mode.
- **Light Card Surface** (`#fafdf8`): Elevated card container background in light mode.
- **Primary Ink** (`#111111` / Dark mode `#dddddd`): High-contrast primary reading text.
- **Muted Slate** (`#555555` / Dark mode `#9ca3af`): Subtitles, helper text, and inactive iconography.
- **Subtle Border** (`#dddddd` / Dark mode `#4b5563`): Dividers, card boundaries, and input borders.

### Named Rules

**The Theme Fidelity Rule.** Workbench surfaces must bind to VS Code CSS custom properties (`var(--vscode-*)`) rather than hardcoded colors, ensuring custom user themes apply consistently.

## Typography

**Display & UI Font:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`  
**Monospace / Code Font:** `Consolas, "Courier New", monospace`

**Character:** Clean, highly legible system font stack optimized for rapid UI scanning and native OS integration, paired with crisp monospace font stacks for code buffers and terminal sessions.

### Hierarchy

- **Display** (Bold 700, `6rem`, `1.0` line-height): Standalone error codes and major status numbers.
- **Headline** (Semi-bold 600, `1.5rem`, `1.25` line-height): Card headers and modal dialog titles.
- **Body** (Regular 400, `1rem`, `1.5` line-height): Default interface copy, error descriptions, and form inputs.
- **Label / Action** (Medium 500, `1rem`, `1.0` line-height): Buttons, form submissions, and primary navigation actions.
- **Monospace** (Regular 400, `0.875rem`, `1.4` line-height): Editor text, terminal output, and log displays.

### Named Rules

**The Legibility Floor Rule.** Monospace text in editors and terminals must never drop below 12px on mobile viewports to prevent eye strain during handheld review.

## Layout

Layout behavior is governed by container geometry rather than device user agents.

### Breakpoints & Geometry Policy

- **Phone Portrait:** Width < 640px (compact single-pane topology).
- **Phone Landscape:** Width < 960px AND Height < 480px (compact landscape topology).
- **Tablet:** Width < 1024px (adaptive intermediate topology).
- **Desktop / Samsung DeX:** Width ≥ 1024px (full multi-part workbench with persistent sidebars and panels).

### Spatial & Touch Rhythm

- **Touch Target Minimum:** `44px` height/width minimum for interactive toolbar actions, list rows, and command center buttons on mobile.
- **Container Sizing:** Authentication and modal dialog cards constrain to `max-width: 650px` with responsive flex direction collapsing on screens < 600px.
- **Overscroll Containment:** `overscroll-behavior: contain` applied to all scrollable elements in compact layout to prevent browser pull-to-refresh bounces.

### Named Rules

**The Geometry Gate Rule.** Layout modes must be classified solely through live container dimensions, enabling dynamic transitions during device rotation and DeX docking without page reloads.

## Elevation & Depth

Surfaces rely on subtle tonal layering for standard workbench panes and precise drop shadows for modal cards and mobile navigation overlays.

### Shadow Vocabulary

- **Card Elevation** (`0 7px 14px 0 rgba(60,66,87, 0.12), 0 3px 6px 0 rgba(0,0,0, 0.12)`): Grounding shadow for floating authentication and dialog boxes.
- **Overlay Elevation** (`0 0 16px var(--vscode-widget-shadow)`): Elevation glow for mobile navigation drawers and floating menus.
- **Backdrop Scrim** (`color-mix(in srgb, var(--vscode-editor-background) 55%, transparent)`): Semi-transparent backdrop isolating mobile overlay sheets.

### Named Rules

**The Scrim Focus Rule.** Whenever a mobile navigation drawer or full-screen menu is open, the underlying editor must be visually subdued with a backdrop scrim to establish distinct spatial depth.

## Shapes

- **Base Radius:** `5px` corner radius applied to cards, primary action buttons, and text input fields.
- **Full-Screen Sheets:** Mobile navigation drawers and menu shells utilize flush, rectangular boundaries (`0px` radius) maximizing screen real estate on mobile devices.

## Components

### Buttons

- **Shape:** Gently rounded corners (`border-radius: 5px`).
- **Primary:** Royal Code Blue background (`#5772f5`), white text, bold padding (`18px 20px`), `font-weight: 500`.
- **Hover / Focus:** Darker sapphire background (`#1a56db`), outline `2px solid #3f83f8` with `2px` offset.
- **Touch Action:** `touch-action: manipulation` applied to disable double-tap zoom delay.

### Cards / Containers

- **Corner Style:** Rounded (`5px`).
- **Background:** Light card surface (`#fafdf8`) / Dark card surface (`#1f2937`).
- **Shadow:** Card Elevation (`0 7px 14px 0 rgba(60,66,87, 0.12)`).
- **Internal Padding:** `30px` header, `40px` content.

### Inputs / Fields

- **Style:** Light gray canvas background (`#f4f7fc` / dark `#374151`), `1px solid #ddd` border, `5px` radius, `16px` padding.
- **Focus:** `outline: 2px solid #3f83f8` with clear placeholder contrast (`#9ca3af`).

### Mobile Navigation Overlays (Signature Component)

- **Style:** Fixed overlay host (`z-index: 2522`) with absolute drawer positioned over the editor.
- **Behavior:** Opens without shrinking the editor grid; dismissible via backdrop tap, Android back button (`popstate`), or Escape key.

## Do's and Don'ts

### Do:

- **Do** maintain a minimum 44x44px touch target for all primary action items in mobile phone layout.
- **Do** classify layout modes dynamically based on live container geometry.
- **Do** preserve editor buffer state and cursor position across device rotation and DeX transitions.
- **Do** contain overscroll on lists and editors to avoid whole-page viewport bouncing.

### Don't:

- **Don't** shrink or distort the editor grid when opening sidebars or panels on mobile viewports; use overlay drawers.
- **Don't** use user-agent sniffing to toggle between phone and desktop layouts.
- **Don't** introduce duplicate gesture engines that conflict with VS Code's built-in `Gesture` system.
- **Don't** compromise dense keyboard shortcuts or multi-pane arrangements on desktop displays.

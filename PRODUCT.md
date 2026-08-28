# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers needing a full-featured VS Code development environment on remote infrastructure, specifically optimized for coding, debugging, and triaging on mobile devices (smartphones, tablets) and desktop environments (Samsung DeX, laptops, external monitors).

## Product Purpose

Run VS Code on any remote machine and access it seamlessly in any web browser. Enable productive development anywhere without local machine constraints or battery drain, while providing a responsive workbench that adapts dynamically across phone touchscreens, tablets, and desktop displays.

## Positioning

Full-fidelity, open-source VS Code in the browser that adapts to mobile touch and desktop geometry on the fly without separate native app wrappers or degraded companion experiences, maintaining parity with desktop VS Code.

## Operating Context

- Remote Linux servers, cloud VMs, Docker containers, and self-hosted homelabs.
- Client devices ranging from smartphones (portrait and landscape touch) and tablets to desktop browsers and external display setups like Samsung DeX.
- Network environments requiring WebSockets, reverse proxies (Nginx / NPM), and secure authentication (password/hash).

## Capabilities and Constraints

- **Core Capabilities:** Web-based IDE workbench, terminal sessions, file browsing, extension host execution, and git integration hosted entirely on the server.
- **Responsive & Touch Support:** Geometry-driven viewport policy (compact phone layout < 640px or < 960x480 landscape, tablet < 1024px, desktop/DeX >= 1024px); native touch gestures via VS Code's Gesture engine.
- **Architecture Constraints:** VS Code core modifications ship strictly as quilt patches applied against `lib/vscode` (`patches/series`); no direct edits in upstream code without patch tracking.
- **Zero Desktop Regressions:** Desktop mouse-and-keyboard interactions, layout state, and multi-part arrangements must remain intact when running on desktop or DeX.

## Brand Commitments

- Project name: code-server (by Coder).
- Visual and UI language adheres to the VS Code Workbench design system, theme tokens, and typography.

## Evidence on Hand

- `docs/adr/0001-responsive-workbench.md` (ADR 0001 — Responsive Workbench for Phone and Samsung DeX).
- `docs/mobile-touch-ux-audit.md` (Mobile touch UX audit and roadmap).
- `test/e2e/mobile.layout.test.ts` (Playwright Mobile Chromium layout test suite).
- `lib/vscode/src/vs/workbench/test/browser/viewportPolicy.test.ts` (VS Code viewport policy unit test suite).

## Product Principles

1. **Adaptive Geometry over User-Agent Sniffing:** Classify layout strictly by active viewport dimensions so window resizing, device rotation, and DeX transitions adapt instantly without reload.
2. **First-Class Touch without Desktop Regression:** Optimize touch targets and compact layouts for small screens while preserving full keyboard shortcuts and dense desktop power.
3. **Upstream Alignment & Rebasability:** Harvest upstream VS Code patterns and maintain all modifications as lean, modular quilt patches.
4. **State & Context Continuity:** Ensure editor buffer state, active tabs, and layout preferences survive device rotation, reconnection, and viewport transitions.

## Accessibility & Inclusion

- Adherence to WCAG touch target sizes (minimum 44x44px for primary mobile tap targets).
- High-contrast and custom theme support inherited from VS Code.
- Keyboard navigation and screen reader support maintained across all viewport topologies.

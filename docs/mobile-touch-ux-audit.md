<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Mobile Touch UX Audit

- [Purpose, scope, and non-goals](#purpose-scope-and-non-goals)
- [Audit method and labels](#audit-method-and-labels)
- [Current baseline](#current-baseline)
- [Prioritized findings](#prioritized-findings)
- [Automated coverage and blind spots](#automated-coverage-and-blind-spots)
- [Browser and device validation matrix](#browser-and-device-validation-matrix)
- [Outcome-oriented remediation roadmap](#outcome-oriented-remediation-roadmap)
- [Reference index](#reference-index)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

## Purpose, scope, and non-goals

This audit is the canonical developer record for making the code-server workbench
usable on smartphones and other small touch screens while preserving desktop
mouse-and-keyboard behavior. It records source evidence, validation boundaries,
and outcome-oriented work; it does not change support policy or product behavior.

This document does not replace user guidance in [iPad](ipad.md) or
[Android](android.md), prescribe a patch design, or certify a browser or device.

## Audit method and labels

Evidence is classified as follows:

- **source-confirmed**: directly observable in a linked source file.
- **test-confirmed**: asserted by a linked automated test. Current execution
  status is stated where verified.
- **real-device validation required**: plausible browser, accessibility, or input
  risk that needs the matrix below. It is not a confirmed defect.

Ownership labels identify likely remediation boundary:

- **code-server patch**: main-workbench behavior maintained through this
  repository's VS Code patch stack.
- **upstream VS Code**: behavior owned by VS Code and best resolved upstream.
- **cross-boundary integration**: code-server route, PWA, browser, and workbench
  behavior must agree.

`lib/vscode/src/vs/sessions/**` is a Microsoft-maintained reference
implementation, not a direct import target for the main workbench. Sessions sits
alongside the workbench layer; any shared utility must first move into an allowed
lower layer.

## Current baseline

The current responsive-workbench implementation uses
[`WorkbenchViewportPolicy`](../lib/vscode/src/vs/workbench/browser/viewportPolicy.ts)
to classify container geometry: phone when width is below 640 CSS pixels; phone
landscape when width is below 960 CSS pixels and height is below 480 CSS pixels;
otherwise tablet when width is below 1024 CSS pixels; otherwise desktop/DeX. It
ignores invalid geometry. The main layout applies a scoped `phone-layout` class,
and [`phoneLayout.css`](../lib/vscode/src/vs/workbench/browser/media/phoneLayout.css)
keeps compact rules under that class. Live layout state preserves desktop part
visibility and maximized panel or auxiliary-bar state across compact transitions
and compact reloads.

Nine browser tests in
[`viewportPolicy.test.ts`](../lib/vscode/src/vs/workbench/test/browser/viewportPolicy.test.ts)
pass for policy classification and visibility defaults. Root Playwright includes
touch-enabled [`Mobile Chromium`](../test/playwright.config.ts) emulation, where
the eight passing tests in
[`mobile.layout.test.ts`](../test/e2e/mobile.layout.test.ts) cover portrait,
844x390 rotation, DeX restoration, desktop visibility persistence across compact
reload, maximized-panel compact startup and editor visibility, hidden-panel
retention of the last maximized state, and maximized auxiliary-bar transitions.
VS Code's existing [`Gesture`](../lib/vscode/src/vs/base/browser/touch.ts) support
remains available for touch-aware controls. Mobile Chromium emulation is a fast
browser regression signal, not device certification.

## Prioritized findings

| ID                              | Priority | User impact                                                                                                         | Evidence                                                                                                                                                                                                                                                                                                                                                                  | Ownership                            | Current coverage                                                                                          | Recommended outcome                                                                                                         |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| <a id="mux-p0-01"></a>MUX-P0-01 | P0       | Rotation behavior could regress if the shared portrait-and-landscape contract drifts.                               | **source-confirmed:** [`viewportPolicy.ts`](../lib/vscode/src/vs/workbench/browser/viewportPolicy.ts) classifies 844x390 as phone through its landscape rule; **test-confirmed:** [`mobile.layout.test.ts`](../test/e2e/mobile.layout.test.ts) expects that compact topology. Current source and tests agree; nine policy and eight Mobile Chromium tests currently pass. | code-server patch                    | Nine policy and eight Mobile Chromium tests cover geometry and workbench transitions; no device coverage. | Preserve the live portrait-and-landscape contract and current tests; validate rotation on physical devices.                 |
| <a id="mux-p0-02"></a>MUX-P0-02 | P0       | Opening Explorer, panel, or auxiliary UI can reclaim editor grid space instead of behaving as mobile navigation.    | **source-confirmed:** policy hides parts by default; compact CSS has no drawer/sheet backdrop, dismissal, or focus-restoration behavior. Sessions [`mobileNavigationStack.ts`](../lib/vscode/src/vs/sessions/browser/mobileNavigationStack.ts) is reference only.                                                                                                         | code-server patch                    | Compact state-transition coverage; no drawer workflow coverage.                                           | Provide transient navigation surfaces with dismissal, focus restoration, and back/Escape behavior without shrinking editor. |
| <a id="mux-p0-03"></a>MUX-P0-03 | P0       | Virtual keyboard, safe-area, and visible viewport can obscure focused UI.                                           | **source-confirmed:** main workbench compact CSS uses `vh` but has no unified viewport contract; Sessions [`mobileVisualViewport.ts`](../lib/vscode/src/vs/sessions/browser/parts/mobile/mobileVisualViewport.ts) tracks keyboard height and is reference only.                                                                                                           | code-server patch                    | No root viewport/keyboard test.                                                                           | Establish one main-workbench visible-viewport, virtual-keyboard, and safe-area contract.                                    |
| <a id="mux-p1-01"></a>MUX-P1-01 | P1       | Dense desktop controls remain hard to tap or read on small screens.                                                 | **source-confirmed:** current compact CSS expands selected action and quick-pick rows, but menus, dialogs, sashes, title/status bars, tabs, tree rows, notifications, and transient surfaces lack a coherent compact treatment.                                                                                                                                           | code-server patch / upstream VS Code | No broad compact-control coverage.                                                                        | Make core compact surfaces consistently reachable without reducing editor usability.                                        |
| <a id="mux-p1-02"></a>MUX-P1-02 | P1       | Hover-only affordances are undiscoverable with touch.                                                               | **real-device validation required:** touch paths need device observation despite upstream [`Gesture`](../lib/vscode/src/vs/base/browser/touch.ts) support.                                                                                                                                                                                                                | upstream VS Code / code-server patch | No interaction coverage.                                                                                  | Identify essential hover affordances and provide visible or gesture-based touch alternatives.                               |
| <a id="mux-p1-03"></a>MUX-P1-03 | P1       | Terminal, editor selection, and file/tab movement lack deliberate finger workflows.                                 | **real-device validation required:** source and smoke tests do not exercise terminal copy/paste/selection/context actions, editor finger selection, or drag-and-drop.                                                                                                                                                                                                     | upstream VS Code / code-server patch | No workflow coverage.                                                                                     | Define and validate touch-first alternatives for core editing, terminal, and movement workflows.                            |
| <a id="mux-p1-04"></a>MUX-P1-04 | P1       | Quick Input, dialogs, notifications, menus, context views, and modal editors can be clipped or desktop-sized.       | **source-confirmed:** main compact CSS handles only quick-input width and row height; Sessions [`phoneLayout.css`](../lib/vscode/src/vs/sessions/browser/media/phoneLayout.css) shows broader reference treatments.                                                                                                                                                       | code-server patch / upstream VS Code | No transient-surface coverage.                                                                            | Give compact transient UI a consistent viewport-aware presentation.                                                         |
| <a id="mux-p1-05"></a>MUX-P1-05 | P1       | Viewport override has no user-facing path.                                                                          | **source-confirmed:** [`setOverride()`](../lib/vscode/src/vs/workbench/browser/viewportPolicy.ts) is reserved for a future user-facing override, but no production setting wiring is present in reviewed workbench sources.                                                                                                                                               | code-server patch                    | Policy browser coverage only.                                                                             | Either wire a supported override with clear scope or remove unsupported promise.                                            |
| <a id="mux-p1-06"></a>MUX-P1-06 | P1       | Magnification and gesture policy can conflict with accessibility or browser behavior.                               | **source-confirmed:** workbench markup disables user scaling, while compact CSS applies `touch-action: manipulation` to action items and buttons; product and accessibility effect needs review.                                                                                                                                                                          | cross-boundary integration           | No accessibility/device coverage.                                                                         | Review zoom and touch-action policy against user needs before declaring compact behavior accessible.                        |
| <a id="mux-p2-01"></a>MUX-P2-01 | P2       | Scroll chaining, overscroll, long press, text selection, and browser-chrome transitions may differ by browser.      | **real-device validation required:** CSS contains overscroll and selection controls, but no device matrix execution exists.                                                                                                                                                                                                                                               | cross-boundary integration           | Mobile Chromium layout coverage; no native-browser workflow coverage.                                     | Validate browser-native interactions on supported devices and record blockers by owner.                                     |
| <a id="mux-p2-02"></a>MUX-P2-02 | P2       | PWA install can lack predictable offline, update, or reconnect behavior; base-path install can fail on error pages. | **source-confirmed:** [`serviceWorker.ts`](../src/browser/serviceWorker.ts) has no cache/reconnect policy, and [`error.html`](../src/browser/pages/error.html) hardcodes `/manifest.json` while [`vscode.ts`](../src/node/routes/vscode.ts) templates base-aware manifest assets.                                                                                         | cross-boundary integration           | No PWA lifecycle coverage.                                                                                | Define install, offline, update, reconnect, and base-path behavior before making PWA reliability claims.                    |
| <a id="mux-p2-03"></a>MUX-P2-03 | P2       | Input sizing, safe areas, screen-reader behavior, focus restoration, and magnification remain unverified.           | **real-device validation required.**                                                                                                                                                                                                                                                                                                                                      | cross-boundary integration           | No assistive-technology/device coverage.                                                                  | Include assistive technology, safe-area, and keyboard checks in release validation.                                         |
| <a id="mux-p2-04"></a>MUX-P2-04 | P2       | Automated confidence omits WebKit/iOS and physical devices.                                                         | **source-confirmed:** root Playwright has Mobile Chromium only; nine [`viewportPolicy.test.ts`](../lib/vscode/src/vs/workbench/test/browser/viewportPolicy.test.ts) browser tests pass in VS Code's separate runner.                                                                                                                                                      | cross-boundary integration           | Nine policy tests and Mobile Chromium coverage; no WebKit/physical-device coverage.                       | Keep fast Chromium and policy checks, and use device validation for browser-specific behavior.                              |

## Automated coverage and blind spots

The eight passing [`mobile.layout.test.ts`](../test/e2e/mobile.layout.test.ts)
tests run only under [`Mobile Chromium`](../test/playwright.config.ts), a 390x844
Chromium context with `isMobile` and `hasTouch`. They cover portrait, 844x390
rotation, DeX restoration, desktop visibility persistence across compact reload,
maximized-panel compact startup and editor visibility, hidden-panel remembered
maximized state, and maximized auxiliary-bar transitions. This is browser
emulation, not Android Chrome, iOS Safari, installed-PWA, or physical-device
certification. It does not cover keyboard viewport handling, focus restoration,
back navigation, assistive technology, actual tap workflows in terminal or editor,
drag-and-drop, or transient drawer surfaces.

Nine passing [`viewportPolicy.test.ts`](../lib/vscode/src/vs/workbench/test/browser/viewportPolicy.test.ts)
browser tests directly cover policy classification, invalid geometry, and
visibility defaults through VS Code's nested browser runner. Root e2e and CI do
not thereby run those tests. The policy suite is insufficient for rendered grid,
overlay, keyboard, and browser behavior.

## Browser and device validation matrix

| Target                                 | Required scenarios                                                                             | Confidence boundary                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Android Chrome                         | Portrait and landscape; virtual keyboard; long press; terminal/editor workflows; install path. | Real-device validation required.                                      |
| iPhone Safari                          | Browser and installed PWA; safe areas; keyboard; back/forward; zoom and focus restoration.     | Real-device validation required; Chromium is not a WebKit substitute. |
| iPad Safari                            | Full screen and split view; touch with hardware keyboard and trackpad.                         | Real-device validation required.                                      |
| Samsung DeX                            | Live transition between phone and external display; mouse/keyboard restoration.                | Real-device validation required.                                      |
| Narrow desktop window and wide desktop | Compact entry/exit plus persisted desktop part visibility.                                     | Automated signal plus manual desktop regression check.                |
| Mobile Chromium                        | Focused compact-layout checks.                                                                 | Fast automated regression signal, not device certification.           |

## Outcome-oriented remediation roadmap

1. **P0 — drawers and visible viewport:** preserve the tested [MUX-P0-01](#mux-p0-01)
   geometry contract while resolving [MUX-P0-02](#mux-p0-02) and
   [MUX-P0-03](#mux-p0-03) into transient navigation and a keyboard-safe viewport
   contract.
2. **P1 — core touch work:** address [MUX-P1-01](#mux-p1-01) through
   [MUX-P1-06](#mux-p1-06) so primary editing, terminal, navigation, and transient
   UI tasks have deliberate compact interactions.
3. **P2 — release confidence:** close [MUX-P2-01](#mux-p2-01) through
   [MUX-P2-04](#mux-p2-04) with PWA/accessibility behavior and repeatable automated
   plus physical-device validation.

Each increment must demonstrate wide-desktop preservation as well as its compact
outcome. Do not convert Sessions imports into a main-workbench dependency.

## Reference index

- Main workbench: [`viewportPolicy.ts`](../lib/vscode/src/vs/workbench/browser/viewportPolicy.ts),
  [`layout.ts`](../lib/vscode/src/vs/workbench/browser/layout.ts), and
  [`phoneLayout.css`](../lib/vscode/src/vs/workbench/browser/media/phoneLayout.css)
- Sessions references only: [`mobileVisualViewport.ts`](../lib/vscode/src/vs/sessions/browser/parts/mobile/mobileVisualViewport.ts),
  [`mobileNavigationStack.ts`](../lib/vscode/src/vs/sessions/browser/mobileNavigationStack.ts),
  and [`phoneLayout.css`](../lib/vscode/src/vs/sessions/browser/media/phoneLayout.css)
- Input and automated checks: [`touch.ts`](../lib/vscode/src/vs/base/browser/touch.ts),
  [`test/playwright.config.ts`](../test/playwright.config.ts),
  [`mobile.layout.test.ts`](../test/e2e/mobile.layout.test.ts), and
  [`viewportPolicy.test.ts`](../lib/vscode/src/vs/workbench/test/browser/viewportPolicy.test.ts)
- PWA and route behavior: [`serviceWorker.ts`](../src/browser/serviceWorker.ts),
  [`error.html`](../src/browser/pages/error.html), and
  [`vscode.ts`](../src/node/routes/vscode.ts)
- Current platform guidance: [iPad](ipad.md) and [Android](android.md)

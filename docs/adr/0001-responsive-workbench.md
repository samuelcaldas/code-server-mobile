# ADR 0001 — Responsive Workbench for Phone and Samsung DeX

- **Status:** Proposed
- **Date:** 2026-08-02
- **Context version:** code-server v4.131.0, Code 1.131.0 (`lib/vscode` @ `3a03d6f72d6`)

## Context

The goal is to make the VS Code Web workbench served by code-server usable on a
phone (portrait and landscape, touch only) and on Samsung DeX (external display,
mouse and keyboard), including live transitions between the two without a reload
and without losing editor state — with no regression for desktop mouse/keyboard.

An initial plan proposed building four things from scratch inside
`src/vs/workbench/browser/parts/**`: a `PointerInputAdapter`, a `LayoutStrategy`
per `ScreenMode`, a `ScreenModeObserver`, and a `MobileFocusState` machine.

Investigating the repository before coding invalidated several premises of that
plan. This ADR records what was found and what we decided instead.

## Findings

### F1 — This repository contains no workbench source; changes ship as quilt patches

`src/vs/workbench/**` does not exist in this repository. It lives in the
`lib/vscode` git submodule (microsoft/vscode), which was not checked out. All
code-server modifications to Code are quilt patches in `patches/`, applied in the
order given by `patches/series` (27 patches).

Consequences: an agent cannot "edit the workbench" and commit. It must
`git submodule update --init`, `quilt push -a`, edit, then `quilt new` /
`quilt add` / `quilt refresh` to produce a `.diff`. `csp-hashes.diff` is
regenerated last by `ci/build/update-vscode.sh` and must remain last in the series.

### F2 — The touch problem is largely already solved upstream; the stated premise is wrong

The plan asserted that clicks fail on touch because handlers assume
`mousedown`/`mouseup`/`hover`, with no unified pointer handling and a 300 ms tap
delay. Verified against the actual source, this is mostly not true:

- Code ships a touch abstraction at `lib/vscode/src/vs/base/browser/touch.ts`
  (the `Gesture` class). It listens to `touchstart`/`touchmove`/`touchend` on the
  document and synthesizes `EventType.Tap`, `Contextmenu`, and `Change` events.
  There are 53 files calling `Gesture.addTarget` and 89 `EventType.Tap` /
  `Contextmenu` consumers.
- The main workbench parts already opt in, including
  `parts/compositeBar.ts:315`, `parts/paneCompositeBar.ts`,
  `parts/activitybar/activitybarPart.ts`,
  `parts/editor/singleEditorTabsControl.ts:47`,
  `parts/editor/multiEditorTabsControl.ts`, `parts/editor/editorGroupView.ts`,
  `parts/statusbar/statusbarPart.ts`, and `parts/views/viewPaneContainer.ts`.
- `lib/vscode/src/vs/code/browser/workbench/workbench.html:18` already sets
  `<meta name="viewport" content="width=device-width, initial-scale=1.0,
  maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">`. A responsive
  viewport removes the legacy 300 ms tap delay in every current browser, so
  there is no 300 ms delay to remove.

Therefore a new `PointerInputAdapter` would duplicate `Gesture` and fragment
input handling. **Decision D2 below rejects it.**

### F3 — The layout problem is real

`lib/vscode/src/vs/workbench/browser/layout.ts` is 3219 lines with zero
viewport, touch, or platform awareness — no `isMobile`, no `matchMedia`, no
breakpoint. `src/vs/workbench/browser/media/style.css` contains exactly one
`@media` query, and it is a device-pixel-ratio rule, not a width rule.

The main workbench is unconditionally desktop-first: activity bar, sidebar,
editor, panel, and status bar all compete for one viewport. This is the actual
cause of the reported unusability on a phone.

### F4 — Code 1.131 already ships a complete, tested phone layout system

This is the most consequential finding. Code 1.131 contains a **second
workbench** at `lib/vscode/src/vs/sessions/` (647 files) — the Agent Sessions
workbench — which has a first-class, production mobile layout:

| Concern | Existing implementation |
| --- | --- |
| Viewport classification | `sessions/browser/layoutPolicy.ts` — `SessionsLayoutPolicy`, `ViewportClass = 'phone' \| 'tablet' \| 'desktop'` |
| Navigation state machine | `sessions/browser/mobileNavigationStack.ts` — LIFO overlay stack wired to `history.pushState`/`popstate` for the Android back button |
| Mobile parts | `parts/mobile/mobileSidebarPart.ts`, `mobilePanelPart.ts`, `mobileTitlebarPart.ts`, `mobileAuxiliaryBarPart.ts` |
| Gestures | `parts/mobile/mobileEdgeSwipe.ts`, `longPress.ts` |
| On-screen keyboard | `parts/mobile/mobileVisualViewport.ts` (visualViewport + `KeyboardVisibleContext`) |
| Bottom sheets | `parts/mobile/mobilePickerSheet.ts` (880 lines) |
| Touch targets | `sessions/browser/media/phoneLayout.css` — 44 px minimums, `touch-action: manipulation`, `overscroll-behavior: contain` |
| Tests | `sessions/test/browser/mobileSessionsPart.test.ts`, `contrib/layout/test/browser/mobileSessionLayoutController.test.ts`, and three more |

`SessionsLayoutPolicy` is an observable-driven policy object: `update(width,
height)` is called from the workbench `layout()` pass, it classifies the
viewport, and `viewportClass` / `isPhoneLayout` are observables that drive part
visibility (`getPartVisibilityDefaults`) and sizing (`getPartSizes`). The
workbench toggles a `phone-layout` CSS class on its main container
(`sessions/browser/workbench.ts:1673`).

Critically, these primitives are **portable**: they import from `vs/base`,
`vs/platform`, and `vs/workbench/services/layout/browser/layoutService.js` — the
*main* workbench's layout service — not from sessions-specific types.
`parts/mobile/mobileLayout.ts` is 33 lines and imports only
`IWorkbenchLayoutService`.

The Agent Sessions workbench is not a substitute for the code editor, so we
cannot simply serve it. But its mobile layer is a proven, Microsoft-maintained
reference implementation of exactly what the plan proposed inventing.

### F5 — TDD is possible but not via the root test runner

- Root Jest cannot test code under `lib/vscode`: `ci/dev/test-unit.sh` restricts
  to `./test/unit/.*ts` and `package.json` ignores `/lib/`.
- `lib/vscode` has its own Mocha harnesses:
  `npm run test-node -- --run src/vs/<area>/test/node/<name>.test.ts` and
  `npm run test-browser-no-install -- --browser chromium --run src/vs/<area>/test/browser/<name>.test.ts`.
  They run against compiled output in `lib/vscode/out`.
- code-server's CI does **not** run Code's tests. `docs/CONTRIBUTING.md` states
  that doing so is a future goal.
- **The root Playwright config cannot currently express a touch test.**
  `test/playwright.config.ts` defines one headless Chromium project with no
  `baseURL`, `webServer`, `devices[...]`, `viewport`, `isMobile`, or `hasTouch`.
  `page.tap()` fails without `hasTouch: true`.
- Cost of the production loop, measured from code-server CI: `Build vscode`
  takes 9m45s–12m21s uncached; a full root e2e run takes 2m23s; full pipeline
  wall-clock 15m43s–18m25s. Iterating via full builds is not viable; `npm run
  watch` plus a single targeted spec is.

### F6 — Worktrees do not carry the submodule

Verified empirically: `git worktree add` produces a tree with `patches/` present
but `lib/vscode` empty. Each parallel worktree needs its own
`git submodule update --init` (fast — objects are shared via `.git/modules`),
`quilt push -a`, and its own `npm install` inside `lib/vscode` (multi-GB, slow).
Four parallel worktrees multiply that cost fourfold.

## Decisions

**D1 — Harvest, do not invent.** Port the proven mobile layer from
`src/vs/sessions/browser/parts/mobile/**` and `layoutPolicy.ts` into a shared
location usable by the main workbench, rather than writing new `ScreenMode`,
`LayoutStrategy`, `ScreenModeObserver`, and `MobileFocusState` classes. Where the
plan's names map onto existing types, the existing type wins:

| Plan concept | Existing type to reuse |
| --- | --- |
| `ScreenMode` | `ViewportClass` (`layoutPolicy.ts`) |
| `LayoutStrategy` | `getPartVisibilityDefaults()` / `getPartSizes()` |
| `ScreenModeObserver` | `viewportClass` observable + `update()` from `layout()` |
| `MobileFocusState` | `MobileNavigationStack` |
| `PointerInputAdapter` | `Gesture` (`base/browser/touch.ts`) |

**D2 — No `PointerInputAdapter`.** Per F2, Code already has a working input
adapter. Adding a second one would fragment input handling and regress desktop.
Where a specific control is found to be touch-dead, the fix is to add
`Gesture.addTarget` and a `Tap` listener to that control, not to build a parallel
input stack.

**D3 — Scope the first increment to layout, not input.** F3 is the real defect
and F2 shows input largely is not. The first deliverable is a viewport policy
plus a compact layout for the main workbench.

**D4 — Gate on viewport width, not on `isMobile`.** `layoutPolicy.ts`
deliberately gates phone classification on the `isMobile` user-agent flag so that
narrowing a desktop window does not trigger phone mode. For code-server that gate
is wrong in both directions: it blocks a narrow desktop browser from getting a
usable layout, and — since Samsung DeX keeps the Android `Mobi` user agent — it
is the mechanism by which DeX must be handled. We classify on **container width**
from the `layout()` pass, which changes live on DeX plug/unplug, rotation, and
window resize, with no reload and no dependence on user-agent sniffing. A
user-facing setting overrides the automatic classification.

**D5 — Ship as one new quilt patch, appended before `csp-hashes.diff`.** The
patch adds new files under `lib/vscode/src/vs/workbench/browser/` and makes
minimal edits to `layout.ts`. Keeping additions in new files rather than large
in-place edits minimizes rebase pain on each Code upgrade, which is the stated
project concern in `docs/CONTRIBUTING.md`.

**D6 — Test strategy.** Add a `Mobile Chromium` Playwright project
(`viewport: 390×844`, `isMobile: true`, `hasTouch: true`) to
`test/playwright.config.ts` so `page.tap()` is valid — this is a prerequisite for
any touch test and is the first commit. Unit-test the pure policy object via
Code's own Mocha browser runner. Do not claim mobile e2e coverage from the
existing desktop-only Chromium project.

**D7 — Sequential increments in one worktree, not four parallel ones.** Per F6
the parallel-worktree plan multiplies a multi-GB, multi-minute setup by four, and
per D1 the four workstreams are no longer independent — they now share one policy
object and one patch. The work is sequenced instead.

## Consequences

- The `PointerInputAdapter` and bespoke `LayoutStrategy` work is cancelled;
  effort moves to the layout defect that actually exists.
- We inherit Microsoft's mobile primitives and their maintenance, at the cost of
  tracking their churn across Code upgrades.
- Because the primitives already depend on `IWorkbenchLayoutService`, porting is
  adaptation rather than rewrite.
- Desktop behavior is unchanged by construction: the desktop branch of the policy
  returns today's defaults, and the compact branch is only reachable below the
  phone breakpoint.
- Object Calisthenics / SOLID constraints from the original brief are honored by
  the harvested design (policy object with observables, parts chosen by
  subclassing, no `else` chains) — but they are applied to Microsoft's existing
  idioms, not imposed on top of them, since the patch must stay rebasable.

## Open questions

- Whether DeX reports `pointer: fine` / `any-pointer: coarse` reliably enough to
  refine the width-only classification. Width-only is the safe default and is
  what ships first.
- Whether `mobileVisualViewport.ts` can be reused as-is for the editor's
  on-screen-keyboard behavior, which matters more for a code editor than for a
  chat surface.

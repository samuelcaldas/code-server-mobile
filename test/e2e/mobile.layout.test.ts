import { describe, test, expect } from "./baseFixture"

/**
 * Acceptance tests for the compact (phone) workbench layout.
 *
 * These run only under the "Mobile Chromium" project, which supplies a
 * 390x844 viewport and a touch-enabled context. See test/playwright.config.ts.
 *
 * The contract under test is defined in docs/adr/0001-responsive-workbench.md:
 * below the phone breakpoint the workbench classifies its viewport as `phone`,
 * marks the container with the `phone-layout` class, and hides the sidebar and
 * panel by default so the editor owns the viewport.
 */
describe("mobile layout", ["--disable-workspace-trust"], {}, () => {
  test("should classify a phone viewport and mark the workbench", async ({ codeServerPage }) => {
    const workbench = codeServerPage.page.locator("div.monaco-workbench")
    await expect(workbench).toBeVisible()
    await expect(workbench).toHaveClass(/phone-layout/)
  })

  test("should hide the sidebar by default so the editor owns the viewport", async ({ codeServerPage }) => {
    await expect(codeServerPage.page.locator("div.monaco-workbench")).toHaveClass(/phone-layout/)
    // The sidebar is an overlay in compact mode, not a permanent split.
    await expect(codeServerPage.page.locator(".part.sidebar")).toBeHidden()
  })

  test("should give activity bar items a 44px minimum touch target", async ({ codeServerPage }) => {
    await expect(codeServerPage.page.locator("div.monaco-workbench")).toHaveClass(/phone-layout/)

    const target = codeServerPage.page.locator(".part.activitybar .action-item > .action-label").first()
    await expect(target).toBeVisible()

    const box = await target.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  })

  test("should restore desktop part visibility after a live transition", async ({ codeServerPage }) => {
    const workbench = codeServerPage.page.locator("div.monaco-workbench")
    const sidebar = codeServerPage.page.locator(".part.sidebar")

    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(sidebar).toBeHidden()

    // Widening past the breakpoint models plugging into DeX. The workbench must
    // restore its desktop layout in place rather than reload and lose state.
    await codeServerPage.page.setViewportSize({ width: 1280, height: 800 })

    await expect(workbench).not.toHaveClass(/phone-layout/)
    await expect(sidebar).toBeVisible()
  })
})

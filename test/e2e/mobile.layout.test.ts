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
    // Compact mode reserves the viewport for the editor until mobile
    // navigation provides a dedicated non-grid overlay.
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

  test("should keep compact layout through rotation and restore it for DeX", async ({ codeServerPage }) => {
    const workbench = codeServerPage.page.locator("div.monaco-workbench")
    const sidebar = codeServerPage.page.locator(".part.sidebar")

    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(sidebar).toBeHidden()

    // Rotation changes both dimensions but remains phone geometry. No reload or
    // desktop split should interrupt the editor between portrait and landscape.
    await codeServerPage.page.setViewportSize({ width: 844, height: 390 })

    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(sidebar).toBeHidden()

    // Widening past the desktop breakpoint models plugging into DeX.
    await codeServerPage.page.setViewportSize({ width: 1280, height: 800 })

    await expect(workbench).not.toHaveClass(/phone-layout/)
    await expect(sidebar).toBeVisible()
  })
})

describe("mobile layout persistence", ["--disable-workspace-trust"], {}, () => {
  test("should retain desktop visibility choices across compact reload", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const workbench = page.locator("div.monaco-workbench")
    const sidebar = page.locator(".part.sidebar")
    const panel = page.locator(".part.panel")

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(workbench).not.toHaveClass(/phone-layout/)

    if (await sidebar.isVisible()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Primary Side Bar Visibility")
    }
    if (await panel.isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Panel Visibility")
    }
    if (await page.locator("#workbench\\.parts\\.editor").isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Panel")
    }

    await expect(sidebar).toBeHidden()
    await expect(panel).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(sidebar).toBeHidden()
    await expect(panel).toBeHidden()

    await codeServerPage.stateFlush()
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(workbench).not.toHaveClass(/phone-layout/)
    await expect(sidebar).toBeHidden()
    await expect(panel).toBeVisible()
  })
})

describe("mobile layout maximized panel startup", ["--disable-workspace-trust"], {}, () => {
  test("should show the editor when compact startup follows a maximized panel", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const workbenchUrl = page.url()

    const desktopEditor = page.locator("#workbench\\.parts\\.editor")
    const desktopPanel = page.locator(".part.panel")
    await page.setViewportSize({ width: 1280, height: 800 })
    if (await desktopPanel.isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Panel Visibility")
    }
    if (await desktopEditor.isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Panel")
    }
    await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Panel")
    await expect(desktopEditor).toBeHidden()

    await codeServerPage.stateFlush()
    await page.goto("about:blank")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(workbenchUrl)
    await codeServerPage.reloadUntilEditorIsReady()

    const workbench = page.locator("div.monaco-workbench")
    const editor = page.locator("#workbench\\.parts\\.editor")
    const panel = page.locator(".part.panel")
    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(editor).toBeVisible()
    await expect(panel).toBeHidden()

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(workbench).not.toHaveClass(/phone-layout/)
    await expect(editor).toBeHidden()
    await expect(panel).toBeVisible()
  })
})

describe("mobile layout hidden maximized panel", ["--disable-workspace-trust"], {}, () => {
  test("should preserve the panel remember-last maximized state", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const editor = page.locator("#workbench\\.parts\\.editor")
    const panel = page.locator(".part.panel")

    await page.setViewportSize({ width: 1280, height: 800 })
    if (await panel.isHidden()) {
      await page.keyboard.press("ControlOrMeta+J")
    }
    if (await editor.isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Panel")
    }
    await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Panel")
    await expect(editor).toBeHidden()
    await page.keyboard.press("ControlOrMeta+J")
    await expect(panel).toBeHidden()
    await expect(editor).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.keyboard.press("ControlOrMeta+J")

    await expect(editor).toBeHidden()
    await expect(panel).toBeVisible()
  })
})

describe("mobile layout maximized auxiliary bar", ["--disable-workspace-trust"], {}, () => {
  test("should keep phone parts hidden and restore auxiliary state", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const workbench = page.locator("div.monaco-workbench")
    const editor = page.locator("#workbench\\.parts\\.editor")
    const sidebar = page.locator(".part.sidebar")
    const panel = page.locator(".part.panel")
    const auxiliaryBar = page.locator(".part.auxiliarybar")

    await page.setViewportSize({ width: 1280, height: 800 })
    if (await auxiliaryBar.isHidden()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Secondary Side Bar Visibility")
    }
    if (await panel.isVisible()) {
      await codeServerPage.executeCommandViaMenus("View: Toggle Panel Visibility")
    }
    await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Secondary Side Bar")
    await expect(editor).toBeHidden()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(workbench).toHaveClass(/phone-layout/)
    await expect(editor).toBeVisible()
    await expect(sidebar).toBeHidden()
    await expect(panel).toBeHidden()
    await expect(auxiliaryBar).toBeHidden()

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(editor).toBeHidden()
    await expect(auxiliaryBar).toBeVisible()

    await codeServerPage.executeCommandViaMenus("View: Toggle Maximized Secondary Side Bar")
    await expect(editor).toBeVisible()
    await expect(sidebar).toBeVisible()
    await expect(panel).toBeHidden()
  })
})

describe("mobile navigation overlays", ["--disable-workspace-trust"], {}, () => {
  test("should open Explorer without resizing the editor", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const editor = page.locator("#workbench\\.parts\\.editor")
    const explorer = page.getByRole("tab", { name: /Explorer/ })

    await expect(editor).toBeVisible()
    const editorBoundsBefore = await editor.boundingBox()
    expect(editorBoundsBefore).not.toBeNull()

    await expect(explorer).toBeVisible()
    await explorer.tap()

    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeVisible()
    await expect(page.locator(".mobile-navigation-backdrop")).toBeVisible()
    expect(await editor.boundingBox()).toEqual(editorBoundsBefore)
  })

  test("should move from Explorer to editing and Source Control by touch", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const overlay = page.locator(".mobile-navigation-overlay--sidebar")
    const explorer = page.getByRole("tab", { name: /Explorer/ })
    const sourceControl = page.getByRole("tab", { name: /Source Control/ })

    await explorer.tap()
    await expect(overlay).toBeVisible()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()

    await expect(overlay).toBeHidden()
    await expect(page.locator(".tabs-container .tab", { hasText: "config.yaml" })).toBeVisible()
    await expect(page.locator("#workbench\\.parts\\.editor .monaco-editor.focused")).toBeVisible()

    await sourceControl.tap()
    await expect(overlay).toBeVisible()
    await expect(sourceControl).toHaveAttribute("aria-selected", "true")
  })

  test("should open the panel as a bottom sheet", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const editor = page.locator("#workbench\\.parts\\.editor")
    const panelToggle = page.getByRole("button", { name: /Toggle Panel/ })

    const editorBoundsBefore = await editor.boundingBox()
    expect(editorBoundsBefore).not.toBeNull()

    await panelToggle.tap()

    const panel = page.locator(".mobile-navigation-overlay--panel")
    await expect(panel).toBeVisible()
    const panelBounds = await panel.boundingBox()
    expect(panelBounds).not.toBeNull()
    expect(panelBounds!.height).toBeLessThan(editorBoundsBefore!.height)
    expect(panelBounds!.y + panelBounds!.height).toBe(editorBoundsBefore!.y + editorBoundsBefore!.height)
    expect(await editor.boundingBox()).toEqual(editorBoundsBefore)
  })

  test("should dismiss overlays through touch, Escape, and browser Back", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const overlay = page.locator(".mobile-navigation-overlay--sidebar")
    const backdrop = page.locator(".mobile-navigation-backdrop")
    const explorer = page.getByRole("tab", { name: /Explorer/ })
    const search = page.getByRole("tab", { name: /Search/ })
    const sourceControl = page.getByRole("tab", { name: /Source Control/ })

    await explorer.focus()
    await explorer.tap()
    await expect(overlay).toBeVisible()
    const backdropBounds = await backdrop.boundingBox()
    expect(backdropBounds).not.toBeNull()
    await backdrop.tap({ position: { x: backdropBounds!.width - 1, y: backdropBounds!.height / 2 } })
    await expect(overlay).toBeHidden()
    await expect(explorer).toBeFocused()

    await search.focus()
    await search.tap()
    await expect(overlay).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(overlay).toBeHidden()
    await expect(search).toBeFocused()

    await sourceControl.focus()
    await sourceControl.tap()
    await expect(overlay).toBeVisible()
    await page.evaluate(() => history.back())
    await expect(overlay).toBeHidden()
    await expect(sourceControl).toBeFocused()
  })

  test("should dismiss Quick Input before the navigation overlay", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const overlay = page.locator(".mobile-navigation-overlay--sidebar")
    const explorer = page.getByRole("tab", { name: /Explorer/ })
    const quickInput = page.locator(".quick-input-widget")

    await explorer.tap()
    await expect(overlay).toBeVisible()
    await page.keyboard.press("ControlOrMeta+P")
    await expect(quickInput).toBeVisible()

    await page.keyboard.press("Escape")

    await expect(quickInput).toBeHidden()
    await expect(overlay).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(overlay).toBeHidden()
  })

  test("should restore the desktop sidebar selection after compact navigation", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const workbench = page.locator("div.monaco-workbench")
    const explorer = page.getByRole("tab", { name: /Explorer/ })
    const search = page.getByRole("tab", { name: /Search/ })

    await page.setViewportSize({ width: 1280, height: 800 })
    if ((await explorer.getAttribute("aria-selected")) !== "true") {
      await explorer.tap()
    }
    await expect(explorer).toHaveAttribute("aria-selected", "true")

    await page.setViewportSize({ width: 390, height: 844 })
    await search.tap()
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeVisible()
    await expect(search).toHaveAttribute("aria-selected", "true")

    await page.setViewportSize({ width: 1280, height: 800 })

    await expect(workbench).not.toHaveClass(/phone-layout/)
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeHidden()
    await expect(explorer).toHaveAttribute("aria-selected", "true")
  })
})

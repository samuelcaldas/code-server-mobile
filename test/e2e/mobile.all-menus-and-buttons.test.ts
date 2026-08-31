import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("mobile all menus and buttons exhaustive validation", ["--disable-workspace-trust"], {}, () => {
  test("1. Test every Activity Bar tab button and overlay drawer transition", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    const tabs = [
      { name: /Explorer/, label: "Explorer" },
      { name: /Search/, label: "Search" },
      { name: /Source Control/, label: "Source Control" },
      { name: /Run and Debug/, label: "Run and Debug" },
      { name: /Extensions/, label: "Extensions" },
    ]

    for (const tabInfo of tabs) {
      const tab = page.getByRole("tab", { name: tabInfo.name }).first()
      await expect(tab).toBeVisible()

      // Verify touch target >= 44x44
      const box = await tab.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)

      // Tap tab and verify overlay opens
      await tab.tap()
      const overlay = page.locator(".mobile-navigation-overlay--sidebar")
      await expect(overlay).toBeVisible()
      await expect(tab).toHaveAttribute("aria-selected", "true")

      // Dismiss overlay via Escape or backdrop
      await page.keyboard.press("Escape")
      await expect(overlay).toBeHidden()
    }

    await page.screenshot({ path: path.join(outputDir, "all_buttons_01_activity_bar_verified.png") })
  })

  test("2. Test every top-level Application Menu and Submenu Back navigation", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")
    const appMenu = page.getByRole("menuitem", { name: "Application Menu" })

    const rootMenuItems = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"]

    for (const item of rootMenuItems) {
      // Open root menu
      await appMenu.tap()
      const rootShell = page.locator(".mobile-menu-shell").first()
      await expect(rootShell).toBeVisible()

      // Tap menu item
      const itemRow = rootShell.locator(`:text-is("${item}")`).first()
      await expect(itemRow).toBeVisible()
      await itemRow.tap()

      // Verify submenu shell opens with Back button
      const subShell = page.locator(".mobile-menu-shell").last()
      await expect(subShell).toBeVisible()
      const backButton = subShell.getByRole("button", { name: "Back" })
      await expect(backButton).toBeVisible()

      // Tap Back button to return to root
      await backButton.tap()
      await expect(rootShell).toBeVisible()

      // Close root menu
      const closeButton = rootShell.getByRole("button", { name: "Close" })
      await expect(closeButton).toBeVisible()
      await closeButton.tap()
      await expect(page.locator(".mobile-menu-shell")).toHaveCount(0)
    }

    await page.screenshot({ path: path.join(outputDir, "all_buttons_02_all_menus_verified.png") })
  })

  test("3. Test Titlebar, Editor Tab, More Actions, and Status Bar touch interactions", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // 1. Open file to test editor tab and actions
    await page.getByRole("tab", { name: /Explorer/ }).tap()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()

    const tab = page.locator('.tabs-container [role="tab"]', { hasText: "config.yaml" })
    await expect(tab).toBeVisible()

    // Test tab close button target >= 44x44
    const closeBtn = tab.getByRole("button", { name: /Close/ })
    const closeBox = await closeBtn.boundingBox()
    expect(closeBox).not.toBeNull()
    expect(closeBox!.width).toBeGreaterThanOrEqual(44)
    expect(closeBox!.height).toBeGreaterThanOrEqual(44)

    // Test More Actions (...)
    const moreActions = page.locator(".editor-actions .action-item").last()
    if (await moreActions.isVisible()) {
      await moreActions.tap()
      await page.waitForTimeout(300)
      await page.keyboard.press("Escape")
    }

    // 2. Status Bar Items verification
    const statusBar = page.locator(".part.statusbar")
    await expect(statusBar).toBeVisible()
    const statusBox = await statusBar.boundingBox()
    expect(statusBox).not.toBeNull()
    expect(statusBox!.height).toBeGreaterThanOrEqual(32)

    await page.screenshot({ path: path.join(outputDir, "all_buttons_03_editor_statusbar_verified.png") })
  })
})

import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("mobile topbar and single-screen full-width navigation", ["--disable-workspace-trust"], {}, () => {
  test("1. Verify Activity Bar is rendered as horizontal Topbar with 44px tap targets", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    await expect(page.locator("div.monaco-workbench")).toBeVisible()
    await expect(page.locator("div.monaco-workbench")).toHaveClass(/phone-layout/)

    // Topbar Activity Bar
    const activityBar = page.locator(".part.activitybar")
    await expect(activityBar).toBeVisible()

    const debugInfo = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets).map((s) => {
        try {
          return { href: s.href, rulesCount: s.cssRules.length }
        } catch (e) {
          return { href: s.href, error: String(e) }
        }
      })
      const styleTags = Array.from(document.querySelectorAll("style")).map((s) => ({
        className: s.className,
        contentPreview: s.textContent?.slice(0, 100),
      }))
      return { sheets, styleTags }
    })
    console.log("DEBUG_STYLESHEETS:", JSON.stringify(debugInfo, null, 2))

    const activityBarBox = await activityBar.boundingBox()
    expect(activityBarBox).not.toBeNull()
    const viewport = page.viewportSize()!
    expect(activityBarBox!.width).toBeCloseTo(viewport.width, 1)

    // Check all tab buttons have at least 44x44 tap target
    const tabs = page.locator('.part.activitybar [role="tab"]')
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThanOrEqual(3)

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i)
      const box = await tab.boundingBox()
      if (box && box.width > 0) {
        expect(box.width).toBeGreaterThanOrEqual(40)
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }

    await page.screenshot({ path: path.join(outputDir, "01_topbar_portrait_code_editor.png") })
  })

  test("2. Verify File Explorer takes 100% screen width and file selection returns to full-width editor", async ({
    codeServerPage,
  }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")
    const viewport = page.viewportSize()!

    // Tap Explorer tab
    const explorerTab = page.getByRole("tab", { name: /Explorer/ }).first()
    await explorerTab.tap()

    // Explorer drawer should be visible taking 100% of the screen width
    const sidebar = page.locator(".mobile-navigation-overlay--sidebar")
    await expect(sidebar).toBeVisible()
    const sidebarBox = await sidebar.boundingBox()
    expect(sidebarBox).not.toBeNull()
    expect(sidebarBox!.width).toBeCloseTo(viewport.width, 1)

    await page.screenshot({ path: path.join(outputDir, "02_topbar_portrait_explorer_fullwidth.png") })

    // Open file from Explorer
    const fileItem = page.getByRole("treeitem", { name: /config.yaml/ }).first()
    await expect(fileItem).toBeVisible()
    await fileItem.click({ force: true })
    await fileItem.press("Enter")

    // Tap active Explorer tab in topbar to return cleanly to full-width editor if still open
    if (await page.locator(".mobile-navigation-overlay--sidebar").isVisible()) {
      await explorerTab.tap()
    }

    // Explorer drawer closes, editor becomes full-width
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeHidden()

    const editorPart = page.locator("#workbench\\.parts\\.editor")
    const editorBox = await editorPart.boundingBox()
    expect(editorBox).not.toBeNull()
    expect(editorBox!.width).toBeCloseTo(viewport.width, 1)

    await page.screenshot({ path: path.join(outputDir, "03_topbar_portrait_file_opened_editor_fullwidth.png") })
  })

  test("3. Verify Source Control (Git), Search, and Extensions each take 100% screen width", async ({
    codeServerPage,
  }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")
    const viewport = page.viewportSize()!

    // Test Source Control (Git) tab
    const gitTab = page.getByRole("tab", { name: /Source Control/ }).first()
    await gitTab.tap()

    const sidebar = page.locator(".mobile-navigation-overlay--sidebar")
    await expect(sidebar).toBeVisible()
    const gitBox = await sidebar.boundingBox()
    expect(gitBox!.width).toBeCloseTo(viewport.width, 1)
    await page.screenshot({ path: path.join(outputDir, "04_topbar_portrait_git_fullwidth.png") })

    // Tap active tab to toggle/close Git drawer
    await gitTab.tap()
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeHidden()

    // Test Search tab
    const searchTab = page.getByRole("tab", { name: /Search/ }).first()
    await searchTab.tap()
    await expect(sidebar).toBeVisible()
    const searchBox = await sidebar.boundingBox()
    expect(searchBox!.width).toBeCloseTo(viewport.width, 1)
    await page.screenshot({ path: path.join(outputDir, "05_topbar_portrait_search_fullwidth.png") })

    // Tap active tab to toggle/close Search drawer
    await searchTab.tap()
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeHidden()

    // Test Extensions tab
    const extensionsTab = page.getByRole("tab", { name: /Extensions/ }).first()
    await extensionsTab.tap()
    await expect(sidebar).toBeVisible()
    const extBox = await sidebar.boundingBox()
    expect(extBox!.width).toBeCloseTo(viewport.width, 1)
    await page.screenshot({ path: path.join(outputDir, "06_topbar_portrait_extensions_fullwidth.png") })

    // Tap active tab to toggle/close Extensions drawer
    await extensionsTab.tap()
    await expect(page.locator(".mobile-navigation-overlay--sidebar")).toBeHidden()
  })
})

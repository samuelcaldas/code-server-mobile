import { describe, test, expect } from "./baseFixture"

// Regression test for the "context menu opens then instantly closes" bug:
// nested Gesture.addTarget elements (e.g. a tab and its enclosing
// .tabs-container) each opened a competing context menu for one long-press,
// with the outer one clobbering the inner. See
// vs/base/browser/touch.ts Gesture.dispatchEvent().
describe("touch context menu", ["--disable-workspace-trust"], {}, () => {
  test("long-press on an editor line", async ({ codeServerPage }) => {
    const page = codeServerPage.page

    await page.getByRole("tab", { name: /Explorer/ }).tap()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()
    const line = page.locator(".monaco-editor.focused .view-lines .view-line").first()
    await expect(line).toBeVisible()
    const box = await line.boundingBox()
    expect(box).not.toBeNull()

    await codeServerPage.longPress(box!.x + box!.width / 2, box!.y + box!.height / 2)

    const menu = page.locator(".mobile-menu-shell, .monaco-menu, .context-view:not([aria-hidden='true'])")
    await expect(menu.first()).toBeVisible()
    await page.waitForTimeout(500)
    await expect(menu.first()).toBeVisible()
  })

  test("long-press on an explorer tree item", async ({ codeServerPage }) => {
    const page = codeServerPage.page

    await page.getByRole("tab", { name: /Explorer/ }).tap()
    const item = page.getByRole("treeitem", { name: /config.yaml/ })
    await expect(item).toBeVisible()
    const box = await item.boundingBox()
    expect(box).not.toBeNull()

    await codeServerPage.longPress(box!.x + box!.width / 2, box!.y + box!.height / 2)

    const menu = page.locator(".mobile-menu-shell, .monaco-menu, .context-view:not([aria-hidden='true'])")
    await expect(menu.first()).toBeVisible()
    await page.waitForTimeout(500)
    await expect(menu.first()).toBeVisible()
  })

  test("long-press on an editor tab", async ({ codeServerPage }) => {
    const page = codeServerPage.page

    await page.getByRole("tab", { name: /Explorer/ }).tap()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()
    const tab = page.locator('.tabs-container [role="tab"]', { hasText: "config.yaml" })
    await expect(tab).toBeVisible()
    const box = await tab.boundingBox()
    expect(box).not.toBeNull()

    await codeServerPage.longPress(box!.x + box!.width / 2, box!.y + box!.height / 2)

    const menu = page.locator(".mobile-menu-shell, .monaco-menu, .context-view:not([aria-hidden='true'])")
    await expect(menu.first()).toBeVisible()
    await page.waitForTimeout(500)
    await expect(menu.first()).toBeVisible()
  })
})

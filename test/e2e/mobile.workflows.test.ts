import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("mobile developer workflows", ["--disable-workspace-trust"], {}, () => {
  test("1. Create and edit a new file by touch", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // Open Application Menu -> File -> New Text File
    await codeServerPage.navigateMobileMenus(["File", "New Text File"])

    // Wait for editor tab Untitled-1
    await codeServerPage.waitForTab("Untitled-1")
    const editorTab = page.locator('.tabs-container [role="tab"]', { hasText: "Untitled-1" })
    await expect(editorTab).toBeVisible()

    // Type code into editor
    const editor = page.locator("#workbench\\.parts\\.editor .monaco-editor.focused, #workbench\\.parts\\.editor .monaco-editor")
    await editor.first().click()
    await page.keyboard.insertText("// Mobile TypeScript Function\nfunction calculateTotal(items: number[]): number {\n  return items.reduce((sum, item) => sum + item, 0);\n}\nconsole.log(calculateTotal([10, 20, 30]));\n")

    await expect(editorTab).toHaveClass(/dirty/)
    await page.screenshot({ path: path.join(outputDir, "01_wf_new_file_edited.png") })
  })

  test("2. Open existing file from Explorer overlay drawer", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    const explorerTab = page.getByRole("tab", { name: /Explorer/ })
    await explorerTab.tap()

    const sidebarOverlay = page.locator(".mobile-navigation-overlay--sidebar")
    await expect(sidebarOverlay).toBeVisible()

    const fileItem = page.getByRole("treeitem", { name: /config.yaml/ })
    await expect(fileItem).toBeVisible()
    await fileItem.tap()

    await expect(sidebarOverlay).toBeHidden()
    const activeTab = page.locator('.tabs-container [role="tab"]', { hasText: "config.yaml" })
    await expect(activeTab).toBeVisible()

    await page.screenshot({ path: path.join(outputDir, "02_wf_explorer_file_opened.png") })
  })

  test("3. Trigger context menu via long-press touch on editor and tree", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // Open file
    await page.getByRole("tab", { name: /Explorer/ }).tap()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()

    // Locate line in editor
    const line = page.locator(".monaco-editor.focused .view-lines .view-line").first()
    await expect(line).toBeVisible()
    const box = await line.boundingBox()
    expect(box).not.toBeNull()

    // Simulate touch long-press (800ms)
    await codeServerPage.longPress(box!.x + box!.width / 2, box!.y + box!.height / 2)

    // Context menu should appear and stay open
    const contextMenu = page.locator(".mobile-menu-shell, .monaco-menu, .context-view:not([aria-hidden='true'])")
    await expect(contextMenu.first()).toBeVisible()
    await page.waitForTimeout(500)
    await expect(contextMenu.first()).toBeVisible()

    await page.screenshot({ path: path.join(outputDir, "03_wf_editor_context_menu.png") })
  })

  test("4. Track git modifications and review diff in Source Control", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // Open file and add modification
    await page.getByRole("tab", { name: /Explorer/ }).tap()
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()
    const editor = page.locator("#workbench\\.parts\\.editor .monaco-editor").first()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.insertText("\n# Mobile touch workflow edit")
    await page.keyboard.press("ControlOrMeta+S")
    await codeServerPage.stateFlush()

    // Open Source Control drawer
    const scmTab = page.getByRole("tab", { name: /Source Control/ })
    await scmTab.tap()

    const sidebarOverlay = page.locator(".mobile-navigation-overlay--sidebar")
    await expect(sidebarOverlay).toBeVisible()
    await expect(scmTab).toHaveAttribute("aria-selected", "true")

    // View changes list
    const changeItem = page.locator('.monaco-list-row :text("config.yaml")').first()
    if (await changeItem.isVisible()) {
      await changeItem.tap()
    }

    await page.screenshot({ path: path.join(outputDir, "04_wf_git_diff_drawer.png") })
    await page.keyboard.press("Escape")
  })

  test("5. Command Center search and quick input filtering", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    const quickInput = page.locator(".quick-input-widget")
    await page.keyboard.press("ControlOrMeta+P")
    await expect(quickInput).toBeVisible()

    await page.keyboard.type(">View: Toggle")
    await page.waitForTimeout(400)

    await page.screenshot({ path: path.join(outputDir, "05_wf_command_palette.png") })
    await page.keyboard.press("Escape")
    await expect(quickInput).toBeHidden()
  })

  test("6. Integrated terminal execution in bottom sheet panel", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // Open terminal via mobile Command Center
    const commandCenter = page.locator(".part.titlebar .command-center")
    await commandCenter.tap()
    const quickInput = page.locator(".quick-input-widget")
    await expect(quickInput).toBeVisible()
    await page.keyboard.type(">View: Toggle Terminal")
    await page.keyboard.press("Enter")

    // Verify bottom sheet panel is visible
    const panel = page.locator(".mobile-navigation-overlay--panel, .part.panel")
    await expect(panel).toBeVisible()

    // Send shell command
    await page.keyboard.type("echo 'Mobile Touch IDE Ready!'\n")
    await page.waitForTimeout(1000)

    await page.screenshot({ path: path.join(outputDir, "06_wf_terminal_bottom_sheet.png") })
  })
})

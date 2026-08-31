import * as path from "path"
import { describe, test, expect } from "./baseFixture"

describe("mobile visual validation", ["--disable-workspace-trust"], {}, () => {
  test("should capture mobile UI screenshots across states", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    const outputDir = path.join(__dirname, "../../.playwright-mcp")

    // 1. Mobile Workbench Portrait
    await expect(page.locator("div.monaco-workbench")).toBeVisible()
    await expect(page.locator("div.monaco-workbench")).toHaveClass(/phone-layout/)
    await page.screenshot({ path: path.join(outputDir, "01_mobile_workbench_portrait.png") })

    // 2. Mobile Explorer Navigation Overlay Drawer
    const explorerTab = page.getByRole("tab", { name: /Explorer/ })
    await explorerTab.tap()
    const sidebarOverlay = page.locator(".mobile-navigation-overlay--sidebar")
    await expect(sidebarOverlay).toBeVisible()
    await page.screenshot({ path: path.join(outputDir, "02_mobile_explorer_drawer.png") })

    // Open a file
    await page.getByRole("treeitem", { name: /config.yaml/ }).tap()
    await expect(sidebarOverlay).toBeHidden()
    await expect(page.locator(".tabs-container .tab", { hasText: "config.yaml" })).toBeVisible()
    await page.screenshot({ path: path.join(outputDir, "03_mobile_editor_open.png") })

    // 3. Mobile Full-Screen Menu Shell
    const appMenu = page.getByRole("menuitem", { name: "Application Menu" })
    await appMenu.tap()
    const menuShell = page.locator(".mobile-menu-shell").last()
    await expect(menuShell).toBeVisible()
    await page.screenshot({ path: path.join(outputDir, "04_mobile_menu_root.png") })

    // 4. Submenu Drill-down
    await menuShell.locator(':text-is("File")').tap()
    const subMenuShell = page.locator(".mobile-menu-shell").last()
    await expect(subMenuShell.getByRole("button", { name: "Back" })).toBeVisible()
    const rootStructure = await menuShell.evaluate((el) => {
      const items = Array.from(el.querySelectorAll(".actions-container > .action-item"))
      return items.map((it) => ({
        text: it.textContent?.trim().slice(0, 15),
        display: window.getComputedStyle(it).display,
        hasSubmenu: !!it.querySelector(".monaco-submenu"),
      }))
    })
    console.log("DEBUG_ROOT_STRUCTURE:", JSON.stringify(rootStructure))
    await page.screenshot({ path: path.join(outputDir, "05_mobile_menu_submenu.png") })

    // Close menu
    const backButton = subMenuShell.getByRole("button", { name: "Back" })
    await backButton.tap()
    const rootShell = page.locator(".mobile-menu-shell").first()
    await expect(rootShell).toBeVisible()
    const closeButton = rootShell.getByRole("button", { name: "Close" })
    await expect(closeButton).toBeVisible()
    await closeButton.tap()
    await expect(page.locator(".mobile-menu-shell")).toHaveCount(0)

    // 5. Mobile Landscape Orientation
    await page.setViewportSize({ width: 844, height: 390 })
    await expect(page.locator("div.monaco-workbench")).toHaveClass(/phone-layout/)
    await page.screenshot({ path: path.join(outputDir, "06_mobile_workbench_landscape.png") })
  })
})

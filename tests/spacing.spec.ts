import { test, expect } from '@playwright/test'

async function getInlinePadding(page, selector: string) {
  const styles = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      pl: parseFloat(cs.paddingLeft || '0'),
      pr: parseFloat(cs.paddingRight || '0'),
    }
  }, selector)
  return styles as { pl: number; pr: number } | null
}

test.describe('Public pages spacing baseline', () => {
  for (const route of ['/login', '/signup']) {
    test(`content-x present and scales on ${route}`, async ({ page, browserName }) => {
      await page.goto(route)

      // page shell
      const shell = page.locator('.content-x').first()
      await expect(shell).toBeVisible()

      // mobile width ~390
      await page.setViewportSize({ width: 390, height: 800 })
      const m = await getInlinePadding(page, '.content-x')
      expect(m).toBeTruthy()
      if (!m) return
      expect(Math.abs(m.pl - m.pr)).toBeLessThanOrEqual(1)
      const mobile = (m.pl + m.pr) / 2

      // desktop width >= 1024
      await page.setViewportSize({ width: 1200, height: 800 })
      const d = await getInlinePadding(page, '.content-x')
      expect(d).toBeTruthy()
      if (!d) return
      expect(Math.abs(d.pl - d.pr)).toBeLessThanOrEqual(1)
      const desktop = (d.pl + d.pr) / 2

      // desktop padding should be >= mobile padding
      expect(desktop).toBeGreaterThanOrEqual(mobile)
    })
  }
})


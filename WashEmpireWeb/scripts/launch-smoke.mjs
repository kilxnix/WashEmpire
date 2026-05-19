import { existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const host = '127.0.0.1'
const port = await getAvailablePort()
const baseUrl = `http://${host}:${port}`
const qaDir = join(process.cwd(), 'qa')

if (!existsSync(qaDir)) {
  mkdirSync(qaDir, { recursive: true })
}

const browserPath = detectBrowserPath()
if (!browserPath) {
  throw new Error('[launch-smoke] No Chromium-based browser found. Install Chrome/Edge or set BROWSER_PATH.')
}

const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
if (!existsSync(viteBin)) {
  throw new Error('[launch-smoke] Vite CLI is missing. Run npm install before smoke testing.')
}

const preview = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
  windowsHide: true,
})

try {
  await waitForPreview(preview, baseUrl)

  const browser = await chromium.launch({ executablePath: browserPath, headless: true })
  try {
    await runDesktopCheck(browser, baseUrl)
    await runMobileCheck(browser, baseUrl)
  } finally {
    await browser.close()
  }
} finally {
  preview.kill('SIGTERM')
  if (preview.pid) {
    spawnSync('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
  }
  preview.removeAllListeners()
}

console.log('[launch-smoke] Wrote screenshots to qa/.')

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('[launch-smoke] Could not reserve a local preview port.'))
          return
        }
        resolve(address.port)
      })
    })
  })
}

function detectBrowserPath() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean)

  return candidates.find((path) => existsSync(path))
}

function waitForPreview(previewProc, url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(poll)
      reject(new Error('[launch-smoke] Vite preview did not become ready in 25s.'))
    }, 25_000)

    let settled = false
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      clearInterval(poll)
      fn(value)
    }
    const poll = setInterval(async () => {
      try {
        const response = await fetch(url)
        if (response.ok) settle(resolve)
      } catch {
        // Preview is still starting.
      }
    }, 500)

    previewProc.on('exit', (code) => {
      settle(reject, new Error(`[launch-smoke] Vite preview exited early with code ${code ?? 'unknown'}.`))
    })

    previewProc.on('error', (error) => {
      settle(reject, new Error(`[launch-smoke] Could not start Vite preview. ${error.message}`))
    })
  })
}

async function runDesktopCheck(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

    await startFromMenu(page, 'desktop')

    const hud = page.locator('[aria-label="Wash Empire controls"]')
    await hud.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => null)
    if (!(await hud.isVisible())) {
      await startFromMenu(page, 'desktop')
      await hud.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => null)
    }
    if (!(await hud.isVisible())) {
      throw new Error('[launch-smoke] HUD did not appear after starting game on desktop.')
    }

    await waitForSceneSettle(page, 'desktop')
    await page.screenshot({ path: join(qaDir, 'launch-smoke-desktop.png'), fullPage: true })
  } finally {
    await context.close()
  }
}

async function runMobileCheck(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

    const startMenu = page.locator('[aria-label="Start game"]')
    await startMenu.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => null)
    if (!(await startMenu.isVisible())) {
      throw new Error('[launch-smoke] Start menu is missing on mobile.')
    }
    await page.screenshot({ path: join(qaDir, 'launch-smoke-mobile-start-menu.png'), fullPage: true })

    const hud = page.locator('[aria-label="Wash Empire controls"]')
    await ensureHudFromStartMenu(page, hud, 'mobile')

    const upgradesButton = page.locator('button[title="Upgrades"]').first()
    const mapButton = page.locator('button[title="City map"]').first()
    if (!(await upgradesButton.isVisible().catch(() => false)) || !(await mapButton.isVisible().catch(() => false))) {
      await startFromMenu(page, 'mobile')
    }
    if (!(await upgradesButton.isVisible()) || !(await mapButton.isVisible())) {
      throw new Error('[launch-smoke] Core HUD actions (Upgrades/Map) are missing on mobile.')
    }

    await waitForSceneSettle(page, 'mobile')
    await page.screenshot({ path: join(qaDir, 'launch-smoke-mobile-hud.png'), fullPage: true })

    const upgradesPanel = page.locator('aside.upgrade-drawer[aria-hidden="false"]')
    const upgradesOpened = await openHudPanel(page, upgradesButton, upgradesPanel)
    if (!upgradesOpened) {
      throw new Error('[launch-smoke] Upgrades panel did not open on mobile.')
    }
    await page.screenshot({ path: join(qaDir, 'launch-smoke-mobile-upgrades.png'), fullPage: true })

    const closeUpgrades = page.locator('button[title="Close upgrades"]').first()
    await closeUpgrades.click({ force: true })
    await page.locator('aside.upgrade-drawer[aria-hidden="true"]').waitFor({ state: 'attached', timeout: 4_000 }).catch(() => null)
    await page.waitForTimeout(300)

    const mapPanel = page.locator('aside.city-drawer[aria-hidden="false"]')
    const mapOpened = await openHudPanel(page, mapButton, mapPanel)
    if (!mapOpened) {
      throw new Error('[launch-smoke] Map panel did not open on mobile.')
    }
    await page.screenshot({ path: join(qaDir, 'launch-smoke-mobile-map.png'), fullPage: true })

    await page.screenshot({ path: join(qaDir, 'launch-smoke-mobile.png'), fullPage: true })
  } finally {
    await context.close()
  }
}

async function ensureHudFromStartMenu(page, hudLocator, mode) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await startFromMenu(page, mode)
    await hudLocator.waitFor({ state: 'visible', timeout: 4_000 }).catch(() => null)
    if (await hudLocator.isVisible()) return
  }

  throw new Error(`[launch-smoke] HUD did not appear after starting game on ${mode}.`)
}

async function openHudPanel(page, button, panel) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.scrollIntoViewIfNeeded().catch(() => null)
    await button.click({ force: true })
    await page.waitForTimeout(400)
    if (await panel.isVisible().catch(() => false)) return true
  }

  return false
}

async function waitForSceneSettle(page, mode) {
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 8_000 })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas')
    return Boolean(canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0)
  }, null, { timeout: 8_000 })
  await page.waitForTimeout(mode === 'mobile' ? 3_600 : 3_200)
}

async function startFromMenu(page, mode) {
  const continueButton = page.getByRole('button', { name: /continue/i })
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click()
    await page.waitForTimeout(mode === 'mobile' ? 1_800 : 1_500)
    return
  }

  const openWashButton = page.getByRole('button', { name: /open wash|start new/i })
  if (!(await openWashButton.isVisible().catch(() => false))) {
    throw new Error(`[launch-smoke] Start menu action button is missing on ${mode}.`)
  }

  await openWashButton.click()
  await page.waitForTimeout(mode === 'mobile' ? 2_200 : 1_800)
}

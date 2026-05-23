import { existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { chromium } from 'playwright-core'

const host = '127.0.0.1'
const port = await getAvailablePort()
const baseUrl = `http://${host}:${port}`
const qaDir = join(process.cwd(), 'qa')

const MAX_GEOMETRIES = 900
const MAX_TEXTURES = 80
const MAX_GEOMETRY_DRIFT = 12
const MAX_TEXTURE_DRIFT = 3
const MAX_HEAP_DRIFT_MB = 50
const WARMUP_MS = 24_000
const MEASURE_MS = 14_000

if (!existsSync(join(process.cwd(), 'dist', 'index.html'))) {
  throw new Error('[performance-smoke] Production build is missing. Run npm.cmd run build before audit:perf.')
}

if (!existsSync(qaDir)) {
  mkdirSync(qaDir, { recursive: true })
}

const browserPath = detectBrowserPath()
if (!browserPath) {
  throw new Error('[performance-smoke] No Chromium-based browser found. Install Chrome/Edge or set BROWSER_PATH.')
}

const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
if (!existsSync(viteBin)) {
  throw new Error('[performance-smoke] Vite CLI is missing. Run npm install before performance testing.')
}

const preview = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
  windowsHide: true,
})

try {
  await waitForPreview(preview, baseUrl)

  const browser = await chromium.launch({ executablePath: browserPath, headless: true })
  try {
    await runPerformanceCheck(browser, baseUrl)
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

async function runPerformanceCheck(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await startFromMenu(page)
    await page.locator('[aria-label="Wash Empire controls"]').waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 })

    await page.waitForFunction(() => Boolean(window.__washEmpireRenderInfo), null, { timeout: 12_000 })
    const speed10 = page.locator('button[title="10x speed"]').first()
    if (!(await speed10.isVisible().catch(() => false))) {
      throw new Error('[performance-smoke] 10x speed control is missing.')
    }
    await speed10.click()

    await page.waitForTimeout(WARMUP_MS)
    await forceGarbageCollection(cdp)
    const warm = await sampleRenderInfo(page)

    await page.waitForTimeout(MEASURE_MS)
    await forceGarbageCollection(cdp)
    const final = await sampleRenderInfo(page)
    await page.screenshot({ path: join(qaDir, 'performance-smoke.png'), fullPage: true })

    const geometryDrift = final.geometries - warm.geometries
    const textureDrift = final.textures - warm.textures
    const heapDrift = optionalHeapDriftMb(warm, final)
    const summary = [
      '[performance-smoke] WebGL sample:',
      `warm=${describe(warm)}`,
      `final=${describe(final)}`,
      `drift={geometries:${geometryDrift}, textures:${textureDrift}, heap:${heapDrift === null ? 'n/a' : `${heapDrift.toFixed(1)} MB`}}`,
    ].join('\n')

    console.log(summary)

    assertBudget('geometries', final.geometries, MAX_GEOMETRIES)
    assertBudget('textures', final.textures, MAX_TEXTURES)
    assertDrift('geometries', geometryDrift, MAX_GEOMETRY_DRIFT)
    assertDrift('textures', textureDrift, MAX_TEXTURE_DRIFT)

    if (heapDrift !== null && heapDrift > MAX_HEAP_DRIFT_MB) {
      throw new Error(
        `[performance-smoke] JS heap grew ${heapDrift.toFixed(1)} MB after warmup; expected <= ${MAX_HEAP_DRIFT_MB} MB.`,
      )
    }

    console.log('[performance-smoke] WebGL budget stable.')
  } finally {
    await cdp.detach().catch(() => null)
    await context.close()
  }
}

async function forceGarbageCollection(cdp) {
  await cdp.send('HeapProfiler.collectGarbage').catch(() => null)
  await cdp.send('Runtime.evaluate', { expression: 'globalThis.gc?.()' }).catch(() => null)
}

async function sampleRenderInfo(page) {
  return page.evaluate(() => {
    const info = window.__washEmpireRenderInfo
    if (!info) {
      throw new Error('[performance-smoke] Render info probe did not publish metrics.')
    }
    return info
  })
}

function assertBudget(label, value, max) {
  if (value > max) {
    throw new Error(`[performance-smoke] ${label} budget exceeded: ${value} > ${max}.`)
  }
}

function assertDrift(label, value, max) {
  if (value > max) {
    throw new Error(`[performance-smoke] ${label} grew by ${value} after warmup; expected <= ${max}.`)
  }
}

function optionalHeapDriftMb(warm, final) {
  if (typeof warm.usedJSHeapSize !== 'number' || typeof final.usedJSHeapSize !== 'number') return null
  return (final.usedJSHeapSize - warm.usedJSHeapSize) / 1024 / 1024
}

function describe(info) {
  const heap = typeof info.usedJSHeapSize === 'number' ? `, heap=${(info.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB` : ''
  return `{calls:${info.calls}, geometries:${info.geometries}, textures:${info.textures}, programs:${info.programs}, triangles:${info.triangles}${heap}}`
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('[performance-smoke] Could not reserve a local preview port.'))
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
      reject(new Error('[performance-smoke] Vite preview did not become ready in 25s.'))
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
      settle(reject, new Error(`[performance-smoke] Vite preview exited early with code ${code ?? 'unknown'}.`))
    })

    previewProc.on('error', (error) => {
      settle(reject, new Error(`[performance-smoke] Could not start Vite preview. ${error.message}`))
    })
  })
}

async function startFromMenu(page) {
  const continueButton = page.getByRole('button', { name: /continue/i })
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click()
    await page.waitForTimeout(1_500)
    return
  }

  const openWashButton = page.getByRole('button', { name: /open wash|start new/i })
  if (!(await openWashButton.isVisible().catch(() => false))) {
    throw new Error('[performance-smoke] Start menu action button is missing.')
  }

  await openWashButton.click()
  await page.waitForTimeout(1_800)
}

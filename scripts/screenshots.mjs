/**
 * Captures one screenshot per tab into docs/screenshots/ by driving the
 * locally installed Chrome. Run `npm run build` first, then `npm run shots`.
 *
 * playwright-core ships no browser of its own, so this uses `channel: 'chrome'`
 * and fails loudly if Chrome is not installed rather than silently producing
 * nothing.
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PORT = 4173
const BASE = `http://localhost:${PORT}/rag-visualizer/`
const OUT = 'docs/screenshots'

const SHOTS = [
  { id: 'fixed', height: 1250 },
  { id: 'sentence', height: 1150 },
  { id: 'semantic', height: 1150 },
  { id: 'hierarchical', height: 1350 },
  { id: 'bienc', height: 1250 },
  { id: 'cross', height: 1300 },
  {
    id: 'colbert',
    height: 1350,
    // Select a query token so the shot shows the per-token heatmap rather than
    // the collapsed summary view.
    prepare: async page => {
      const token = page.locator('.token-btn').nth(1)
      if (await token.count()) await token.click()
    },
  },
  { id: 'hybrid', height: 1400 },
]

// One representative view per theme, for the README's theme gallery.
const THEMES = ['midnight', 'slate', 'ember', 'daylight', 'paper']

function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url)
        if (res.ok) return resolve()
      } catch {
        // Server not up yet.
      }
      if (Date.now() > deadline) return reject(new Error(`timed out waiting for ${url}`))
      setTimeout(attempt, 300)
    }
    attempt()
  })
}

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore', shell: process.platform === 'win32' },
)

let browser
try {
  await waitForServer(BASE)
  browser = await chromium.launch({ channel: 'chrome' })
  mkdirSync(OUT, { recursive: true })

  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: { width: 1180, height: shot.height },
      deviceScaleFactor: 2,
      colorScheme: 'dark',
    })
    await page.goto(`${BASE}#/${shot.id}`, { waitUntil: 'networkidle' })
    // Web fonts swap in late; without this the shots catch the fallback face.
    await page.evaluate(() => document.fonts.ready)
    if (shot.prepare) await shot.prepare(page)
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/${shot.id}.png` })
    console.log(`captured ${shot.id}.png`)
    await page.close()
  }
  mkdirSync(`${OUT}/themes`, { recursive: true })
  for (const theme of THEMES) {
    const page = await browser.newPage({
      viewport: { width: 1180, height: 900 },
      deviceScaleFactor: 2,
    })
    await page.goto(`${BASE}#/semantic`, { waitUntil: 'networkidle' })
    await page.evaluate(t => {
      localStorage.setItem('rag-visualizer:theme', t)
      document.documentElement.setAttribute('data-theme', t)
    }, theme)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/themes/${theme}.png` })
    console.log(`captured themes/${theme}.png`)
    await page.close()
  }
} finally {
  await browser?.close()
  server.kill()
}

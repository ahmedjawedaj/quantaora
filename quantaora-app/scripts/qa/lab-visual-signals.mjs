import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = path.resolve(import.meta.dirname, '../..')
const REPORT_MD = path.resolve(ROOT, '../docs/TODAY-P0-P1-GAP-REPORT.md')
const DATE = new Date().toISOString().slice(0, 10)
const OUT_DIR = path.resolve(ROOT, `review-screenshots/lab-visual-signals-${DATE}`)
const BASE_URL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5178'
const SCREENSHOT_MODE = process.env.QA_SCREENSHOTS ?? 'failures'
const ROUTE_FILTER = process.env.QA_ROUTE_FILTER

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function routesFromReport(markdown) {
  const routes = new Map()
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('| P')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length < 11) continue
    const [priority, subject, branch, , , , , , , quality, route] = cells
    if (!route.startsWith('/app')) continue
    routes.set(route, { route, priority, subject, branch, quality })
  }
  return [...routes.values()]
}

async function pageSignal(page) {
  return page.evaluate(() => {
    const text = document.body.innerText
    const stage = document.querySelector('[data-lab-stage]')
    const buttons = [...document.querySelectorAll('button')].map((button) => button.textContent?.trim() ?? '').join(' | ')
    const loadingStatus = [...document.querySelectorAll('[role="status"]')].some((node) => {
      if (!/Loading/i.test(node.textContent ?? '')) return false
      if (node.closest('[aria-hidden="true"]')) return false
      const element = node instanceof HTMLElement ? node : node.parentElement
      if (!element) return false
      const style = window.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0
    })
    const bodyRect = document.body.getBoundingClientRect()
    const stageRect = stage?.getBoundingClientRect()
    return {
      is404: /We couldn't find that page/i.test(text),
      hasStage: Boolean(stage),
      hasCanvas: Boolean(document.querySelector('canvas')),
      hasToolbar: /Rotate/i.test(buttons) && /Reset/i.test(buttons),
      hasZoomIn: /Zoom In/i.test(buttons),
      hasZoomOut: /Zoom Out/i.test(buttons),
      hasMissionLoop: /Observe/i.test(text) && /Predict/i.test(text) && /Explain/i.test(text),
      hasLesson: /Lesson/i.test(text),
      hasCheckpoint: /Checkpoint/i.test(text),
      hasLoadingStatus: loadingStatus,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      bodyHeight: Math.round(bodyRect.height),
      stageRect: stageRect
        ? {
            width: Math.round(stageRect.width),
            height: Math.round(stageRect.height),
            top: Math.round(stageRect.top),
            bottom: Math.round(stageRect.bottom),
          }
        : null,
    }
  })
}

function isUnsettledSignal(signal) {
  if (signal.is404) return false
  if (signal.hasLoadingStatus) return true
  if (!signal.hasStage) return true
  if (!signal.stageRect) return true
  return signal.stageRect.width === 0 || signal.stageRect.height === 0
}

async function waitForSettledLab(page) {
  await page.waitForFunction(
    () => {
      const text = document.body.innerText
      if (/We couldn't find that page/i.test(text)) return true
      const loadingStatus = [...document.querySelectorAll('[role="status"]')].some((node) => {
        if (!/Loading/i.test(node.textContent ?? '')) return false
        if (node.closest('[aria-hidden="true"]')) return false
        const element = node instanceof HTMLElement ? node : node.parentElement
        if (!element) return false
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0
      })
      if (loadingStatus) return false
      const stage = document.querySelector('[data-lab-stage]')
      if (stage) {
        const rect = stage.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) return true
      }
      return false
    },
    null,
    { timeout: 45000 },
  ).catch(() => {})
}

async function waitForLoadingToClear(page) {
  await page.waitForFunction(
    () => {
      const loadingStatus = [...document.querySelectorAll('[role="status"]')].some((node) => {
        if (!/Loading/i.test(node.textContent ?? '')) return false
        if (node.closest('[aria-hidden="true"]')) return false
        const element = node instanceof HTMLElement ? node : node.parentElement
        if (!element) return false
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0
      })
      return !loadingStatus
    },
    null,
    { timeout: 45000 },
  ).catch(() => {})
}

function failuresFor(routeInfo, signal) {
  const failures = []
  if (signal.is404) failures.push('404')
  if (!signal.hasStage && routeInfo.route !== '/app') failures.push('missing lab stage')
  if (!signal.hasToolbar && routeInfo.route !== '/app') failures.push('missing shared toolbar')
  if (!signal.hasZoomIn && routeInfo.route !== '/app') failures.push('missing zoom in')
  if (!signal.hasZoomOut && routeInfo.route !== '/app') failures.push('missing zoom out')
  if (signal.overflowX) failures.push('horizontal overflow')
  if (signal.stageRect && signal.stageRect.width < 300) failures.push('stage too narrow')
  if (signal.stageRect && signal.stageRect.height < 300) failures.push('stage too short')
  if (routeInfo.priority.startsWith('P1') && !signal.hasMissionLoop) failures.push('missing visible mission loop text')
  if (!signal.hasLesson) failures.push('missing lesson affordance')
  if (!signal.hasCheckpoint) failures.push('missing checkpoint affordance')
  if (signal.hasLoadingStatus) failures.push('model still loading after settle wait')
  return failures
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const report = await readFile(REPORT_MD, 'utf8')
  const routes = routesFromReport(report).filter((route) => !ROUTE_FILTER || route.route.includes(ROUTE_FILTER) || route.branch.toLowerCase().includes(ROUTE_FILTER.toLowerCase()))
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const routeInfo of routes) {
    const startedAt = Date.now()
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    try {
      await page.goto(`${BASE_URL}${routeInfo.route}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await waitForSettledLab(page)
      await page.waitForTimeout(750)
      await waitForLoadingToClear(page)
      let signal = await pageSignal(page)
      if (isUnsettledSignal(signal)) {
        await page.waitForTimeout(4000)
        await waitForLoadingToClear(page)
        signal = await pageSignal(page)
      }
      await page.waitForTimeout(350)
      await waitForLoadingToClear(page)
      signal = await pageSignal(page)
      const failures = failuresFor(routeInfo, signal)
      const shouldScreenshot = SCREENSHOT_MODE === 'all' || (SCREENSHOT_MODE === 'failures' && failures.length > 0)
      let screenshot = null
      if (shouldScreenshot) {
        screenshot = path.join(OUT_DIR, `${slug(routeInfo.branch)}.png`)
        await page.screenshot({ path: screenshot, fullPage: false })
      }
      results.push({ ...routeInfo, ok: failures.length === 0, failures, signal, screenshot, ms: Date.now() - startedAt })
    } catch (error) {
      results.push({
        ...routeInfo,
        ok: false,
        failures: ['navigation/error'],
        error: error instanceof Error ? error.message : String(error),
        signal: null,
        screenshot: null,
        ms: Date.now() - startedAt,
      })
    } finally {
      await page.close().catch(() => {})
      await context.close().catch(() => {})
    }
  }

  await browser.close()
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    screenshotMode: SCREENSHOT_MODE,
    routeFilter: ROUTE_FILTER ?? null,
    routes: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
  }
  const output = { summary, results }
  await writeFile(path.join(OUT_DIR, 'report.json'), `${JSON.stringify(output, null, 2)}\n`)
  console.log(JSON.stringify(summary, null, 2))
  if (summary.failed > 0) {
    for (const result of results.filter((item) => !item.ok)) {
      console.log(`FAIL ${result.route} (${result.branch}): ${result.failures.join(', ')}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

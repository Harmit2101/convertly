import "./playwrightEnv.js"
import { chromium } from "playwright"
import { waitForDomStabilization } from "./domSettler.js"
import { extractFromPage, hashContent } from "./extractPageContent.js"
import { assertSafeUrl } from "./urlSafety.js"
import { PLAYWRIGHT_BROWSERS_DIR } from "./playwrightEnv.js"

const NAVIGATION_TIMEOUT_MS = 30_000
const RENDER_SETTLE_MAX_MS = 8_000

function buildLaunchErrorResponse(targetUrl, error) {
  const message = error instanceof Error ? error.message : "Browser launch failed"
  let executablePath = "unknown"

  try {
    executablePath = chromium.executablePath()
  } catch {
    executablePath = "unresolved"
  }

  console.error(
    `[render-worker] Browser launch failure for ${targetUrl}: ${message} (executable=${executablePath}, browsersPath=${PLAYWRIGHT_BROWSERS_DIR})`
  )

  return {
    ok: false,
    finalUrl: targetUrl,
    html: null,
    text: null,
    title: null,
    links: [],
    headings: { h1: [], h2: [] },
    contentHash: null,
    rendered: true,
    error: `Browser launch failed: ${message}. executable=${executablePath} browsersPath=${PLAYWRIGHT_BROWSERS_DIR}`,
  }
}

async function launchBrowser() {
  return chromium.launch({ headless: true })
}

export async function renderPage(url) {
  const safeUrl = assertSafeUrl(url)
  const targetUrl = safeUrl.toString()

  let browser
  try {
    browser = await launchBrowser()
  } catch (error) {
    return buildLaunchErrorResponse(targetUrl, error)
  }

  try {
    const context = await browser.newContext({
      userAgent: "ConvertlyAuditBot/1.0",
    })
    const page = await context.newPage()

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    })

    await waitForDomStabilization(page, RENDER_SETTLE_MAX_MS)

    const html = await page.content()
    const title = await page.title()
    const extracted = await extractFromPage(page, page.url())
    const contentHash = hashContent(html)

    return {
      ok: true,
      finalUrl: page.url(),
      html,
      text: extracted.text,
      title,
      links: extracted.links,
      headings: extracted.headings,
      contentHash,
      rendered: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed"

    return {
      ok: false,
      finalUrl: targetUrl,
      html: null,
      text: null,
      title: null,
      links: [],
      headings: { h1: [], h2: [] },
      contentHash: null,
      rendered: true,
      error: message,
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

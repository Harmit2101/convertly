import fs from "node:fs"
import { chromium } from "playwright"
import { PLAYWRIGHT_BROWSERS_DIR } from "./playwrightEnv.js"

function resolveExecutablePath() {
  try {
    return chromium.executablePath()
  } catch (error) {
    const message = error instanceof Error ? error.message : "executablePath failed"
    return { error: message }
  }
}

export async function runBrowserStartupDiagnostics() {
  const executable = resolveExecutablePath()

  if (typeof executable === "object" && executable.error) {
    console.error(
      `[render-worker] Browser executable missing: ${executable.error} (browsers path: ${PLAYWRIGHT_BROWSERS_DIR})`
    )
    return { ok: false, executablePath: null, error: executable.error }
  }

  const executableExists = fs.existsSync(executable)
  if (!executableExists) {
    const error = `Executable not found at ${executable}`
    console.error(`[render-worker] ${error}`)
    return { ok: false, executablePath: executable, error }
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    return { ok: true, executablePath: executable, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser launch failed"
    console.error(`[render-worker] Browser launch failure: ${message}`)
    return { ok: false, executablePath: executable, error: message }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

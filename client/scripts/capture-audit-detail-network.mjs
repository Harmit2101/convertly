#!/usr/bin/env node
/**
 * Captures network activity for a completed audit detail view.
 *
 * Usage:
 *   CONVERTLY_TEST_EMAIL=... CONVERTLY_TEST_PASSWORD=... node scripts/capture-audit-detail-network.mjs
 *   CONVERTLY_AUDIT_ID=optional-specific-id node scripts/capture-audit-detail-network.mjs
 */

import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientRoot = join(__dirname, "..")
const reportDir = join(clientRoot, "diagnostics-reports")

const email = process.env.CONVERTLY_TEST_EMAIL
const password = process.env.CONVERTLY_TEST_PASSWORD
const auditIdOverride = process.env.CONVERTLY_AUDIT_ID
const previewPort = Number(process.env.CONVERTLY_PREVIEW_PORT ?? 4173)
const baseUrl = `http://127.0.0.1:${previewPort}`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? clientRoot,
      stdio: options.stdio ?? "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...options.env },
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined)
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

async function ensurePlaywright() {
  try {
    await import("playwright")
  } catch {
    console.log("Installing playwright (one-time)...")
    await run("npm", ["install", "--no-save", "playwright"])
  }
}

async function startPreview() {
  const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(previewPort)], {
    cwd: clientRoot,
    stdio: "pipe",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      VITE_NETWORK_TRACE: "true",
    },
  })

  const started = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Preview server did not start")), 30_000)

    preview.stdout.on("data", (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      if (text.includes("Local:") || text.includes(`http://127.0.0.1:${previewPort}`)) {
        clearTimeout(timeout)
        resolve(undefined)
      }
    })

    preview.stderr.on("data", (chunk) => process.stderr.write(chunk))
    preview.on("exit", (code) => {
      if (code && code !== 0) reject(new Error(`Preview exited with ${code}`))
    })
  })

  await started
  await sleep(1200)
  return preview
}

function summarizeReport(report) {
  const api = report.entries.filter((entry) => entry.kind === "api")
  const auth = report.entries.filter((entry) => entry.kind === "auth")
  const functions = report.entries.filter((entry) => entry.kind === "function")

  return {
    route: report.route,
    totals: report.totals,
    requiredApi: api.filter((entry) => entry.necessary && !entry.duplicateOf),
    duplicateApi: api.filter((entry) => entry.duplicateOf),
    auth,
    functions,
    graph: report.graph,
  }
}

async function main() {
  if (!email || !password) {
    console.error(
      "Set CONVERTLY_TEST_EMAIL and CONVERTLY_TEST_PASSWORD to capture authenticated audit detail traffic."
    )
    process.exit(1)
  }

  await mkdir(reportDir, { recursive: true })

  console.log("Building production bundle with network trace enabled...")
  await run("npm", ["run", "build"], {
    env: { VITE_NETWORK_TRACE: "true" },
  })

  await ensurePlaywright()
  const { chromium } = await import("playwright")

  console.log("Starting preview server...")
  const preview = await startPreview()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const requests = []
  page.on("request", (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    })
  })

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" })

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

    let auditId = auditIdOverride

    if (!auditId) {
      await page.goto(`${baseUrl}/audits`, { waitUntil: "networkidle" })
      const firstAuditLink = page.locator('a[href^="/audits/"]').first()
      const href = await firstAuditLink.getAttribute("href")
      auditId = href?.split("/").pop()
    }

    if (!auditId) {
      throw new Error("No completed audit found to open.")
    }

    const detailUrl = `${baseUrl}/audits/${auditId}`
    requests.length = 0

    await page.goto(detailUrl, { waitUntil: "networkidle" })
    await sleep(2500)

    const traceReport = await page.evaluate(() => window.__CONVERTLY_NETWORK_TRACE__?.getReport())

    const xhrFetch = requests.filter((entry) =>
      ["fetch", "xhr", "other"].includes(entry.resourceType)
    )

    const summary = traceReport ? summarizeReport(traceReport) : null
    const output = {
      capturedAt: new Date().toISOString(),
      auditId,
      detailUrl,
      playwright: {
        totalRequests: requests.length,
        xhrFetchCount: xhrFetch.length,
        xhrFetch,
      },
      trace: summary,
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    const outputPath = join(reportDir, `audit-detail-network-${stamp}.json`)
    await writeFile(outputPath, JSON.stringify(output, null, 2))

    console.log("\n--- Audit detail network capture ---")
    console.log(`Audit ID: ${auditId}`)
    console.log(`Playwright total requests: ${output.playwright.totalRequests}`)
    console.log(`Playwright fetch/xhr: ${output.playwright.xhrFetchCount}`)
    if (summary) {
      console.log(`Trace API calls: ${summary.totals.api}`)
      console.log(`Trace auth calls: ${summary.totals.auth}`)
      console.log(`Trace duplicates: ${summary.totals.duplicates}`)
      console.log(`Trace unnecessary: ${summary.totals.unnecessary}`)
      console.log(`Required API calls: ${summary.requiredApi.length}`)
      for (const entry of summary.requiredApi) {
        console.log(`  - ${entry.method} ${entry.url}`)
      }
    }
    console.log(`Report written to ${outputPath}`)
  } finally {
    await browser.close()
    preview.kill("SIGTERM")
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

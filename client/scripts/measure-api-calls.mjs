#!/usr/bin/env node
/**
 * Measures Supabase API calls for completed audit detail data load.
 * Set CONVERTLY_TEST_EMAIL + CONVERTLY_TEST_PASSWORD for live measurement.
 */

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "..", ".env")

function loadEnv() {
  const values = {}
  try {
    const raw = readFileSync(envPath, "utf8")
    for (const line of raw.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const [key, ...rest] = trimmed.split("=")
      values[key] = rest.join("=").trim()
    }
  } catch {
    /* optional */
  }
  return values
}

const env = { ...loadEnv(), ...process.env }
const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "")
const supabaseKey = env.VITE_SUPABASE_ANON_KEY ?? ""
const email = env.CONVERTLY_TEST_EMAIL
const password = env.CONVERTLY_TEST_PASSWORD
const auditId = env.CONVERTLY_AUDIT_ID

const calls = []

function tracedFetch(input, init) {
  const url = typeof input === "string" ? input : input.url
  const method = init?.method ?? "GET"
  calls.push({ method, url, at: Date.now() })
  return fetch(input, init)
}

function classify(url) {
  if (url.includes("/auth/v1/")) return "auth"
  if (url.includes("/rest/v1/")) return "api"
  if (url.includes("/functions/v1/")) return "function"
  return "other"
}

async function main() {
  console.log("=== Convertly audit detail API measurement ===\n")

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in client/.env")
    process.exit(1)
  }

  if (!email || !password) {
    console.log("Live measurement skipped (set CONVERTLY_TEST_EMAIL and CONVERTLY_TEST_PASSWORD).")
    console.log("\nExpected request graph for COMPLETED audit detail view:\n")
    console.log("1. Auth bootstrap (once per app load)")
    console.log("   - GET /auth/v1/session")
    console.log("   - GET /auth/v1/user (validate once on bootstrap only)")
    console.log("2. Audit detail data (once per audit, then cached in memory)")
    console.log("   - GET /rest/v1/audits?select=*,audit_pages(*),audit_findings(*),audit_scores(*),audit_history(*)&id=eq.<id>")
    console.log("3. No edge functions")
    console.log("4. No per-page repository loops")
    console.log("5. No polling on completed audits\n")
    console.log("Expected scaling during AUDIT EXECUTION (not detail view):")
    console.log("   - ~1-2 edge function calls per discovered candidate URL in pageDiscovery")
    console.log("   - ~1 lightweight status poll per 750ms on New Audit page only")
    process.exit(0)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { fetch: tracedFetch },
  })

  const signIn = await supabase.auth.signInWithPassword({ email, password })
  if (signIn.error) {
    console.error("Sign in failed:", signIn.error.message)
    process.exit(1)
  }

  calls.length = 0

  let targetAuditId = auditId
  if (!targetAuditId) {
    const { data, error } = await supabase
      .from("audits")
      .select("id,status")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw new Error(error.message)
    targetAuditId = data?.[0]?.id
  }

  if (!targetAuditId) {
    console.error("No completed audit found.")
    process.exit(1)
  }

  const firstLoadStart = calls.length
  const { data: first, error: firstError } = await supabase
    .from("audits")
    .select("*, audit_pages(*), audit_findings(*), audit_scores(*), audit_history(*)")
    .eq("id", targetAuditId)
    .maybeSingle()

  if (firstError) throw new Error(firstError.message)
  if (!first) throw new Error("Audit not found")

  const firstLoadCalls = calls.slice(firstLoadStart)

  const secondLoadStart = calls.length
  await supabase
    .from("audits")
    .select("*, audit_pages(*), audit_findings(*), audit_scores(*), audit_history(*)")
    .eq("id", targetAuditId)
    .maybeSingle()

  const secondLoadCalls = calls.slice(secondLoadStart)

  const byKind = calls.reduce(
    (acc, call) => {
      acc[classify(call.url)] = (acc[classify(call.url)] ?? 0) + 1
      return acc
    },
    {}
  )

  console.log(`Audit ID: ${targetAuditId}`)
  console.log(`Pages in audit: ${first.audit_pages?.length ?? 0}`)
  console.log(`Total HTTP calls this script: ${calls.length}`)
  console.log(`By kind: ${JSON.stringify(byKind)}`)
  console.log(`\nFirst batched detail query: ${firstLoadCalls.length} call(s)`)
  for (const call of firstLoadCalls) {
    console.log(`  ${call.method} ${call.url}`)
  }
  console.log(`\nSecond batched detail query (simulates duplicate fetch): ${secondLoadCalls.length} call(s)`)
  console.log("\nIn the app, the second load is served from in-memory cache (0 API calls).")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

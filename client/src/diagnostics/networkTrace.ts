export type NetworkTraceKind =
  | "api"
  | "auth"
  | "function"
  | "asset"
  | "external"

export type NetworkTraceEntry = {
  id: string
  url: string
  method: string
  kind: NetworkTraceKind
  initiator: string
  startedAt: number
  durationMs: number | null
  status: number | null
  duplicateOf: string | null
  necessary: boolean
  reason: string
}

export type NetworkTraceReport = {
  capturedAt: string
  route: string
  totals: {
    all: number
    api: number
    auth: number
    function: number
    asset: number
    external: number
    duplicates: number
    unnecessary: number
  }
  entries: NetworkTraceEntry[]
  graph: Array<{
    initiator: string
    count: number
    kinds: Record<NetworkTraceKind, number>
  }>
}

type PendingRequest = {
  id: string
  url: string
  method: string
  kind: NetworkTraceKind
  initiator: string
  startedAt: number
  signature: string
}

let enabled = false
let route = "/"
let nextId = 1
const entries: NetworkTraceEntry[] = []
const inflight = new Map<string, PendingRequest>()
const signatureIndex = new Map<string, string>()

function classifyUrl(url: string): NetworkTraceKind {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    const path = parsed.pathname

    if (path.includes("/auth/v1/")) return "auth"
    if (path.includes("/functions/v1/")) return "function"
    if (path.includes("/rest/v1/")) return "api"
    if (
      host === window.location.hostname ||
      path.endsWith(".js") ||
      path.endsWith(".css") ||
      path.endsWith(".woff2") ||
      path.endsWith(".svg")
    ) {
      return "asset"
    }
    return "external"
  } catch {
    return "external"
  }
}

function normalizeSignature(method: string, url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, "")
    return `${method.toUpperCase()} ${path}${parsed.search}`
  } catch {
    return `${method.toUpperCase()} ${url}`
  }
}

function captureStack(): string {
  const stack = new Error().stack ?? ""
  const frames = stack
    .split("\n")
    .slice(3, 8)
    .map((line) => line.trim().replace(/^at\s+/, ""))
    .filter((line) => !line.includes("networkTrace"))
  return frames[0] ?? "unknown"
}

function isNecessary(kind: NetworkTraceKind, signature: string): { necessary: boolean; reason: string } {
  if (kind === "asset") {
    return { necessary: true, reason: "Static asset required for initial render" }
  }

  if (kind === "auth") {
    if (signature.includes("GET /auth/v1/user")) {
      return { necessary: true, reason: "Session validation on bootstrap" }
    }
    if (signature.includes("GET /auth/v1/session") || signature.includes("token")) {
      return { necessary: true, reason: "Auth session bootstrap" }
    }
    return { necessary: false, reason: "Repeated auth call — should be deduplicated" }
  }

  if (kind === "api") {
    if (signature.includes("/rest/v1/audits") && signature.includes("select=")) {
      return { necessary: true, reason: "Single batched audit detail query" }
    }
    return { necessary: true, reason: "Supabase data API" }
  }

  if (kind === "function") {
    return { necessary: false, reason: "Edge function should not run on completed audit detail view" }
  }

  return { necessary: false, reason: "Unexpected external request during audit detail view" }
}

function recordStart(method: string, url: string, initiator: string): string {
  if (!enabled) return ""

  const id = String(nextId++)
  const kind = classifyUrl(url)
  const signature = normalizeSignature(method, url)
  const duplicateOf = signatureIndex.get(signature) ?? null

  if (!duplicateOf) {
    signatureIndex.set(signature, id)
  }

  inflight.set(id, {
    id,
    url,
    method: method.toUpperCase(),
    kind,
    initiator,
    startedAt: performance.now(),
    signature,
  })

  return id
}

function recordEnd(id: string, status: number | null): void {
  if (!enabled || !id) return

  const pending = inflight.get(id)
  if (!pending) return

  inflight.delete(id)

  const { necessary, reason } = isNecessary(pending.kind, pending.signature)
  const duplicateOf = signatureIndex.get(pending.signature) ?? null

  entries.push({
    id: pending.id,
    url: pending.url,
    method: pending.method,
    kind: pending.kind,
    initiator: pending.initiator,
    startedAt: pending.startedAt,
    durationMs: Math.round(performance.now() - pending.startedAt),
    status,
    duplicateOf: duplicateOf === pending.id ? null : duplicateOf,
    necessary: necessary && !duplicateOf,
    reason: duplicateOf ? `Duplicate of request #${duplicateOf}` : reason,
  })
}

export function enableNetworkTrace(currentRoute = window.location.pathname): void {
  enabled = true
  route = currentRoute
}

export function setNetworkTraceRoute(nextRoute: string): void {
  route = nextRoute
}

export function resetNetworkTrace(): void {
  entries.length = 0
  inflight.clear()
  signatureIndex.clear()
  nextId = 1
}

export function traceNetworkCall<T>(
  initiator: string,
  request: () => Promise<T>
): Promise<T> {
  if (!enabled) return request()

  const id = recordStart("TRACE", `trace://${initiator}`, initiator)

  return request()
    .then((result) => {
      recordEnd(id, 200)
      return result
    })
    .catch((error) => {
      recordEnd(id, 500)
      throw error
    })
}

export function createTracedFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const method = init?.method ?? (typeof input !== "string" && "method" in input ? input.method : "GET")
    const initiator = captureStack()
    const id = recordStart(method, url, initiator)

    try {
      const response = await baseFetch(input, init)
      recordEnd(id, response.status)
      return response
    } catch (error) {
      recordEnd(id, null)
      throw error
    }
  }
}

export function getNetworkTraceReport(): NetworkTraceReport {
  const graphMap = new Map<string, Record<NetworkTraceKind, number>>()

  for (const entry of entries) {
    const bucket = graphMap.get(entry.initiator) ?? {
      api: 0,
      auth: 0,
      function: 0,
      asset: 0,
      external: 0,
    }
    bucket[entry.kind] += 1
    graphMap.set(entry.initiator, bucket)
  }

  const graph = [...graphMap.entries()]
    .map(([initiator, kinds]) => ({
      initiator,
      count: Object.values(kinds).reduce((sum, value) => sum + value, 0),
      kinds,
    }))
    .sort((a, b) => b.count - a.count)

  const duplicates = entries.filter((entry) => entry.duplicateOf !== null).length
  const unnecessary = entries.filter((entry) => !entry.necessary).length

  return {
    capturedAt: new Date().toISOString(),
    route,
    totals: {
      all: entries.length,
      api: entries.filter((entry) => entry.kind === "api").length,
      auth: entries.filter((entry) => entry.kind === "auth").length,
      function: entries.filter((entry) => entry.kind === "function").length,
      asset: entries.filter((entry) => entry.kind === "asset").length,
      external: entries.filter((entry) => entry.kind === "external").length,
      duplicates,
      unnecessary,
    },
    entries: [...entries],
    graph,
  }
}

declare global {
  interface Window {
    __CONVERTLY_NETWORK_TRACE__?: {
      getReport: () => NetworkTraceReport
      reset: () => void
      enable: (route?: string) => void
    }
  }
}

export function installNetworkTraceGlobal(): void {
  window.__CONVERTLY_NETWORK_TRACE__ = {
    getReport: getNetworkTraceReport,
    reset: resetNetworkTrace,
    enable: enableNetworkTrace,
  }
}

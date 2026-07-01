import { hashContent } from "@/services/audit/fetch/contentHash"
import { classifyFetchFailure } from "@/services/audit/fetch/fetchErrorClassifier"
import { getSupabaseClient } from "@/services/auth/supabaseClient"
import { isSupabaseConfigured } from "@/lib/env"

export type RemoteFetchResult = {
  ok: boolean
  status: number
  finalUrl: string
  html: string | null
  contentHash: string | null
  error?: string
}

const AUDIT_FETCH_FUNCTION = "audit-fetch"
const FETCH_TIMEOUT_MS = 12_000

function userFacingFetchError(result: Omit<RemoteFetchResult, "error"> & { error?: string }): string {
  return classifyFetchFailure({
    error: result.error,
    status: result.status,
    html: result.html,
    finalUrl: result.finalUrl,
  }).userMessage
}

async function fetchPageViaBrowser(url: string): Promise<RemoteFetchResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
    })

    const contentType = response.headers.get("content-type") ?? ""
    const isHtml =
      contentType.includes("text/html") || contentType.includes("application/xhtml")

    if (!response.ok || !isHtml) {
      const result = {
        ok: false,
        status: response.status,
        finalUrl: response.url || url,
        html: null,
        contentHash: null,
        error: "Unable to fetch HTML in local mode",
      }
      return { ...result, error: userFacingFetchError(result) }
    }

    const html = await response.text()
    const contentHash = await hashContent(html)

    return {
      ok: true,
      status: response.status,
      finalUrl: response.url || url,
      html,
      contentHash,
    }
  } catch (error) {
    const result = {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: error instanceof Error ? error.message : "Fetch failed",
    }
    return { ...result, error: userFacingFetchError(result) }
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function fetchPageRemote(url: string): Promise<RemoteFetchResult> {
  if (!isSupabaseConfigured()) {
    return fetchPageViaBrowser(url)
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<RemoteFetchResult>(
    AUDIT_FETCH_FUNCTION,
    {
      method: "POST",
      body: { url },
    }
  )

  if (error) {
    const result = {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: error.message,
    }
    return { ...result, error: userFacingFetchError(result) }
  }

  if (!data) {
    const result = {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: "Empty response from audit fetch",
    }
    return { ...result, error: userFacingFetchError(result) }
  }

  if ("error" in data && typeof data.error === "string") {
    const result = {
      ok: false,
      status: 0,
      finalUrl: url,
      html: null,
      contentHash: null,
      error: data.error,
    }
    return { ...result, error: userFacingFetchError(result) }
  }

  if (!data.ok) {
    return { ...data, error: userFacingFetchError(data) }
  }

  return data
}

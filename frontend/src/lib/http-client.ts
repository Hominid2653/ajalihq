/**
 * REST API client for Ajali! Flask backend (/api/v1).
 *
 * Attaches JWT Bearer authentication from auth-storage,
 * serializes query parameters and JSON payloads, and normalizes
 * Smorest / Marshmallow error responses into friendly ApiError messages.
 */

import { readToken } from "@/lib/auth-storage"
import { env } from "@/lib/env"

export class ApiError extends Error {
  readonly status: number
  readonly data?: unknown

  constructor(message: string, status = 500, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export type PaginatedEnvelope<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, unknown>
  body?: unknown
  token?: string | null
  skipAuth?: boolean
}

function parseErrorMessage(status: number, data: unknown): string {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>

    // 1. Direct message string from Flask / Smorest abort(code, message="...")
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim()
    }

    // 2. Marshmallow / Smorest validation errors: { errors: { json: { field: ["msg"] } } }
    if (typeof obj.errors === "object" && obj.errors !== null) {
      const errRoot = (obj.errors as Record<string, unknown>).json ?? obj.errors
      if (typeof errRoot === "object" && errRoot !== null) {
        const errorLines: string[] = []
        for (const [field, val] of Object.entries(errRoot)) {
          if (Array.isArray(val)) {
            errorLines.push(`${field}: ${val.join(", ")}`)
          } else if (typeof val === "string") {
            errorLines.push(`${field}: ${val}`)
          }
        }
        if (errorLines.length > 0) {
          return errorLines.join("; ")
        }
      }
    }
  }

  // 3. Status-based fallbacks
  switch (status) {
    case 400:
      return "Invalid request. Please check your input."
    case 401:
      return "Authentication required or invalid credentials."
    case 403:
      return "You do not have permission to perform this action."
    case 404:
      return "The requested resource was not found."
    case 409:
      return "Conflict: the requested transition or resource state is invalid."
    case 422:
      return "Validation failed. Please verify the submitted data."
    case 429:
      return "Too many attempts. Please try again shortly."
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again in a few moments."
    default:
      return `Request failed with status ${status}.`
  }
}

export function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = env.apiBase.replace(/\/+$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const fullUrl = `${base}${normalizedPath}`

  if (!query || Object.keys(query).length === 0) {
    return fullUrl
  }

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item))
        }
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `${fullUrl}?${queryString}` : fullUrl
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { query, body, token, skipAuth = false, headers = {}, ...rest } = options

  const url = buildUrl(path, query)
  const reqHeaders = new Headers(headers)

  if (!reqHeaders.has("Accept")) {
    reqHeaders.set("Accept", "application/json")
  }

  const authToken = token !== undefined ? token : skipAuth ? null : readToken()
  if (authToken && !reqHeaders.has("Authorization")) {
    reqHeaders.set("Authorization", `Bearer ${authToken}`)
  }

  let reqBody: BodyInit | undefined = undefined

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || typeof body === "string") {
      reqBody = body
    } else {
      reqBody = JSON.stringify(body)
      if (!reqHeaders.has("Content-Type")) {
        reqHeaders.set("Content-Type", "application/json")
      }
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    body: reqBody,
  })

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.toLowerCase().includes("application/json")
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null)

  if (!response.ok) {
    const friendlyMessage = parseErrorMessage(response.status, data)
    throw new ApiError(friendlyMessage, response.status, data)
  }

  return data as T
}

/** Fetch binary content (images/videos) with auth — for media streaming endpoints. */
export async function apiFetchBlob(
  path: string,
  options: RequestOptions = {}
): Promise<Blob> {
  const { query, token, skipAuth = false, headers = {}, body: _body, ...rest } = options
  const url = buildUrl(path, query)
  const reqHeaders = new Headers(headers)

  const authToken = token !== undefined ? token : skipAuth ? null : readToken()
  if (authToken && !reqHeaders.has("Authorization")) {
    reqHeaders.set("Authorization", `Bearer ${authToken}`)
  }

  const response = await fetch(url, {
    ...rest,
    method: rest.method ?? "GET",
    headers: reqHeaders,
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""
    const isJson = contentType.toLowerCase().includes("application/json")
    const data = isJson ? await response.json().catch(() => null) : null
    throw new ApiError(parseErrorMessage(response.status, data), response.status, data)
  }

  return response.blob()
}

export const apiClient = {
  get<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions) {
    return apiFetch<T>(path, { ...options, method: "GET", query })
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiFetch<T>(path, { ...options, method: "POST", body })
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiFetch<T>(path, { ...options, method: "PATCH", body })
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return apiFetch<T>(path, { ...options, method: "PUT", body })
  },
  delete<T>(path: string, options?: RequestOptions) {
    return apiFetch<T>(path, { ...options, method: "DELETE" })
  },
}

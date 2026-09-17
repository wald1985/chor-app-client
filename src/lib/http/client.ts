import { apiUrl } from "../../utils/apiConfig"
import { HttpError } from "./httpError"

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15000

let userAuthToken: string | null = null
let adminAuthToken: string | null = null

/** Called whenever the current user session's token changes (login, logout, refresh). */
export const setAuthToken = (token: string | null) => {
  userAuthToken = token
}

/** Called whenever the current superadmin session's token changes. */
export const setAdminAuthToken = (token: string | null) => {
  adminAuthToken = token
}

type NestErrorBody = {
  message?: string | string[]
  error?: string
  code?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const parseErrorBody = (value: unknown): NestErrorBody => {
  if (!isRecord(value)) return {}

  const { message, error, code } = value
  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every(item => typeof item === "string")

  return {
    message:
      typeof message === "string"
        ? message
        : isStringArray(message)
          ? message
          : undefined,
    error: typeof error === "string" ? error : undefined,
    code: typeof code === "string" ? code : undefined,
  }
}

const readBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined
  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) return undefined
  try {
    return (await response.json()) as unknown
  } catch {
    return undefined
  }
}

async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options

  // Without this, a relative request would hit nginx's SPA fallback and get
  // `index.html` back with a 200 — a silent failure instead of an error.
  if (!apiUrl) {
    throw new HttpError(
      0,
      `Für ${window.location.hostname} ist keine Server-Adresse konfiguriert.`,
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  signal?.addEventListener("abort", () => {
    controller.abort()
  })

  const headers: Record<string, string> = { Accept: "application/json" }
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json"
  }

  const token = path.startsWith("/admin/") ? adminAuthToken : userAuthToken
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body:
        body !== undefined
          ? isFormData
            ? body
            : JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError"
    throw new HttpError(
      0,
      isAbort
        ? "Die Anfrage wurde abgebrochen oder hat zu lange gedauert."
        : "Netzwerkfehler.",
    )
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await readBody(response)

  if (!response.ok) {
    const { message, error, code } = parseErrorBody(data)
    if (Array.isArray(message)) {
      throw new HttpError(
        response.status,
        error ?? response.statusText,
        message,
        code,
      )
    }
    throw new HttpError(
      response.status,
      message ?? error ?? response.statusText,
      undefined,
      code,
    )
  }

  return data as TResponse
}

export const httpClient = {
  get: <TResponse>(
    path: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<TResponse>(path, { ...options, method: "GET" }),

  post: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<TResponse>(path, { ...options, method: "POST", body }),

  patch: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<TResponse>(path, { ...options, method: "PATCH", body }),

  put: <TResponse>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<TResponse>(path, { ...options, method: "PUT", body }),

  delete: <TResponse>(
    path: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => request<TResponse>(path, { ...options, method: "DELETE" }),
}

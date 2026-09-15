import { HttpError } from "./httpError"

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15000
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

let authToken: string | null = null

/** Called whenever the current session's token changes (login, logout, refresh). */
export const setAuthToken = (token: string | null) => {
  authToken = token
}

type NestErrorBody = {
  message?: string | string[]
  error?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const parseErrorBody = (value: unknown): NestErrorBody => {
  if (!isRecord(value)) return {}

  const { message, error } = value
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
  }
}

const readBody = async (response: Response): Promise<unknown> => {
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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  signal?.addEventListener("abort", () => {
    controller.abort()
  })

  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
    const { message, error } = parseErrorBody(data)
    if (Array.isArray(message)) {
      throw new HttpError(
        response.status,
        error ?? response.statusText,
        message,
      )
    }
    throw new HttpError(
      response.status,
      message ?? error ?? response.statusText,
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
}

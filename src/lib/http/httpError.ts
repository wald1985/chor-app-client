export class HttpError extends Error {
  readonly status: number
  readonly details: string[] | undefined
  readonly code: string | undefined

  constructor(
    status: number,
    message: string,
    details?: string[],
    code?: string,
  ) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.details = details
    this.code = code
  }
}

/**
 * Reads a human-readable message off an unknown thrown value. Handles both a
 * raw `HttpError` and the plain-object shape Redux Toolkit's `unwrap()`
 * rejects with (it copies `.message` off the original error but drops the
 * prototype, so `instanceof HttpError` doesn't survive a thunk round-trip).
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error
    if (typeof message === "string" && message.length > 0) {
      return message
    }
  }
  return fallback
}

/**
 * Reads an error code off an unknown thrown value (if present).
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error
    if (typeof code === "string" && code.length > 0) {
      return code
    }
  }
  return undefined
}

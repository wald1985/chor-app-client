import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient, setAdminAuthToken, setAuthToken } from "./client"
import { HttpError } from "./httpError"

describe("httpClient", () => {
  beforeEach(() => {
    setAuthToken(null)
    setAdminAuthToken(null)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("routes user token for regular endpoints and admin token for /admin/ endpoints", async () => {
    setAuthToken("user-jwt")
    setAdminAuthToken("admin-jwt")

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ ok: true }),
    } as Response)

    await httpClient.get("/me")
    const firstCall = fetchSpy.mock.calls[0]
    expect(firstCall[0]).toContain("/me")
    const firstHeaders = firstCall[1]?.headers as Record<string, string>
    expect(firstHeaders.Authorization).toBe("Bearer user-jwt")

    await httpClient.get("/admin/superadmins")
    const secondCall = fetchSpy.mock.calls[1]
    expect(secondCall[0]).toContain("/admin/superadmins")
    const secondHeaders = secondCall[1]?.headers as Record<string, string>
    expect(secondHeaders.Authorization).toBe("Bearer admin-jwt")
  })

  it("supports patch, put and delete methods", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
    } as Response)

    await httpClient.patch("/test", { a: 1 })
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("PATCH")
    expect(fetchSpy.mock.calls[0][1]?.body).toBe(JSON.stringify({ a: 1 }))

    await httpClient.put("/test", { b: 2 })
    expect(fetchSpy.mock.calls[1][1]?.method).toBe("PUT")
    expect(fetchSpy.mock.calls[1][1]?.body).toBe(JSON.stringify({ b: 2 }))

    await httpClient.delete("/test")
    expect(fetchSpy.mock.calls[2][1]?.method).toBe("DELETE")
  })

  it("handles 204 No Content without trying to parse JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as Response)

    const result = await httpClient.delete("/admin/superadmins/123")
    expect(result).toBeUndefined()
  })

  it("extracts error code into HttpError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      headers: new Headers({ "content-type": "application/json" }),
      json: () =>
        Promise.resolve({
          statusCode: 409,
          error: "Conflict",
          message: "Cannot delete the last remaining superadmin.",
          code: "SUPERADMIN_LAST_REMAINING",
        }),
    } as Response)

    await expect(httpClient.delete("/admin/superadmins/1")).rejects.toSatisfy(
      (err: unknown) => {
        return (
          err instanceof HttpError &&
          err.status === 409 &&
          err.message === "Cannot delete the last remaining superadmin." &&
          err.code === "SUPERADMIN_LAST_REMAINING"
        )
      },
    )
  })
})

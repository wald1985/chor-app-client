import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeStore } from "../../app/store"
import { clearToken, loadToken, saveToken } from "../auth/tokenStorage"
import {
  bootstrapAdmin,
  loginAdmin,
  logoutAdmin,
  selectAdminAuthStatus,
  selectCurrentAdmin,
  selectIsAdminAuthenticated,
} from "./adminAuthSlice"
import { superadminApi } from "./superadminApi"
import type { SuperadminView } from "./types"

describe("adminAuthSlice", () => {
  const mockAdmin: SuperadminView = {
    id: "admin-1",
    email: "admin@chor.de",
    name: "Head Admin",
    isCurrent: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("has initial unauthenticated or idle state", () => {
    const store = makeStore()
    expect(selectAdminAuthStatus(store.getState())).toBe("idle")
    expect(selectCurrentAdmin(store.getState())).toBeNull()
    expect(selectIsAdminAuthenticated(store.getState())).toBe(false)
  })

  it("bootstraps to unauthenticated if no admin token is stored", async () => {
    const store = makeStore()
    await store.dispatch(bootstrapAdmin())

    expect(selectAdminAuthStatus(store.getState())).toBe("unauthenticated")
    expect(selectCurrentAdmin(store.getState())).toBeNull()
  })

  it("bootstraps to authenticated when valid token is stored and /admin/me succeeds", async () => {
    saveToken("valid-token", true, "admin")
    vi.spyOn(superadminApi, "me").mockResolvedValue(mockAdmin)

    const store = makeStore()
    await store.dispatch(bootstrapAdmin())

    expect(selectAdminAuthStatus(store.getState())).toBe("authenticated")
    expect(selectCurrentAdmin(store.getState())).toEqual(mockAdmin)
    expect(selectIsAdminAuthenticated(store.getState())).toBe(true)
  })

  it("clears token and becomes unauthenticated if /admin/me fails during bootstrap", async () => {
    saveToken("invalid-token", true, "admin")
    vi.spyOn(superadminApi, "me").mockRejectedValue(new Error("Unauthorized"))

    const store = makeStore()
    await store.dispatch(bootstrapAdmin())

    expect(selectAdminAuthStatus(store.getState())).toBe("unauthenticated")
    expect(selectCurrentAdmin(store.getState())).toBeNull()
    expect(loadToken("admin")).toBeNull()
  })

  it("logs in admin, saves token and updates store", async () => {
    vi.spyOn(superadminApi, "login").mockResolvedValue({
      accessToken: "new-admin-token",
      superadmin: mockAdmin,
    })

    const store = makeStore()
    await store.dispatch(
      loginAdmin({
        email: "admin@chor.de",
        password: "secretpassword",
        remember: true,
      }),
    )

    expect(selectAdminAuthStatus(store.getState())).toBe("authenticated")
    expect(selectCurrentAdmin(store.getState())).toEqual(mockAdmin)
    expect(loadToken("admin")).toEqual({
      token: "new-admin-token",
      location: "local",
    })
  })

  it("logs out admin, clears token and updates store", async () => {
    saveToken("new-admin-token", true, "admin")

    const store = makeStore()
    await store.dispatch(logoutAdmin())

    expect(selectAdminAuthStatus(store.getState())).toBe("unauthenticated")
    expect(selectCurrentAdmin(store.getState())).toBeNull()
    expect(loadToken("admin")).toBeNull()
    clearToken("admin")
  })
})

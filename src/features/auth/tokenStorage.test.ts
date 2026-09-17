import { beforeEach, describe, expect, it } from "vitest"
import { clearToken, loadToken, saveToken } from "./tokenStorage"

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("saves and loads user token from localStorage when remember is true", () => {
    saveToken("user-token-123", true)
    const result = loadToken()
    expect(result).toEqual({ token: "user-token-123", location: "local" })
  })

  it("saves and loads user token from sessionStorage when remember is false", () => {
    saveToken("user-token-456", false)
    const result = loadToken()
    expect(result).toEqual({ token: "user-token-456", location: "session" })
  })

  it("clears user token without affecting admin token", () => {
    saveToken("user-token", true, "user")
    saveToken("admin-token", true, "admin")

    clearToken("user")

    expect(loadToken("user")).toBeNull()
    expect(loadToken("admin")).toEqual({
      token: "admin-token",
      location: "local",
    })
  })

  it("saves, loads and clears admin token independently", () => {
    saveToken("admin-token-789", false, "admin")
    expect(loadToken("user")).toBeNull()
    expect(loadToken("admin")).toEqual({
      token: "admin-token-789",
      location: "session",
    })

    clearToken("admin")
    expect(loadToken("admin")).toBeNull()
  })
})

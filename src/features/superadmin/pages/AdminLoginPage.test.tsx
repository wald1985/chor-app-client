import { screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import { selectCurrentAdmin } from "../adminAuthSlice"
import { superadminApi } from "../superadminApi"
import { AdminLoginPage } from "./AdminLoginPage"

describe("AdminLoginPage", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("renders the login form elements", () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("heading", { name: "Superadmin Login" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument()
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: "Angemeldet bleiben" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "← Zurück zur Chor-App" }),
    ).toBeInTheDocument()
  })

  it("submits the form successfully and updates store", async () => {
    vi.spyOn(superadminApi, "login").mockResolvedValue({
      accessToken: "mock-jwt",
      superadmin: {
        id: "sa-1",
        email: "admin@chor.de",
        name: "Admin User",
        isCurrent: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    })

    const { user, store } = renderWithProviders(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText("E-Mail"), "admin@chor.de")
    await user.type(screen.getByLabelText("Passwort"), "secret")
    await user.click(screen.getByRole("button", { name: "Anmelden" }))

    expect(superadminApi.login).toHaveBeenCalledWith({
      email: "admin@chor.de",
      password: "secret",
      remember: false,
    })

    expect(selectCurrentAdmin(store.getState())).toEqual({
      id: "sa-1",
      email: "admin@chor.de",
      name: "Admin User",
      isCurrent: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })
  })

  it("displays error message on failed login", async () => {
    vi.spyOn(superadminApi, "login").mockRejectedValue(
      new Error("Ungültige Anmeldedaten"),
    )

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText("E-Mail"), "admin@chor.de")
    await user.type(screen.getByLabelText("Passwort"), "wrong")
    await user.click(screen.getByRole("button", { name: "Anmelden" }))

    expect(
      await screen.findByText("Ungültige Anmeldedaten"),
    ).toBeInTheDocument()
  })
})

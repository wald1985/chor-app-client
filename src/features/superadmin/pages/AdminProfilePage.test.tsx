import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import { superadminApi } from "../superadminApi"
import type { SuperadminView } from "../types"
import { AdminProfilePage } from "./AdminProfilePage"

describe("AdminProfilePage", () => {
  const mockAdmin: SuperadminView = {
    id: "admin-1",
    email: "admin@chor.de",
    name: "Head Admin",
    isCurrent: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders with current admin data", () => {
    renderWithProviders(<AdminProfilePage />, {
      preloadedState: {
        adminAuth: {
          status: "authenticated",
          admin: mockAdmin,
          remember: false,
        },
      },
    })

    expect(
      screen.getByRole("heading", { name: "Superadmin Profil" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Head Admin")
    expect(screen.getByLabelText("E-Mail")).toHaveValue("admin@chor.de")
  })

  it("updates profile successfully", async () => {
    vi.spyOn(superadminApi, "updateMe").mockResolvedValue({
      ...mockAdmin,
      name: "New Name",
    })

    const { user } = renderWithProviders(<AdminProfilePage />, {
      preloadedState: {
        adminAuth: {
          status: "authenticated",
          admin: mockAdmin,
          remember: false,
        },
      },
    })

    const nameInput = screen.getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "New Name")

    await user.click(screen.getByRole("button", { name: "Profil speichern" }))

    expect(superadminApi.updateMe).toHaveBeenCalledWith({
      name: "New Name",
      email: "admin@chor.de",
    })
    expect(
      await screen.findByText("Profil erfolgreich aktualisiert."),
    ).toBeInTheDocument()
  })

  it("handles SUPERADMIN_EMAIL_TAKEN conflict code", async () => {
    const error = new HttpError(
      409,
      "Email already in use",
      undefined,
      "SUPERADMIN_EMAIL_TAKEN",
    )
    vi.spyOn(superadminApi, "updateMe").mockRejectedValue(error)

    const { user } = renderWithProviders(<AdminProfilePage />, {
      preloadedState: {
        adminAuth: {
          status: "authenticated",
          admin: mockAdmin,
          remember: false,
        },
      },
    })

    await user.click(screen.getByRole("button", { name: "Profil speichern" }))

    expect(
      await screen.findByText("Diese E-Mail-Adresse wird bereits verwendet."),
    ).toBeInTheDocument()
  })

  it("validates password mismatch on client", async () => {
    const { user } = renderWithProviders(<AdminProfilePage />, {
      preloadedState: {
        adminAuth: {
          status: "authenticated",
          admin: mockAdmin,
          remember: false,
        },
      },
    })

    await user.type(screen.getByLabelText("Aktuelles Passwort"), "oldpassword")
    await user.type(screen.getByLabelText("Neues Passwort"), "newpassword1")
    await user.type(
      screen.getByLabelText("Neues Passwort bestätigen"),
      "newpassword2",
    )

    await user.click(screen.getByRole("button", { name: "Passwort ändern" }))

    expect(
      await screen.findByText("Die Passwörter stimmen nicht überein."),
    ).toBeInTheDocument()
  })

  it("changes password successfully", async () => {
    vi.spyOn(superadminApi, "changePassword").mockResolvedValue({
      accessToken: "updated-token",
    })

    const { user } = renderWithProviders(<AdminProfilePage />, {
      preloadedState: {
        adminAuth: {
          status: "authenticated",
          admin: mockAdmin,
          remember: false,
        },
      },
    })

    await user.type(screen.getByLabelText("Aktuelles Passwort"), "oldpassword")
    await user.type(screen.getByLabelText("Neues Passwort"), "newpassword123")
    await user.type(
      screen.getByLabelText("Neues Passwort bestätigen"),
      "newpassword123",
    )

    await user.click(screen.getByRole("button", { name: "Passwort ändern" }))

    expect(superadminApi.changePassword).toHaveBeenCalledWith({
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
    })

    expect(
      await screen.findByText("Passwort erfolgreich geändert."),
    ).toBeInTheDocument()
  })
})

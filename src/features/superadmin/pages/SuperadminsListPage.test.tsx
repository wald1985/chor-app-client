import { screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import { superadminApi } from "../superadminApi"
import type { SuperadminView } from "../types"
import { SuperadminsListPage } from "./SuperadminsListPage"

describe("SuperadminsListPage", () => {
  const currentAdmin: SuperadminView = {
    id: "admin-1",
    email: "admin1@chor.de",
    name: "Admin One",
    isCurrent: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }

  const otherAdmin: SuperadminView = {
    id: "admin-2",
    email: "admin2@chor.de",
    name: "Admin Two",
    isCurrent: false,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(superadminApi, "listSuperadmins").mockResolvedValue([
      currentAdmin,
      otherAdmin,
    ])
  })

  it("loads and renders the superadmins list with current user badge and disabled delete", async () => {
    renderWithProviders(<SuperadminsListPage />)

    expect(await screen.findByText("Admin One")).toBeInTheDocument()
    expect(screen.getByText("Admin Two")).toBeInTheDocument()
    expect(screen.getByText("Du")).toBeInTheDocument()

    const deleteButtons = screen.getAllByRole("button", { name: "Löschen" })
    expect(deleteButtons[0]).toBeDisabled()
    expect(deleteButtons[1]).not.toBeDisabled()
  })

  it("creates a new superadmin", async () => {
    const newAdmin: SuperadminView = {
      id: "admin-3",
      email: "admin3@chor.de",
      name: "Admin Three",
      isCurrent: false,
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    }
    vi.spyOn(superadminApi, "createSuperadmin").mockResolvedValue(newAdmin)

    const { user } = renderWithProviders(<SuperadminsListPage />)

    await screen.findByText("Admin One")

    await user.click(
      screen.getByRole("button", { name: "+ Superadmin hinzufügen" }),
    )

    expect(
      screen.getByRole("heading", { name: "Neuen Superadmin anlegen" }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Name"), "Admin Three")
    await user.type(screen.getByLabelText("E-Mail"), "admin3@chor.de")
    await user.type(
      screen.getByLabelText("Initiales Passwort"),
      "securepassword123",
    )

    await user.click(screen.getByRole("button", { name: "Anlegen" }))

    expect(superadminApi.createSuperadmin).toHaveBeenCalledWith({
      name: "Admin Three",
      email: "admin3@chor.de",
      password: "securepassword123",
    })

    expect(await screen.findByText("Admin Three")).toBeInTheDocument()
  })

  it("edits an existing superadmin", async () => {
    const updatedAdmin: SuperadminView = {
      ...otherAdmin,
      name: "Admin Two Updated",
    }
    vi.spyOn(superadminApi, "updateSuperadmin").mockResolvedValue(updatedAdmin)

    const { user } = renderWithProviders(<SuperadminsListPage />)

    await screen.findByText("Admin One")

    const editButtons = screen.getAllByRole("button", { name: "Bearbeiten" })
    await user.click(editButtons[1])

    expect(
      screen.getByRole("heading", { name: "Superadmin bearbeiten" }),
    ).toBeInTheDocument()

    const nameInput = screen.getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "Admin Two Updated")

    await user.click(screen.getByRole("button", { name: "Speichern" }))

    expect(superadminApi.updateSuperadmin).toHaveBeenCalledWith("admin-2", {
      name: "Admin Two Updated",
      email: "admin2@chor.de",
    })

    expect(await screen.findByText("Admin Two Updated")).toBeInTheDocument()
  })

  it("deletes a superadmin after confirmation", async () => {
    vi.spyOn(superadminApi, "deleteSuperadmin").mockResolvedValue(undefined)

    const { user } = renderWithProviders(<SuperadminsListPage />)

    await screen.findByText("Admin One")

    const deleteButtons = screen.getAllByRole("button", { name: "Löschen" })
    await user.click(deleteButtons[1])

    expect(
      screen.getByRole("heading", { name: "Superadmin löschen" }),
    ).toBeInTheDocument()

    const confirmModal = screen.getByRole("dialog")
    const confirmButton = within(confirmModal).getByRole("button", {
      name: "Löschen",
    })

    await user.click(confirmButton)

    expect(superadminApi.deleteSuperadmin).toHaveBeenCalledWith("admin-2")
    expect(
      await screen.findByText('Superadmin "Admin Two" wurde gelöscht.'),
    ).toBeInTheDocument()
  })

  it("handles SUPERADMIN_LAST_REMAINING error when deleting", async () => {
    const error = new HttpError(
      409,
      "Cannot delete last admin",
      undefined,
      "SUPERADMIN_LAST_REMAINING",
    )
    vi.spyOn(superadminApi, "deleteSuperadmin").mockRejectedValue(error)

    const { user } = renderWithProviders(<SuperadminsListPage />)

    await screen.findByText("Admin One")

    const deleteButtons = screen.getAllByRole("button", { name: "Löschen" })
    await user.click(deleteButtons[1])

    const confirmModal = screen.getByRole("dialog")
    const confirmButton = within(confirmModal).getByRole("button", {
      name: "Löschen",
    })

    await user.click(confirmButton)

    expect(
      await screen.findByText(
        "Der letzte verbleibende Superadmin kann nicht gelöscht werden.",
      ),
    ).toBeInTheDocument()
  })
})

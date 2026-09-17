import { screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../../lib/http/httpError"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogAdminApi } from "../../api/catalogAdminApi"
import { catalogApi } from "../../api/catalogApi"
import type { ThemeView } from "../../types/catalog.types"
import { AdminThemesPage } from "./AdminThemesPage"

describe("AdminThemesPage", () => {
  const mockThemes: ThemeView[] = [
    {
      id: "theme-1",
      name: "Anbetung",
      songCount: 88,
      archived: false,
    },
    {
      id: "theme-2",
      name: "Altes Thema",
      songCount: 12,
      archived: true,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getThemes").mockResolvedValue(mockThemes)
  })

  it("renders the themes list with counts and badges", async () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole("heading", {
        name: "Bibliothek — Hauptthemen",
      }),
    ).toBeInTheDocument()

    expect(await screen.findByText("Anbetung")).toBeInTheDocument()
    expect(screen.getByText("88")).toBeInTheDocument()
    expect(screen.getByText("Aktiv")).toBeInTheDocument()

    expect(screen.getByText("Altes Thema")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("Archiviert")).toBeInTheDocument()
  })

  it("creates a new theme via modal", async () => {
    const createdTheme: ThemeView = {
      id: "theme-3",
      name: "Dankbarkeit",
      songCount: 0,
      archived: false,
    }
    vi.spyOn(catalogAdminApi, "createTheme").mockResolvedValue(createdTheme)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    await screen.findByText("Anbetung")

    await user.click(screen.getByRole("button", { name: "+ Neues Thema" }))

    expect(
      await screen.findByText("Neues Hauptthema anlegen"),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Name des Hauptthemas"),
      "Dankbarkeit",
    )
    await user.click(screen.getByRole("button", { name: "Thema anlegen" }))

    expect(catalogAdminApi.createTheme).toHaveBeenCalledWith({
      name: "Dankbarkeit",
    })

    expect(
      await screen.findByText("Thema „Dankbarkeit“ wurde angelegt."),
    ).toBeInTheDocument()
  })

  it("renames an existing theme via modal", async () => {
    vi.spyOn(catalogAdminApi, "renameTheme").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    await screen.findByText("Anbetung")

    const editButtons = screen.getAllByRole("button", { name: "Umbenennen" })
    await user.click(editButtons[0])

    expect(await screen.findByText("Thema umbenennen")).toBeInTheDocument()

    const nameInput = screen.getByLabelText("Name des Hauptthemas")
    await user.clear(nameInput)
    await user.type(nameInput, "Lob und Anbetung")

    await user.click(screen.getByRole("button", { name: "Speichern" }))

    expect(catalogAdminApi.renameTheme).toHaveBeenCalledWith("theme-1", {
      name: "Lob und Anbetung",
    })

    expect(
      await screen.findByText("Thema „Lob und Anbetung“ wurde umbenannt."),
    ).toBeInTheDocument()
  })

  it("archives a theme directly when not in use", async () => {
    vi.spyOn(catalogAdminApi, "archiveTheme").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    await screen.findByText("Anbetung")

    const archiveButton = screen.getByRole("button", { name: "Archivieren" })
    await user.click(archiveButton)

    expect(catalogAdminApi.archiveTheme).toHaveBeenCalledWith("theme-1", false)
    expect(
      await screen.findByText("Thema „Anbetung“ wurde archiviert."),
    ).toBeInTheDocument()
  })

  it("handles 409 LIBRARY_ITEM_IN_USE with UsageWarningModal and confirms archive", async () => {
    const conflictError = new HttpError(
      409,
      "Theme in use",
      undefined,
      "LIBRARY_ITEM_IN_USE",
      {
        usage: { communities: 5, references: 30 },
      },
    )

    vi.spyOn(catalogAdminApi, "archiveTheme")
      .mockRejectedValueOnce(conflictError)
      .mockResolvedValueOnce(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    await screen.findByText("Anbetung")

    const archiveButton = screen.getByRole("button", { name: "Archivieren" })
    await user.click(archiveButton)

    expect(
      await screen.findByText("Element ist in Verwendung"),
    ).toBeInTheDocument()
    expect(screen.getByText("„Anbetung“")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument()

    const modal = screen.getByRole("dialog")
    const confirmButton = within(modal).getByRole("button", {
      name: "Trotzdem archivieren",
    })
    await user.click(confirmButton)

    expect(catalogAdminApi.archiveTheme).toHaveBeenLastCalledWith(
      "theme-1",
      true,
    )
    expect(
      await screen.findByText("Thema „Anbetung“ wurde archiviert."),
    ).toBeInTheDocument()
  })

  it("restores an archived theme", async () => {
    vi.spyOn(catalogAdminApi, "restoreTheme").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminThemesPage />
      </MemoryRouter>,
    )

    await screen.findByText("Altes Thema")

    const restoreButton = screen.getByRole("button", {
      name: "Wiederherstellen",
    })
    await user.click(restoreButton)

    expect(catalogAdminApi.restoreTheme).toHaveBeenCalledWith("theme-2")
    expect(
      await screen.findByText("Thema „Altes Thema“ wurde wiederhergestellt."),
    ).toBeInTheDocument()
  })
})

import { screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../../lib/http/httpError"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogAdminApi } from "../../api/catalogAdminApi"
import { catalogApi } from "../../api/catalogApi"
import type { BookSummaryView, SeriesView } from "../../types/catalog.types"
import { AdminBooksPage } from "./AdminBooksPage"

describe("AdminBooksPage", () => {
  const mockSeries: SeriesView[] = [
    {
      id: "series-1",
      title: "Liederquell Serie",
      archived: false,
      books: [],
    },
  ]

  const mockBooks: BookSummaryView[] = [
    {
      id: "book-1",
      title: "Liederquell Band 1",
      series: { id: "series-1", title: "Liederquell Serie" },
      volume: 1,
      songCount: 120,
      archived: false,
    },
    {
      id: "book-2",
      title: "Chorbuch Alt",
      series: null,
      volume: null,
      songCount: 45,
      archived: true,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getSeries").mockResolvedValue(mockSeries)
    vi.spyOn(catalogApi, "getBooks").mockResolvedValue(mockBooks)
  })

  it("renders the books list with series titles and action buttons", async () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole("heading", {
        name: "Bibliothek — Bücher & Serien",
      }),
    ).toBeInTheDocument()

    expect(await screen.findByText("Liederquell Band 1")).toBeInTheDocument()
    expect(screen.getByText("Chorbuch Alt")).toBeInTheDocument()
    expect(screen.getAllByText("Liederquell Serie")).toHaveLength(2)
    expect(screen.getByText("120")).toBeInTheDocument()
    expect(screen.getByText("Aktiv")).toBeInTheDocument()
    expect(screen.getByText("Archiviert")).toBeInTheDocument()
  })

  it("opens create book modal and creates a new book", async () => {
    const createdBook: BookSummaryView = {
      id: "book-3",
      title: "Neues Liederbuch",
      series: null,
      volume: null,
      songCount: 0,
      archived: false,
    }
    vi.spyOn(catalogAdminApi, "createBook").mockResolvedValue(createdBook)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Liederquell Band 1")

    await user.click(screen.getByRole("button", { name: "+ Buch anlegen" }))

    expect(await screen.findByText("Neues Buch anlegen")).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Titel des Buches"),
      "Neues Liederbuch",
    )
    await user.click(screen.getByRole("button", { name: "Buch anlegen" }))

    expect(catalogAdminApi.createBook).toHaveBeenCalledWith({
      title: "Neues Liederbuch",
      seriesId: null,
      volume: null,
    })

    expect(
      await screen.findByText("Buch „Neues Liederbuch“ wurde angelegt."),
    ).toBeInTheDocument()
  })

  it("opens edit book modal and updates an existing book", async () => {
    vi.spyOn(catalogAdminApi, "patchBook").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Liederquell Band 1")

    const editButtons = screen.getAllByRole("button", { name: "Bearbeiten" })
    await user.click(editButtons[0])

    expect(await screen.findByText("Buch bearbeiten")).toBeInTheDocument()

    const titleInput = screen.getByLabelText("Titel des Buches")
    await user.clear(titleInput)
    await user.type(titleInput, "Liederquell Band 1 (Neuauflage)")

    await user.click(screen.getByRole("button", { name: "Speichern" }))

    expect(catalogAdminApi.patchBook).toHaveBeenCalledWith("book-1", {
      title: "Liederquell Band 1 (Neuauflage)",
      seriesId: "series-1",
      volume: 1,
    })

    expect(
      await screen.findByText(
        "Buch „Liederquell Band 1 (Neuauflage)“ wurde aktualisiert.",
      ),
    ).toBeInTheDocument()
  })

  it("opens create series modal and creates a new series", async () => {
    const newSeries: SeriesView = {
      id: "series-2",
      title: "Neue Reihe",
      archived: false,
      books: [],
    }
    vi.spyOn(catalogAdminApi, "createSeries").mockResolvedValue(newSeries)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Liederquell Band 1")

    await user.click(screen.getByRole("button", { name: "+ Serie anlegen" }))

    expect(await screen.findByText("Neue Serie anlegen")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Titel der Serie"), "Neue Reihe")
    await user.click(screen.getByRole("button", { name: "Serie anlegen" }))

    expect(catalogAdminApi.createSeries).toHaveBeenCalledWith({
      title: "Neue Reihe",
    })

    expect(
      await screen.findByText("Serie „Neue Reihe“ wurde angelegt."),
    ).toBeInTheDocument()
  })

  it("archives a book directly when not in use", async () => {
    vi.spyOn(catalogAdminApi, "archiveBook").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Liederquell Band 1")

    const archiveButton = screen.getByRole("button", { name: "Archivieren" })
    await user.click(archiveButton)

    expect(catalogAdminApi.archiveBook).toHaveBeenCalledWith("book-1", false)
    expect(
      await screen.findByText("Buch „Liederquell Band 1“ wurde archiviert."),
    ).toBeInTheDocument()
  })

  it("handles 409 LIBRARY_ITEM_IN_USE with UsageWarningModal and confirms archive", async () => {
    const conflictError = new HttpError(
      409,
      "Item in use",
      undefined,
      "LIBRARY_ITEM_IN_USE",
      {
        usage: { communities: 4, references: 18 },
      },
    )

    vi.spyOn(catalogAdminApi, "archiveBook")
      .mockRejectedValueOnce(conflictError)
      .mockResolvedValueOnce(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Liederquell Band 1")

    const archiveButton = screen.getByRole("button", { name: "Archivieren" })
    await user.click(archiveButton)

    // Verify modal appeared
    expect(
      await screen.findByText("Element ist in Verwendung"),
    ).toBeInTheDocument()
    expect(screen.getByText("„Liederquell Band 1“")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()

    // Confirm archive
    const modal = screen.getByRole("dialog")
    const confirmButton = within(modal).getByRole("button", {
      name: "Trotzdem archivieren",
    })
    await user.click(confirmButton)

    expect(catalogAdminApi.archiveBook).toHaveBeenLastCalledWith("book-1", true)
    expect(
      await screen.findByText("Buch „Liederquell Band 1“ wurde archiviert."),
    ).toBeInTheDocument()
  })

  it("restores an archived book", async () => {
    vi.spyOn(catalogAdminApi, "restoreBook").mockResolvedValue(undefined)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminBooksPage />
      </MemoryRouter>,
    )

    await screen.findByText("Chorbuch Alt")

    const restoreButton = screen.getByRole("button", {
      name: "Wiederherstellen",
    })
    await user.click(restoreButton)

    expect(catalogAdminApi.restoreBook).toHaveBeenCalledWith("book-2")
    expect(
      await screen.findByText("Buch „Chorbuch Alt“ wurde wiederhergestellt."),
    ).toBeInTheDocument()
  })
})

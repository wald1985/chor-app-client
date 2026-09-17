import { screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../../lib/http/httpError"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogAdminApi } from "../../api/catalogAdminApi"
import { catalogApi } from "../../api/catalogApi"
import type {
  BookView,
  SeriesView,
  SongView,
  ThemeView,
} from "../../types/catalog.types"
import { AdminBookDetailPage } from "./AdminBookDetailPage"

describe("AdminBookDetailPage", () => {
  const mockBook: BookView = {
    id: "book-1",
    title: "Liederquell Band 1",
    series: { id: "series-1", title: "Liederquell Serie" },
    volume: 1,
    archived: false,
    songs: [
      {
        id: "song-1",
        number: "1",
        title: "Großer Gott, wir loben dich",
        author: "Ignaz Franz",
        arranger: "Peter Ritter",
        archived: false,
        themes: [{ id: "theme-1", name: "Anbetung", archived: false }],
      },
      {
        id: "song-2",
        number: "2",
        title: "Altes Archiviertes Lied",
        author: null,
        arranger: null,
        archived: true,
        themes: [],
      },
    ],
  }

  const mockThemes: ThemeView[] = [
    { id: "theme-1", name: "Anbetung", songCount: 50, archived: false },
    { id: "theme-2", name: "Dankbarkeit", songCount: 20, archived: false },
  ]

  const mockSeries: SeriesView[] = [
    {
      id: "series-1",
      title: "Liederquell Serie",
      archived: false,
      books: [],
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getBook").mockResolvedValue(mockBook)
    vi.spyOn(catalogApi, "getThemes").mockResolvedValue(mockThemes)
    vi.spyOn(catalogApi, "getSeries").mockResolvedValue(mockSeries)
  })

  const renderComponent = () => {
    return renderWithProviders(
      <MemoryRouter initialEntries={["/admin/library/books/book-1"]}>
        <Routes>
          <Route
            path="/admin/library/books/:bookId"
            element={<AdminBookDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    )
  }

  it("renders book details, series badge, and songs list", async () => {
    renderComponent()

    expect(
      await screen.findByRole("heading", { name: "Liederquell Band 1" }),
    ).toBeInTheDocument()

    expect(screen.getByText("Liederquell Serie — Band 1")).toBeInTheDocument()
    expect(screen.getByText("2 Lieder erfasst")).toBeInTheDocument()
    expect(screen.getAllByText("Aktiv")).toHaveLength(2)
    expect(screen.getByText("Archiviert")).toBeInTheDocument()

    // Table rows
    expect(screen.getByText("Großer Gott, wir loben dich")).toBeInTheDocument()
    expect(screen.getByText("Ignaz Franz")).toBeInTheDocument()
    expect(screen.getByText("Peter Ritter")).toBeInTheDocument()
    expect(screen.getByText("Anbetung")).toBeInTheDocument()
    expect(screen.getByText("Altes Archiviertes Lied")).toBeInTheDocument()
  })

  it("updates book via BookFormModal", async () => {
    vi.spyOn(catalogAdminApi, "patchBook").mockResolvedValue(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    await user.click(screen.getByRole("button", { name: "Buch bearbeiten" }))

    const modal = await screen.findByRole("dialog")
    expect(within(modal).getByText("Buch bearbeiten")).toBeInTheDocument()

    const titleInput = within(modal).getByLabelText("Titel des Buches")
    await user.clear(titleInput)
    await user.type(titleInput, "Liederquell Band 1 (Ed. 2)")

    await user.click(within(modal).getByRole("button", { name: "Speichern" }))

    expect(catalogAdminApi.patchBook).toHaveBeenCalledWith("book-1", {
      title: "Liederquell Band 1 (Ed. 2)",
      seriesId: "series-1",
      volume: 1,
    })

    expect(
      await screen.findByText(
        "Buch „Liederquell Band 1 (Ed. 2)“ wurde aktualisiert.",
      ),
    ).toBeInTheDocument()
  })

  it("archives book and handles 409 LIBRARY_ITEM_IN_USE", async () => {
    const conflictError = new HttpError(
      409,
      "Book in use",
      undefined,
      "LIBRARY_ITEM_IN_USE",
      {
        usage: { communities: 3, references: 15 },
      },
    )

    vi.spyOn(catalogAdminApi, "archiveBook")
      .mockRejectedValueOnce(conflictError)
      .mockResolvedValueOnce(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    await user.click(screen.getByRole("button", { name: "Buch archivieren" }))

    expect(
      await screen.findByText("Element ist in Verwendung"),
    ).toBeInTheDocument()
    expect(screen.getByText("„Liederquell Band 1“")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("15")).toBeInTheDocument()

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

  it("creates a new song via SongFormModal", async () => {
    const createdSong: SongView = {
      id: "song-3",
      number: "3",
      title: "Neues Lied",
      author: "Test Autor",
      arranger: null,
      archived: false,
      themes: [],
      book: {
        id: "book-1",
        title: "Liederquell Band 1",
        volume: 1,
        archived: false,
      },
      series: null,
    }
    vi.spyOn(catalogAdminApi, "createSong").mockResolvedValue(createdSong)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    await user.click(screen.getByRole("button", { name: "+ Lied hinzufügen" }))

    expect(await screen.findByText("Neues Lied anlegen")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Liednummer *"), "3")
    await user.type(screen.getByLabelText("Titel des Liedes *"), "Neues Lied")
    await user.type(
      screen.getByLabelText("Autor / Text (optional)"),
      "Test Autor",
    )

    await user.click(screen.getByRole("button", { name: "Lied anlegen" }))

    expect(catalogAdminApi.createSong).toHaveBeenCalledWith("book-1", {
      number: "3",
      title: "Neues Lied",
      author: "Test Autor",
      arranger: null,
    })

    expect(
      await screen.findByText("Lied Nr. 3 wurde hinzugefügt."),
    ).toBeInTheDocument()
  })

  it("updates a song via SongFormModal", async () => {
    vi.spyOn(catalogAdminApi, "patchSong").mockResolvedValue(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    const editButtons = screen.getAllByRole("button", { name: "Bearbeiten" })
    await user.click(editButtons[0])

    expect(await screen.findByText("Lied bearbeiten")).toBeInTheDocument()

    const titleInput = screen.getByLabelText("Titel des Liedes *")
    await user.clear(titleInput)
    await user.type(titleInput, "Großer Gott, wir loben dich (Chorsatz)")

    await user.click(screen.getByRole("button", { name: "Speichern" }))

    expect(catalogAdminApi.patchSong).toHaveBeenCalledWith("song-1", {
      number: "1",
      title: "Großer Gott, wir loben dich (Chorsatz)",
      author: "Ignaz Franz",
      arranger: "Peter Ritter",
    })

    expect(
      await screen.findByText("Lied Nr. 1 wurde aktualisiert."),
    ).toBeInTheDocument()
  })

  it("assigns themes to a song via SongThemesModal", async () => {
    vi.spyOn(catalogAdminApi, "setSongThemes").mockResolvedValue(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    const themenButtons = screen.getAllByRole("button", { name: "Themen" })
    await user.click(themenButtons[0])

    expect(await screen.findByText("Themen zuweisen")).toBeInTheDocument()
    expect(
      screen.getByText("Nr. 1 — Großer Gott, wir loben dich"),
    ).toBeInTheDocument()

    const dankbarkeitCheckbox = screen.getByLabelText("Dankbarkeit")
    await user.click(dankbarkeitCheckbox)

    await user.click(screen.getByRole("button", { name: "Themen speichern" }))

    expect(catalogAdminApi.setSongThemes).toHaveBeenCalledWith("song-1", {
      themeIds: ["theme-1", "theme-2"],
    })

    expect(
      await screen.findByText("Themen für Lied Nr. 1 wurden gespeichert."),
    ).toBeInTheDocument()
  })

  it("archives a song and handles 409 LIBRARY_ITEM_IN_USE with UsageWarningModal", async () => {
    const conflictError = new HttpError(
      409,
      "Song in use",
      undefined,
      "LIBRARY_ITEM_IN_USE",
      {
        usage: { communities: 2, references: 8 },
      },
    )

    vi.spyOn(catalogAdminApi, "archiveSong")
      .mockRejectedValueOnce(conflictError)
      .mockResolvedValueOnce(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    const archiveButton = screen.getByRole("button", { name: "Archivieren" })
    await user.click(archiveButton)

    expect(
      await screen.findByText("Element ist in Verwendung"),
    ).toBeInTheDocument()
    const modal = screen.getByRole("dialog")
    expect(
      within(modal).getByText("„Großer Gott, wir loben dich“"),
    ).toBeInTheDocument()
    expect(within(modal).getByText("2")).toBeInTheDocument()
    expect(within(modal).getByText("8")).toBeInTheDocument()

    const confirmButton = within(modal).getByRole("button", {
      name: "Trotzdem archivieren",
    })
    await user.click(confirmButton)

    expect(catalogAdminApi.archiveSong).toHaveBeenLastCalledWith("song-1", true)
    expect(
      await screen.findByText(
        "Lied „Großer Gott, wir loben dich“ wurde archiviert.",
      ),
    ).toBeInTheDocument()
  })

  it("restores an archived song", async () => {
    vi.spyOn(catalogAdminApi, "restoreSong").mockResolvedValue(undefined)

    const { user } = renderComponent()

    await screen.findByRole("heading", { name: "Liederquell Band 1" })

    const restoreButton = screen.getByRole("button", {
      name: "Wiederherstellen",
    })
    await user.click(restoreButton)

    expect(catalogAdminApi.restoreSong).toHaveBeenCalledWith("song-2")
    expect(
      await screen.findByText(
        "Lied „Altes Archiviertes Lied“ wurde wiederhergestellt.",
      ),
    ).toBeInTheDocument()
  })
})

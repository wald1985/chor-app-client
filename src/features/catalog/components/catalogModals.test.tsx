import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import { BookFormModal } from "./BookFormModal"
import { SeriesFormModal } from "./SeriesFormModal"
import { SongFormModal } from "./SongFormModal"
import { SongThemesModal } from "./SongThemesModal"
import { ThemeFormModal } from "./ThemeFormModal"
import { UsageWarningModal } from "./UsageWarningModal"

describe("Catalog Modals", () => {
  it("UsageWarningModal renders usage counts and triggers onConfirm", async () => {
    const handleConfirm = vi.fn()
    const handleCancel = vi.fn()

    const { user } = renderWithProviders(
      <UsageWarningModal
        show={true}
        itemTitle="Buch 1"
        usage={{ communities: 3, references: 12 }}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    )

    expect(screen.getByText("Element ist in Verwendung")).toBeInTheDocument()
    expect(screen.getByText("„Buch 1“")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Trotzdem archivieren" }),
    )
    expect(handleConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "Abbrechen" }))
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it("SeriesFormModal submits entered title", async () => {
    const handleSubmit = vi.fn()
    const handleCancel = vi.fn()

    const { user } = renderWithProviders(
      <SeriesFormModal
        show={true}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    )

    const input = screen.getByLabelText("Titel der Serie")
    await user.type(input, "Neue Serie")

    await user.click(screen.getByRole("button", { name: "Serie anlegen" }))
    expect(handleSubmit).toHaveBeenCalledWith("Neue Serie")
  })

  it("BookFormModal handles title, series selection, and volume", async () => {
    const handleSubmit = vi.fn()
    const handleCancel = vi.fn()

    const seriesList = [
      { id: "s1", title: "Bücher", archived: false, books: [] },
    ]

    const { user } = renderWithProviders(
      <BookFormModal
        show={true}
        seriesList={seriesList}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    )

    await user.type(screen.getByLabelText("Titel des Buches"), "Buch 2")
    await user.selectOptions(screen.getByLabelText("Serie (optional)"), "s1")

    // Volume input should now appear
    const volumeInput = screen.getByLabelText("Bandnummer in der Serie")
    await user.type(volumeInput, "2")

    await user.click(screen.getByRole("button", { name: "Buch anlegen" }))
    expect(handleSubmit).toHaveBeenCalledWith({
      title: "Buch 2",
      seriesId: "s1",
      volume: 2,
    })
  })

  it("ThemeFormModal submits entered theme name", async () => {
    const handleSubmit = vi.fn()
    const handleCancel = vi.fn()

    const { user } = renderWithProviders(
      <ThemeFormModal
        show={true}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    )

    await user.type(screen.getByLabelText("Name des Hauptthemas"), "Gebet")
    await user.click(screen.getByRole("button", { name: "Thema anlegen" }))
    expect(handleSubmit).toHaveBeenCalledWith("Gebet")
  })

  it("SongFormModal submits song number, title, author, and arranger", async () => {
    const handleSubmit = vi.fn()
    const handleCancel = vi.fn()

    const { user } = renderWithProviders(
      <SongFormModal
        show={true}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    )

    await user.type(screen.getByLabelText("Liednummer *"), "42")
    await user.type(
      screen.getByLabelText("Titel des Liedes *"),
      "Großer Gott, wir loben dich",
    )
    await user.type(
      screen.getByLabelText("Autor / Text (optional)"),
      "Ignaz Franz",
    )
    await user.type(
      screen.getByLabelText("Arrangeur / Melodie (optional)"),
      "Peter Ritter",
    )

    await user.click(screen.getByRole("button", { name: "Lied anlegen" }))
    expect(handleSubmit).toHaveBeenCalledWith({
      number: "42",
      title: "Großer Gott, wir loben dich",
      author: "Ignaz Franz",
      arranger: "Peter Ritter",
    })
  })

  it("SongThemesModal toggles and submits selected themes", async () => {
    const handleSubmit = vi.fn()
    const handleCancel = vi.fn()

    const themesList = [
      { id: "t1", name: "Anbetung", songCount: 5, archived: false },
      { id: "t2", name: "Dankbarkeit", songCount: 2, archived: false },
    ]

    const { user } = renderWithProviders(
      <SongThemesModal
        show={true}
        songTitle="Lied 1"
        songNumber="1"
        currentThemeIds={["t1"]}
        themesList={themesList}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    )

    expect(screen.getByText("Themen zuweisen")).toBeInTheDocument()
    expect(screen.getByText("Nr. 1 — Lied 1")).toBeInTheDocument()

    // Toggle t2
    const checkboxT2 = screen.getByLabelText("Dankbarkeit")
    expect(checkboxT2).not.toBeChecked()
    await user.click(checkboxT2)
    expect(checkboxT2).toBeChecked()

    await user.click(screen.getByRole("button", { name: "Themen speichern" }))
    expect(handleSubmit).toHaveBeenCalledWith(["t1", "t2"])
  })
})

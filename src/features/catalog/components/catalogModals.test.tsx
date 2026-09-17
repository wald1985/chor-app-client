import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import { BookFormModal } from "./BookFormModal"
import { SeriesFormModal } from "./SeriesFormModal"
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
})

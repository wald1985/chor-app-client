import { screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogApi } from "../../api/catalogApi"
import { communityAttachmentsApi } from "../../api/communityAttachmentsApi"
import type { BookSummaryView } from "../../types/catalog.types"
import { RepertoireSettingsPage } from "./RepertoireSettingsPage"

const mockBooks: BookSummaryView[] = [
  {
    id: "book-1",
    title: "Buch 1",
    series: { id: "s1", title: "Bücher" },
    volume: 1,
    songCount: 163,
    archived: false,
  },
  {
    id: "book-2",
    title: "Buch 2",
    series: { id: "s1", title: "Bücher" },
    volume: 2,
    songCount: 194,
    archived: false,
  },
]

describe("RepertoireSettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getBooks").mockResolvedValue(mockBooks)
  })

  const renderPage = (initialEntries = ["/communities/comm-1/repertoire"]) => {
    return renderWithProviders(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/communities/:communityId/repertoire"
            element={<RepertoireSettingsPage />}
          />
          <Route path="/lieder" element={<div>Liederliste</div>} />
        </Routes>
      </MemoryRouter>,
      {
        preloadedState: {
          auth: {
            status: "authenticated",
            user: { id: "u1", email: "user@test.de", name: "Max Mustermann" },
            memberships: [
              {
                communityId: "comm-1",
                communityName: "Chor Zion",
                role: "MEMBER",
              },
            ],
            remember: false,
          },
        },
      },
    )
  }

  it("renders empty state when no books are attached", async () => {
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([])

    renderPage()

    expect(screen.getByText("Repertoire-Einstellungen")).toBeInTheDocument()
    expect(screen.getByText("Chor Zion")).toBeInTheDocument()

    expect(
      await screen.findByText("Noch keine Bücher eingebunden"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Zurück zur Liederübersicht/i }),
    ).toBeInTheDocument()
  })

  it("renders list of attached books with their details", async () => {
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([
      {
        id: "att-1",
        communityId: "comm-1",
        libraryBookId: "book-1",
      },
    ])

    renderPage()

    expect(await screen.findByText("Buch 1")).toBeInTheDocument()
    expect(screen.getByText(/Bücher \(Band 1\)/)).toBeInTheDocument()
    expect(screen.getByText("163 Lieder")).toBeInTheDocument()
    expect(
      screen.getByText("Gedruckte Ausgabe (schreibgeschützt)"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Entfernen" }),
    ).toBeInTheDocument()
  })

  it("opens LibraryBrowserModal when clicking Buch aus Bibliothek hinzufügen", async () => {
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([])

    const { user } = renderPage()

    const addButtons = await screen.findAllByRole("button", {
      name: /Buch aus Bibliothek hinzufügen/i,
    })
    await user.click(addButtons[0])

    expect(
      await screen.findByRole("dialog", {
        name: /Buch aus Bibliothek hinzufügen/i,
      }),
    ).toBeInTheDocument()
  })

  it("confirms and detaches an attached book", async () => {
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([
      {
        id: "att-1",
        communityId: "comm-1",
        libraryBookId: "book-1",
      },
    ])
    const detachSpy = vi
      .spyOn(communityAttachmentsApi, "detachBook")
      .mockResolvedValue(undefined)

    const { user } = renderPage()

    expect(await screen.findByText("Buch 1")).toBeInTheDocument()

    const removeBtn = screen.getByRole("button", { name: "Entfernen" })
    await user.click(removeBtn)

    // Detach confirmation modal appears
    expect(
      await screen.findByText("Buch aus Repertoire trennen?"),
    ).toBeInTheDocument()

    const confirmBtn = screen.getByRole("button", { name: "Buch trennen" })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(detachSpy).toHaveBeenCalledWith("comm-1", "att-1")
    })

    expect(
      await screen.findByText(/wurde erfolgreich aus dem Repertoire entfernt/i),
    ).toBeInTheDocument()
  })
})

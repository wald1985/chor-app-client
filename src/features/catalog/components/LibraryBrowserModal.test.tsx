import { screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import { catalogApi } from "../api/catalogApi"
import { communityAttachmentsApi } from "../api/communityAttachmentsApi"
import type { BookSummaryView } from "../types/catalog.types"
import { LibraryBrowserModal } from "./LibraryBrowserModal"

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

describe("LibraryBrowserModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getBooks").mockResolvedValue(mockBooks)
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([
      {
        id: "att-1",
        communityId: "comm-1",
        libraryBookId: "book-1",
      },
    ])
  })

  it("renders books and marks attached book with disabled button", async () => {
    renderWithProviders(
      <LibraryBrowserModal
        show={true}
        onHide={vi.fn()}
        communityId="comm-1"
        communityName="Chor Zion"
      />,
    )

    expect(
      screen.getByText("Buch aus Bibliothek hinzufügen"),
    ).toBeInTheDocument()
    expect(screen.getByText("Chor Zion")).toBeInTheDocument()

    expect(await screen.findByText("Buch 1")).toBeInTheDocument()
    expect(screen.getByText("Buch 2")).toBeInTheDocument()

    // book-1 is attached
    expect(screen.getByText("✓ Bereits verbunden")).toBeInTheDocument()
    const connectedBtn = screen.getByRole("button", { name: "Verbunden" })
    expect(connectedBtn).toBeDisabled()

    // book-2 is not attached
    const connectBtn = screen.getByRole("button", { name: "Verbinden" })
    expect(connectBtn).not.toBeDisabled()
  })

  it("attaches unattached book when clicking Verbinden", async () => {
    const attachSpy = vi
      .spyOn(communityAttachmentsApi, "attachBook")
      .mockResolvedValue({
        id: "att-2",
        communityId: "comm-1",
        libraryBookId: "book-2",
      })

    const { user } = renderWithProviders(
      <LibraryBrowserModal show={true} onHide={vi.fn()} communityId="comm-1" />,
    )

    expect(await screen.findByText("Buch 2")).toBeInTheDocument()

    const connectBtn = screen.getByRole("button", { name: "Verbinden" })
    await user.click(connectBtn)

    await waitFor(() => {
      expect(attachSpy).toHaveBeenCalledWith("comm-1", {
        libraryBookId: "book-2",
      })
    })

    expect(
      await screen.findByText(
        /wurde erfolgreich mit dem Repertoire verbunden/i,
      ),
    ).toBeInTheDocument()
  })

  it("filters books by search term", async () => {
    const { user } = renderWithProviders(
      <LibraryBrowserModal show={true} onHide={vi.fn()} communityId="comm-1" />,
    )

    expect(await screen.findByText("Buch 1")).toBeInTheDocument()
    expect(screen.getByText("Buch 2")).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(
      "Buch nach Titel oder Serie suchen...",
    )
    await user.type(searchInput, "Buch 2")

    expect(screen.queryByText("Buch 1")).not.toBeInTheDocument()
    expect(screen.getByText("Buch 2")).toBeInTheDocument()
  })
})

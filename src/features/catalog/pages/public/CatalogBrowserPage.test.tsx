import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogApi } from "../../api/catalogApi"
import { communityAttachmentsApi } from "../../api/communityAttachmentsApi"
import type {
  BookSummaryView,
  BookView,
  ThemeView,
} from "../../types/catalog.types"
import { CatalogBrowserPage } from "./CatalogBrowserPage"

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

const mockBookDetail: BookView = {
  id: "book-1",
  title: "Buch 1",
  series: { id: "s1", title: "Bücher" },
  volume: 1,
  archived: false,
  songs: [
    {
      id: "song-1",
      number: "1",
      title: "O großer Gott",
      author: "C. Boberg",
      arranger: null,
      themes: [{ id: "t1", name: "Lob und Dank", archived: false }],
      archived: false,
    },
  ],
}

const mockThemes: ThemeView[] = [
  { id: "t1", name: "Lob und Dank", archived: false, songCount: 50 },
]

describe("CatalogBrowserPage with Community attachments", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(catalogApi, "getBooks").mockResolvedValue(mockBooks)
    vi.spyOn(catalogApi, "getBook").mockResolvedValue(mockBookDetail)
    vi.spyOn(catalogApi, "getThemes").mockResolvedValue(mockThemes)
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([
      {
        id: "att-1",
        communityId: "comm-1",
        libraryBookId: "book-1",
      },
    ])
  })

  it("renders community switcher, Repertoire-Einstellungen link and groups attached books", async () => {
    const { user } = renderWithProviders(
      <MemoryRouter>
        <CatalogBrowserPage defaultMode="songs" />
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

    // Checks community bar
    expect(screen.getByText("Chorgemeinschaft:")).toBeInTheDocument()
    expect(screen.getByText("Chor Zion")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Repertoire-Einstellungen/i }),
    ).toBeInTheDocument()

    // Check optgroups and options
    expect(
      await screen.findByRole("group", {
        name: "Eingebundene Repertoire-Bücher",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("group", { name: "Weitere Bibliotheksbücher" }),
    ).toBeInTheDocument()

    // Select book-1
    const bookSelect = screen.getByLabelText(/Liederbuch auswählen/i)
    await user.selectOptions(bookSelect, "book-1")

    // Check book songs and read-only status
    expect(await screen.findByText("O großer Gott")).toBeInTheDocument()
    expect(screen.getByText("✓ Im Repertoire eingebunden")).toBeInTheDocument()
    expect(
      screen.getByText("Quelle: Bibliothek (Nur Lesezugriff)"),
    ).toBeInTheDocument()

    // Verify there are no edit or delete buttons on the song
    expect(
      screen.queryByRole("button", { name: /bearbeiten/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /löschen/i }),
    ).not.toBeInTheDocument()
  })
})

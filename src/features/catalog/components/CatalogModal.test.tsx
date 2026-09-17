import { screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import { catalogApi } from "../api/catalogApi"
import type {
  BookSummaryView,
  BookView,
  ThemeView,
} from "../types/catalog.types"
import { CatalogModal } from "./CatalogModal"

vi.mock("../api/catalogApi", () => ({
  catalogApi: {
    getBooks: vi.fn(),
    getBook: vi.fn(),
    getThemes: vi.fn(),
  },
}))

const mockBooks: BookSummaryView[] = [
  {
    id: "b1",
    title: "Buch 1",
    series: { id: "s1", title: "Bücher" },
    volume: 1,
    songCount: 163,
    archived: false,
  },
  {
    id: "b2",
    title: "Buch 2",
    series: { id: "s1", title: "Bücher" },
    volume: 2,
    songCount: 194,
    archived: false,
  },
]

const mockBookDetail: BookView = {
  id: "b1",
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
    {
      id: "song-2",
      number: "2",
      title: "Herr, deine Güte",
      author: null,
      arranger: "A. Becker",
      themes: [{ id: "t2", name: "Gnade", archived: false }],
      archived: false,
    },
  ],
}

const mockThemes: ThemeView[] = [
  { id: "t1", name: "Lob und Dank", archived: false, songCount: 50 },
  { id: "t2", name: "Gnade", archived: false, songCount: 20 },
]

describe("CatalogModal", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(catalogApi.getBooks).mockResolvedValue(mockBooks)
    vi.mocked(catalogApi.getBook).mockResolvedValue(mockBookDetail)
    vi.mocked(catalogApi.getThemes).mockResolvedValue(mockThemes)
  })

  it("renders catalog modal with read-only badge and book list", async () => {
    renderWithProviders(<CatalogModal show={true} onHide={vi.fn()} />, {
      preloadedState: {
        auth: {
          status: "authenticated",
          user: { id: "u1", email: "test@chor.de", name: "Test User" },
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
    })

    expect(screen.getByText("Liederbuch-Katalog")).toBeInTheDocument()
    expect(screen.getByText("Nur Lesezugriff")).toBeInTheDocument()
    expect(screen.getByText("Chor Zion")).toBeInTheDocument()

    expect(await screen.findByText("Buch 1")).toBeInTheDocument()
    expect(screen.getByText("Buch 2")).toBeInTheDocument()
    expect(await screen.findByText("O großer Gott")).toBeInTheDocument()
    expect(screen.getByText("Herr, deine Güte")).toBeInTheDocument()
  })

  it("copies a book with its songs into the community and updates status", async () => {
    const { user } = renderWithProviders(
      <CatalogModal show={true} onHide={vi.fn()} />,
      {
        preloadedState: {
          auth: {
            status: "authenticated",
            user: { id: "u1", email: "test@chor.de", name: "Test User" },
            memberships: [
              {
                communityId: "comm-1",
                communityName: "Chor Zion",
                role: "ADMINISTRATOR",
              },
            ],
            remember: false,
          },
        },
      },
    )

    expect(await screen.findByText("O großer Gott")).toBeInTheDocument()

    const copyBtn = screen.getByRole("button", {
      name: /Buch in Community kopieren/i,
    })
    await user.click(copyBtn)

    await waitFor(() => {
      expect(
        screen.getByText(
          /wurde erfolgreich in die Community «Chor Zion» kopiert!/i,
        ),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: /Erneut in Community kopieren/i }),
    ).toBeInTheDocument()
  })
})

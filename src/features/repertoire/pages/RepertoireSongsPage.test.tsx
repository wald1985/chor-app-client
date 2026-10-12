import { screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../../utils/test-utils"
import type { RootState } from "../../../app/store"
import { communitySongsApi } from "../api/communitySongsApi"
import type { CommunitySongView } from "../types/repertoire.types"
import { RepertoireSongsPage } from "./RepertoireSongsPage"

const songs: CommunitySongView[] = [
  {
    id: "s1",
    source: "LIBRARY",
    container: { id: "book-1", title: "Buch 1", type: "BOOK" },
    number: "42",
    title: "Großer Gott",
    author: "C. Boberg",
    arranger: null,
    isNew: false,
    themes: [{ source: "LIBRARY", id: "t1", name: "Lob und Dank" }],
    archived: false,
  },
  {
    id: "s2",
    source: "COMMUNITY",
    container: { id: "folder-1", title: "Mappe", type: "FOLDER" },
    number: "1",
    title: "Stille Nacht",
    author: null,
    arranger: "F. Gruber",
    isNew: true,
    themes: [{ source: "COMMUNITY", id: "t2", name: "Advent" }],
    archived: false,
  },
]

const authState = (
  permissions: ("REPERTOIRE_MANAGE" | "PEOPLE_MANAGE")[],
  withMembership = true,
): Partial<RootState> => ({
  auth: {
    status: "authenticated",
    user: { id: "u1", email: "user@test.de", name: "Max Mustermann" },
    memberships: withMembership
      ? [
          {
            communityId: "comm-1",
            communityName: "Chor Zion",
            role: "MEMBER",
            permissions,
          },
          {
            communityId: "comm-2",
            communityName: "Chor Zwei",
            role: "MEMBER",
            permissions: [],
          },
        ]
      : [],
    remember: false,
  },
})

const renderPage = (
  mode: "songs" | "themes",
  preloadedState: Partial<RootState>,
) =>
  renderWithProviders(
    <MemoryRouter>
      <RepertoireSongsPage mode={mode} />
    </MemoryRouter>,
    { preloadedState },
  )

describe("RepertoireSongsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("loads songs of the first membership and lists them sorted", async () => {
    const getSongs = vi
      .spyOn(communitySongsApi, "getSongs")
      .mockResolvedValue(songs)

    renderPage("songs", authState([]))

    expect(await screen.findByText("Großer Gott")).toBeInTheDocument()
    expect(getSongs).toHaveBeenCalledWith("comm-1", undefined)
    expect(screen.getByText("Chor Zion")).toBeInTheDocument()

    const rows = screen.getAllByRole("row").slice(1)
    // "Buch 1" sorts before "Mappe".
    expect(within(rows[0]).getByText("Großer Gott")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Stille Nacht")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Neu")).toBeInTheDocument()
  })

  it("filters by search term and shows an empty-result message", async () => {
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue(songs)
    const { user } = renderPage("songs", authState([]))

    await screen.findByText("Großer Gott")
    await user.type(screen.getByLabelText(/Suche nach Titel/), "stille")
    expect(screen.queryByText("Großer Gott")).not.toBeInTheDocument()
    expect(screen.getByText("Stille Nacht")).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/Suche nach Titel/))
    await user.type(screen.getByLabelText(/Suche nach Titel/), "xyz")
    expect(screen.getByText("Keine Lieder gefunden.")).toBeInTheDocument()
  })

  it("filters by container and by theme", async () => {
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue(songs)
    const { user } = renderPage("themes", authState([]))

    await screen.findByText("Großer Gott")

    await user.selectOptions(screen.getByLabelText("Sammlung"), "folder-1")
    expect(screen.queryByText("Großer Gott")).not.toBeInTheDocument()
    expect(screen.getByText("Stille Nacht")).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("Sammlung"), "")
    await user.selectOptions(screen.getByLabelText("Thema"), "lob und dank")
    expect(screen.getByText("Großer Gott")).toBeInTheDocument()
    expect(screen.queryByText("Stille Nacht")).not.toBeInTheDocument()
  })

  it("shows the empty state when the repertoire has no songs", async () => {
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue([])
    renderPage("songs", authState([]))

    expect(
      await screen.findByText("Noch keine Lieder im Repertoire"),
    ).toBeInTheDocument()
  })

  it("shows an error message when loading fails", async () => {
    vi.spyOn(communitySongsApi, "getSongs").mockRejectedValue(
      new Error("Server nicht erreichbar"),
    )
    renderPage("songs", authState([]))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("offers the settings link only with REPERTOIRE_MANAGE", async () => {
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue(songs)

    const withoutPermission = renderPage("songs", authState([]))
    await screen.findByText("Großer Gott")
    expect(
      screen.queryByRole("link", { name: /Repertoire-Einstellungen/ }),
    ).not.toBeInTheDocument()
    withoutPermission.unmount()

    renderPage("songs", authState(["REPERTOIRE_MANAGE"]))
    expect(
      await screen.findByRole("link", { name: /Repertoire-Einstellungen/ }),
    ).toHaveAttribute("href", "/communities/comm-1/repertoire")
  })

  it("tells the user without a Community that nothing is available", () => {
    const getSongs = vi.spyOn(communitySongsApi, "getSongs")
    renderPage("songs", authState([], false))

    expect(screen.getByText(/noch keiner Chorgemeinschaft/)).toBeInTheDocument()
    expect(getSongs).not.toHaveBeenCalled()
  })
})

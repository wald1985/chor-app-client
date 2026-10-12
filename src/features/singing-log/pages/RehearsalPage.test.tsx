import { screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RootState } from "../../../app/store"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import { peopleApi } from "../../people/api/peopleApi"
import { communitySongsApi } from "../../repertoire/api/communitySongsApi"
import { rehearsalsApi } from "../api/rehearsalsApi"
import type {
  RehearsalDetailView,
  RehearsalSummaryView,
} from "../types/singing-log.types"
import { RehearsalPage } from "./RehearsalPage"
import { authState, testPeople, testSongs } from "./singing-log-test-helpers"

const summary = (
  overrides: Partial<RehearsalSummaryView> & { id: string },
): RehearsalSummaryView => ({
  date: "2026-10-08",
  warmUpLeader: null,
  note: null,
  entryCount: 0,
  createdAt: "2026-10-08T10:00:00.000Z",
  ...overrides,
})

const detail = (
  overrides: Partial<RehearsalDetailView> & { id: string },
): RehearsalDetailView => ({
  ...summary({ id: overrides.id }),
  entries: [],
  ...overrides,
})

const renderPage = (state: Partial<RootState>, path = "/chorprobe") =>
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <RehearsalPage />
    </MemoryRouter>,
    { preloadedState: state },
  )

describe("RehearsalPage (Chorprobe)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue(testSongs)
    vi.spyOn(peopleApi, "list").mockResolvedValue(testPeople)
    vi.spyOn(rehearsalsApi, "list").mockResolvedValue([
      summary({
        id: "r-old",
        date: "2026-09-10",
        warmUpLeader: { id: "p-daniel", name: "Daniel", archived: false },
        entryCount: 1,
        note: "Gemeindesaal",
      }),
      summary({ id: "r-empty", date: "2026-08-01" }),
    ])
  })

  it("lists past rehearsals and opens their songs", async () => {
    vi.spyOn(rehearsalsApi, "get").mockResolvedValue(
      detail({
        id: "r-old",
        date: "2026-09-10",
        entryCount: 1,
        entries: [
          {
            id: "e-1",
            songId: "s-42",
            song: {
              id: "s-42",
              number: "42",
              title: "Großer Gott",
              source: "LIBRARY",
              container: { id: "book-1", title: "Buch 1", type: "BOOK" },
              archived: false,
            },
            pianist: { id: "p-lorina", name: "Lorina", archived: false },
            conductor: null,
            note: null,
            createdAt: "2026-09-10T10:00:00.000Z",
          },
        ],
      }),
    )
    const { user } = renderPage(authState([]))

    const row = await screen.findByRole("row", { name: /10\.09\.2026/ })
    expect(within(row).getByText("Daniel")).toBeInTheDocument()
    expect(within(row).getByText("Gemeindesaal")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: /Lieder der Probe vom 10\.09\.2026 anzeigen/,
      }),
    )
    expect(await screen.findByText("Großer Gott")).toBeInTheDocument()
    expect(screen.getByText("Lorina")).toBeInTheDocument()
  })

  it("is read-only without SINGING_LOG_MANAGE", async () => {
    renderPage(authState([]))
    await screen.findByText("10.09.2026")

    expect(
      screen.queryByRole("button", { name: "Probe anlegen / fortsetzen" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /löschen/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /fortsetzen/ }),
    ).not.toBeInTheDocument()
  })

  it("offers deleting only empty rehearsals, after confirmation", async () => {
    const remove = vi
      .spyOn(rehearsalsApi, "remove")
      .mockResolvedValue(undefined)
    const { user } = renderPage(authState(["SINGING_LOG_MANAGE"]))

    await screen.findByText("10.09.2026")
    expect(
      screen.queryByRole("button", { name: /Probe vom 10\.09\.2026 löschen/ }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Probe vom 01\.08\.2026 löschen/ }),
    )
    await user.click(screen.getByRole("button", { name: "Löschen" }))
    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("comm-1", "r-empty")
    })
  })

  it("creates a rehearsal with warm-up leader and makes it active", async () => {
    const create = vi
      .spyOn(rehearsalsApi, "create")
      .mockResolvedValue(detail({ id: "r-new", date: "2026-10-08" }))
    vi.spyOn(rehearsalsApi, "get").mockResolvedValue(
      detail({
        id: "r-new",
        date: "2026-10-08",
        warmUpLeader: { id: "p-daniel", name: "Daniel", archived: false },
      }),
    )
    const { user } = renderPage(authState(["SINGING_LOG_MANAGE"]))
    await screen.findByText("10.09.2026")

    await waitFor(() => {
      const leaderOptions = within(screen.getByLabelText(/Einsingen/))
        .getAllByRole("option")
        .map(o => o.textContent)
      expect(leaderOptions).toEqual(["–", "Daniel", "Alex"])
    })

    await user.clear(screen.getByLabelText("Datum"))
    await user.type(screen.getByLabelText("Datum"), "2026-10-08")
    await user.selectOptions(screen.getByLabelText(/Einsingen/), "p-daniel")
    await user.click(
      screen.getByRole("button", { name: "Probe anlegen / fortsetzen" }),
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith("comm-1", {
        date: "2026-10-08",
        warmUpLeaderId: "p-daniel",
        note: null,
      })
    })
    expect(
      await screen.findByText(/Aktive Probe – 08\.10\.2026/),
    ).toBeInTheDocument()
  })

  it("continues the rehearsal of an existing date and updates warm-up and note", async () => {
    vi.spyOn(rehearsalsApi, "create").mockRejectedValue(
      new HttpError(409, "x", undefined, "REHEARSAL_DATE_TAKEN", {
        existingRehearsalId: "r-old",
      }),
    )
    const update = vi
      .spyOn(rehearsalsApi, "update")
      .mockResolvedValue(detail({ id: "r-old", date: "2026-09-10" }))
    vi.spyOn(rehearsalsApi, "get").mockResolvedValue(
      detail({ id: "r-old", date: "2026-09-10" }),
    )
    const { user } = renderPage(authState(["SINGING_LOG_MANAGE"]))
    await screen.findByText("10.09.2026")

    await user.clear(screen.getByLabelText("Datum"))
    await user.type(screen.getByLabelText("Datum"), "2026-09-10")
    await user.type(screen.getByLabelText(/Notiz zur Probe/), "neu")
    await user.click(
      screen.getByRole("button", { name: "Probe anlegen / fortsetzen" }),
    )

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith("comm-1", "r-old", {
        warmUpLeaderId: null,
        note: "neu",
      })
    })
    expect(await screen.findByText(/wird fortgesetzt/)).toBeInTheDocument()
    expect(
      await screen.findByText(/Aktive Probe – 10\.09\.2026/),
    ).toBeInTheDocument()
  })

  it("adds a song to the active rehearsal and removes it again", async () => {
    const entry = {
      id: "e-1",
      songId: "s-42",
      song: {
        id: "s-42",
        number: "42",
        title: "Großer Gott",
        source: "LIBRARY" as const,
        container: { id: "book-1", title: "Buch 1", type: "BOOK" as const },
        archived: false,
      },
      pianist: null,
      conductor: null,
      note: null,
      createdAt: "2026-10-08T10:00:00.000Z",
    }
    vi.spyOn(rehearsalsApi, "get").mockResolvedValue(
      detail({
        id: "r-old",
        date: "2026-09-10",
        entryCount: 1,
        entries: [entry],
      }),
    )
    const addEntry = vi
      .spyOn(rehearsalsApi, "addEntry")
      .mockResolvedValue(entry)
    const removeEntry = vi
      .spyOn(rehearsalsApi, "removeEntry")
      .mockResolvedValue(undefined)
    const { user } = renderPage(
      authState(["SINGING_LOG_MANAGE"]),
      "/chorprobe?probe=r-old",
    )

    expect(
      await screen.findByText(/Aktive Probe – 10\.09\.2026/),
    ).toBeInTheDocument()
    expect(await screen.findByText("Großer Gott")).toBeInTheDocument()

    await user.type(
      await screen.findByLabelText("Liednummer oder Titel"),
      "42{Enter}",
    )
    await user.click(
      screen.getByRole("button", { name: "Lied zur Probe hinzufügen" }),
    )
    await waitFor(() => {
      expect(addEntry).toHaveBeenCalledWith("comm-1", "r-old", {
        songId: "s-42",
        pianistId: null,
        conductorId: null,
        note: null,
      })
    })

    await user.click(
      screen.getByRole("button", { name: /Lied Großer Gott entfernen/ }),
    )
    await waitFor(() => {
      expect(removeEntry).toHaveBeenCalledWith("comm-1", "r-old", "e-1")
    })

    await user.click(screen.getByRole("button", { name: "Probe schließen" }))
    expect(screen.queryByText(/Aktive Probe/)).not.toBeInTheDocument()
  })

  it("explains the missing community", () => {
    renderPage(authState([], false))
    expect(screen.getByText(/noch keiner Chorgemeinschaft/)).toBeInTheDocument()
  })
})

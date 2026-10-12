import { screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import { peopleApi } from "../../people/api/peopleApi"
import { communitySongsApi } from "../../repertoire/api/communitySongsApi"
import { performancesApi } from "../api/performancesApi"
import type { PerformanceView } from "../types/singing-log.types"
import { PerformancePage } from "./PerformancePage"
import { authState, testPeople, testSongs } from "./singing-log-test-helpers"

const performance = (
  overrides: Partial<PerformanceView> & { id: string },
): PerformanceView => ({
  date: "2026-10-04",
  songId: "s-42",
  song: {
    id: "s-42",
    number: "42",
    title: "Großer Gott",
    source: "LIBRARY",
    container: { id: "book-1", title: "Buch 1", type: "BOOK" },
    archived: false,
  },
  pianist: null,
  conductor: null,
  note: null,
  createdAt: "2026-10-04T10:00:00.000Z",
  ...overrides,
})

describe("PerformancePage (Vortrag)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(communitySongsApi, "getSongs").mockResolvedValue(testSongs)
    vi.spyOn(peopleApi, "list").mockResolvedValue(testPeople)
    vi.spyOn(performancesApi, "list").mockResolvedValue([
      performance({
        id: "p-1",
        pianist: { id: "p-lorina", name: "Lorina", archived: false },
      }),
    ])
  })

  it("shows the latest entries (limit 8) with resolved names", async () => {
    renderWithProviders(<PerformancePage />, {
      preloadedState: authState([]),
    })

    expect(await screen.findByText("Großer Gott")).toBeInTheDocument()
    expect(performancesApi.list).toHaveBeenCalledWith("comm-1", { limit: 8 })
    const row = screen.getByRole("row", { name: /Großer Gott/ })
    expect(within(row).getByText("04.10.2026")).toBeInTheDocument()
    expect(within(row).getByText("Lorina")).toBeInTheDocument()
  })

  it("is read-only without SINGING_LOG_MANAGE", async () => {
    renderWithProviders(<PerformancePage />, {
      preloadedState: authState([]),
    })
    await screen.findByText("Großer Gott")

    expect(
      screen.queryByRole("button", { name: "Eintragen" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /löschen/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Berechtigung/)).toBeInTheDocument()
  })

  it("records a performance and offers only active people of the matching role", async () => {
    const record = vi
      .spyOn(performancesApi, "record")
      .mockResolvedValue(performance({ id: "p-new" }))
    const { user } = renderWithProviders(<PerformancePage />, {
      preloadedState: authState(["SINGING_LOG_MANAGE"]),
    })

    const submit = await screen.findByRole("button", { name: "Eintragen" })
    expect(submit).toBeDisabled()

    // Pianist select: pianists only, archived ones hidden.
    await waitFor(() => {
      const pianistOptions = within(screen.getByLabelText(/Klavierspieler/))
        .getAllByRole("option")
        .map(o => o.textContent)
      expect(pianistOptions).toEqual(["–", "Lorina", "Alex"])
    })
    const conductorOptions = within(screen.getByLabelText(/Dirigent/))
      .getAllByRole("option")
      .map(o => o.textContent)
    expect(conductorOptions).toEqual(["–", "Daniel", "Alex"])

    await user.type(await screen.findByLabelText("Liednummer oder Titel"), "42")
    await user.click(
      await screen.findByText(/Großer Gott/, { selector: "div, span, button" }),
    )
    await user.selectOptions(
      screen.getByLabelText(/Klavierspieler/),
      "p-lorina",
    )
    await user.type(screen.getByLabelText(/Notiz/), " Gottesdienst ")
    await user.click(screen.getByRole("button", { name: "Eintragen" }))

    await waitFor(() => {
      expect(record).toHaveBeenCalledWith("comm-1", {
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) as string,
        songId: "s-42",
        pianistId: "p-lorina",
        conductorId: null,
        note: "Gottesdienst",
      })
    })
    expect(
      await screen.findByText(/eingetragen: Großer Gott/),
    ).toBeInTheDocument()
    // The song and note are cleared for the next entry.
    expect(screen.getByLabelText(/Notiz/)).toHaveValue("")
    expect(screen.getByRole("button", { name: "Eintragen" })).toBeDisabled()
  })

  it("shows a German message when the server rejects the entry", async () => {
    vi.spyOn(performancesApi, "record").mockRejectedValue(
      new HttpError(400, "x", undefined, "SONG_NOT_FOUND"),
    )
    const { user } = renderWithProviders(<PerformancePage />, {
      preloadedState: authState(["SINGING_LOG_MANAGE"]),
    })

    await screen.findByRole("button", { name: "Eintragen" })
    await user.type(
      await screen.findByLabelText("Liednummer oder Titel"),
      "42{Enter}",
    )
    await user.click(screen.getByRole("button", { name: "Eintragen" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "nicht (mehr) verfügbar",
    )
  })

  it("deletes an entry after confirmation", async () => {
    const remove = vi
      .spyOn(performancesApi, "remove")
      .mockResolvedValue(undefined)
    const { user } = renderWithProviders(<PerformancePage />, {
      preloadedState: authState(["SINGING_LOG_MANAGE"]),
    })

    await user.click(
      await screen.findByRole("button", {
        name: /Eintrag Großer Gott .* löschen/,
      }),
    )
    expect(remove).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Löschen" }))

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith("comm-1", "p-1")
    })
  })

  it("explains the missing community", () => {
    renderWithProviders(<PerformancePage />, {
      preloadedState: authState([], false),
    })
    expect(screen.getByText(/noch keiner Chorgemeinschaft/)).toBeInTheDocument()
  })
})

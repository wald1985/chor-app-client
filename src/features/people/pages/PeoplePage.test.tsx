import { screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RootState } from "../../../app/store"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import { peopleApi } from "../api/peopleApi"
import type { PersonView } from "../types/people.types"
import { PeoplePage } from "./PeoplePage"

const makePerson = (
  overrides: Partial<PersonView> & { id: string },
): PersonView => ({
  name: "Name",
  roles: ["PIANIST"],
  archived: false,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const people: PersonView[] = [
  makePerson({ id: "p-daniel", name: "Daniel", roles: ["CONDUCTOR"] }),
  makePerson({ id: "p-alex", name: "alex", roles: ["PIANIST", "CONDUCTOR"] }),
  makePerson({
    id: "p-springer",
    name: "Springer",
    archived: true,
    archivedAt: "2026-02-01T00:00:00.000Z",
  }),
]

const authState = (
  permissions: ("PEOPLE_MANAGE" | "REPERTOIRE_MANAGE")[],
): Partial<RootState> => ({
  auth: {
    status: "authenticated",
    user: { id: "u1", email: "user@test.de", name: "Max" },
    memberships: [
      {
        communityId: "comm-1",
        communityName: "Chor Zion",
        role: "MEMBER",
        permissions,
      },
    ],
    remember: false,
  },
})

const renderPage = (permissions: ("PEOPLE_MANAGE" | "REPERTOIRE_MANAGE")[]) =>
  renderWithProviders(<PeoplePage />, {
    preloadedState: authState(permissions),
  })

describe("PeoplePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(peopleApi, "list").mockResolvedValue(people)
  })

  it("loads everything once, hides archived people and sorts by name", async () => {
    renderPage([])

    await screen.findByText("alex")
    expect(peopleApi.list).toHaveBeenCalledWith("comm-1", {
      includeArchived: true,
    })
    const rows = screen.getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText("alex")).toBeInTheDocument()
    expect(within(rows[0]).getByText("Klavierspieler")).toBeInTheDocument()
    expect(within(rows[0]).getByText("Dirigent")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Daniel")).toBeInTheDocument()
    expect(screen.queryByText("Springer")).not.toBeInTheDocument()
  })

  it("filters by role (dual-role people match both) and can show archived", async () => {
    const { user } = renderPage([])
    await screen.findByText("alex")

    await user.selectOptions(screen.getByLabelText("Rolle"), "PIANIST")
    expect(screen.getByText("alex")).toBeInTheDocument()
    expect(screen.queryByText("Daniel")).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("Rolle"), "")
    await user.click(screen.getByLabelText("Archivierte Personen anzeigen"))
    expect(screen.getByText("Springer")).toBeInTheDocument()
    expect(screen.getByText("Archiviert")).toBeInTheDocument()
  })

  it("is read-only without PEOPLE_MANAGE", async () => {
    renderPage([])
    await screen.findByText("alex")

    expect(
      screen.queryByRole("button", { name: "Person hinzufügen" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Aktionen")).not.toBeInTheDocument()
    expect(screen.getByText(/Berechtigung/)).toBeInTheDocument()
  })

  it("creates a person and shows confirmation", async () => {
    const create = vi
      .spyOn(peopleApi, "create")
      .mockResolvedValue(makePerson({ id: "p-new", name: "Lorina" }))
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("alex")

    await user.click(screen.getByRole("button", { name: "Person hinzufügen" }))
    await user.type(screen.getByLabelText("Name"), "Lorina")
    await user.click(screen.getByLabelText("Klavierspieler"))
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }))

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith("comm-1", {
        name: "Lorina",
        roles: ["PIANIST"],
      })
    })
    expect(
      await screen.findByText("«Lorina» wurde hinzugefügt."),
    ).toBeInTheDocument()
  })

  it("explains a name conflict with an archived person inside the form", async () => {
    vi.spyOn(peopleApi, "create").mockRejectedValue(
      new HttpError(409, "conflict", undefined, "PERSON_NAME_TAKEN", {
        existingArchived: true,
      }),
    )
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("alex")

    await user.click(screen.getByRole("button", { name: "Person hinzufügen" }))
    await user.type(screen.getByLabelText("Name"), "Springer")
    await user.click(screen.getByLabelText("Dirigent"))
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "existiert bereits im Archiv",
    )
  })

  it("restores the archived person that holds the name straight from the form", async () => {
    vi.spyOn(peopleApi, "create").mockRejectedValue(
      new HttpError(409, "conflict", undefined, "PERSON_NAME_TAKEN", {
        existingPersonId: "p-springer",
        existingArchived: true,
      }),
    )
    const restore = vi
      .spyOn(peopleApi, "restore")
      .mockResolvedValue(makePerson({ id: "p-springer", name: "Springer" }))
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("alex")

    await user.click(screen.getByRole("button", { name: "Person hinzufügen" }))
    await user.type(screen.getByLabelText("Name"), "Springer")
    await user.click(screen.getByLabelText("Dirigent"))
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }))

    await user.click(
      await screen.findByRole("button", {
        name: "Archivierte Person wiederherstellen",
      }),
    )

    await waitFor(() => {
      expect(restore).toHaveBeenCalledWith("comm-1", "p-springer")
    })
    expect(
      await screen.findByText("«Springer» wurde wiederhergestellt."),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument()
  })

  it("offers no restore button for a conflict with an active person", async () => {
    vi.spyOn(peopleApi, "create").mockRejectedValue(
      new HttpError(409, "conflict", undefined, "PERSON_NAME_TAKEN", {
        existingPersonId: "p-alex",
        existingArchived: false,
      }),
    )
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("alex")

    await user.click(screen.getByRole("button", { name: "Person hinzufügen" }))
    await user.type(screen.getByLabelText("Name"), "Alex")
    await user.click(screen.getByLabelText("Dirigent"))
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "existiert bereits.",
    )
    expect(
      screen.queryByRole("button", {
        name: "Archivierte Person wiederherstellen",
      }),
    ).not.toBeInTheDocument()
  })

  it("edits a person via PATCH", async () => {
    const update = vi
      .spyOn(peopleApi, "update")
      .mockResolvedValue(makePerson({ id: "p-daniel", name: "Daniel" }))
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("Daniel")

    await user.click(screen.getByRole("button", { name: "Daniel bearbeiten" }))
    await user.click(screen.getByLabelText("Klavierspieler"))
    await user.click(screen.getByRole("button", { name: "Speichern" }))

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith("comm-1", "p-daniel", {
        name: "Daniel",
        roles: ["CONDUCTOR", "PIANIST"],
      })
    })
  })

  it("archives an active person and restores an archived one", async () => {
    const archive = vi
      .spyOn(peopleApi, "archive")
      .mockResolvedValue(
        makePerson({ id: "p-daniel", name: "Daniel", archived: true }),
      )
    const restore = vi
      .spyOn(peopleApi, "restore")
      .mockResolvedValue(makePerson({ id: "p-springer", name: "Springer" }))
    const { user } = renderPage(["PEOPLE_MANAGE"])
    await screen.findByText("Daniel")

    await user.click(screen.getByRole("button", { name: "Daniel archivieren" }))
    await waitFor(() => {
      expect(archive).toHaveBeenCalledWith("comm-1", "p-daniel")
    })
    expect(
      await screen.findByText("«Daniel» wurde archiviert."),
    ).toBeInTheDocument()

    await user.click(screen.getByLabelText("Archivierte Personen anzeigen"))
    expect(
      screen.queryByRole("button", { name: "Springer bearbeiten" }),
    ).not.toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Springer wiederherstellen" }),
    )
    await waitFor(() => {
      expect(restore).toHaveBeenCalledWith("comm-1", "p-springer")
    })
  })

  it("shows an error when loading fails and a hint without a community", async () => {
    vi.spyOn(peopleApi, "list").mockRejectedValue(new Error("boom"))
    const failing = renderPage([])
    expect(await screen.findByText(/nicht geladen werden/)).toBeInTheDocument()
    failing.unmount()

    renderWithProviders(<PeoplePage />, {
      preloadedState: {
        auth: {
          status: "authenticated",
          user: { id: "u1", email: "user@test.de", name: "Max" },
          memberships: [],
          remember: false,
        },
      },
    })
    expect(screen.getByText(/noch keiner Chorgemeinschaft/)).toBeInTheDocument()
  })
})

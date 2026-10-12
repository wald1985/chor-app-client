import { screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RootState } from "../../../app/store"
import { HttpError } from "../../../lib/http/httpError"
import { renderWithProviders } from "../../../utils/test-utils"
import type { CommunityRole } from "../../auth/types"
import { membersApi } from "../api/membersApi"
import type { CommunityMemberView } from "../types/members.types"
import { MembersPage } from "./MembersPage"

const members: CommunityMemberView[] = [
  {
    membershipId: "m-lorina",
    userId: "u2",
    name: "Lorina",
    email: "lorina@test.de",
    role: "MEMBER",
    permissions: ["PEOPLE_MANAGE"],
  },
  {
    membershipId: "m-admin",
    userId: "u1",
    name: "Max Admin",
    email: "max@test.de",
    role: "ADMINISTRATOR",
    permissions: ["PEOPLE_MANAGE", "REPERTOIRE_MANAGE"],
  },
  {
    membershipId: "m-anna",
    userId: "u3",
    name: "Anna",
    email: "anna@test.de",
    role: "MEMBER",
    permissions: [],
  },
]

const renderPage = (
  role: CommunityRole = "ADMINISTRATOR",
  communityId = "comm-1",
) => {
  const preloadedState: Partial<RootState> = {
    auth: {
      status: "authenticated",
      user: { id: "u1", email: "max@test.de", name: "Max Admin" },
      memberships: [
        {
          communityId: "comm-1",
          communityName: "Chor Zion",
          role,
          permissions: [],
        },
      ],
      remember: false,
    },
  }
  return renderWithProviders(
    <MemoryRouter initialEntries={[`/communities/${communityId}/members`]}>
      <Routes>
        <Route
          path="/communities/:communityId/members"
          element={<MembersPage />}
        />
      </Routes>
    </MemoryRouter>,
    { preloadedState },
  )
}

describe("MembersPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(membersApi, "list").mockResolvedValue(members)
  })

  it("lists administrators first, then members by name, with their rights", async () => {
    renderPage()

    await screen.findByText("Lorina")
    const rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("Max Admin")).toBeInTheDocument()
    expect(within(rows[0]).getByText("Alle Berechtigungen")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Anna")).toBeInTheDocument()
    expect(within(rows[2]).getByText("Lorina")).toBeInTheDocument()

    expect(within(rows[2]).getByLabelText("Personen verwalten")).toBeChecked()
    expect(
      within(rows[2]).getByLabelText("Repertoire verwalten"),
    ).not.toBeChecked()
    expect(within(rows[0]).queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("grants a permission by sending the full new set", async () => {
    const setPermissions = vi
      .spyOn(membersApi, "setPermissions")
      .mockResolvedValue({
        membershipId: "m-lorina",
        permissions: ["PEOPLE_MANAGE", "REPERTOIRE_MANAGE"],
      })
    const { user } = renderPage()
    await screen.findByText("Lorina")

    const row = screen.getByRole("row", { name: /Lorina/ })
    await user.click(within(row).getByLabelText("Repertoire verwalten"))

    await waitFor(() => {
      expect(setPermissions).toHaveBeenCalledWith("comm-1", "m-lorina", [
        "PEOPLE_MANAGE",
        "REPERTOIRE_MANAGE",
      ])
    })
  })

  it("revokes a permission", async () => {
    const setPermissions = vi
      .spyOn(membersApi, "setPermissions")
      .mockResolvedValue({ membershipId: "m-lorina", permissions: [] })
    const { user } = renderPage()
    await screen.findByText("Lorina")

    const row = screen.getByRole("row", { name: /Lorina/ })
    await user.click(within(row).getByLabelText("Personen verwalten"))

    await waitFor(() => {
      expect(setPermissions).toHaveBeenCalledWith("comm-1", "m-lorina", [])
    })
  })

  it("shows a message when saving fails", async () => {
    vi.spyOn(membersApi, "setPermissions").mockRejectedValue(
      new HttpError(409, "conflict"),
    )
    const { user } = renderPage()
    await screen.findByText("Lorina")

    const row = screen.getByRole("row", { name: /Anna/ })
    await user.click(within(row).getByLabelText("Personen verwalten"))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Administrators können nicht geändert werden",
    )
  })

  it("is closed to non-administrators and does not load members", () => {
    const list = vi.spyOn(membersApi, "list")
    renderPage("MEMBER")

    expect(
      screen.getByText("Nur Administratoren können Berechtigungen verwalten."),
    ).toBeInTheDocument()
    expect(list).not.toHaveBeenCalled()
  })

  it("reports an unknown community", () => {
    const list = vi.spyOn(membersApi, "list")
    renderPage("ADMINISTRATOR", "other")

    expect(screen.getByText(/nicht gefunden/)).toBeInTheDocument()
    expect(list).not.toHaveBeenCalled()
  })

  it("hints that invitations are not available when only administrators exist", async () => {
    vi.spyOn(membersApi, "list").mockResolvedValue([members[1]])
    renderPage()

    expect(
      await screen.findByText(
        /Einladungen per E-Mail sind noch nicht verfügbar/,
      ),
    ).toBeInTheDocument()
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { membersApi } from "./membersApi"

describe("membersApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("list calls GET /communities/:id/members", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])
    await membersApi.list("comm-1")
    expect(getSpy).toHaveBeenCalledWith("/communities/comm-1/members")
  })

  it("setPermissions replaces the whole set via PUT", async () => {
    const putSpy = vi.spyOn(httpClient, "put").mockResolvedValue({})
    await membersApi.setPermissions("comm-1", "m-1", ["PEOPLE_MANAGE"])
    expect(putSpy).toHaveBeenCalledWith(
      "/communities/comm-1/members/m-1/permissions",
      { permissions: ["PEOPLE_MANAGE"] },
    )
  })
})

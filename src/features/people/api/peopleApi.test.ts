import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { peopleApi } from "./peopleApi"

describe("peopleApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("list calls GET /communities/:id/people with optional filters", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await peopleApi.list("comm-1")
    expect(getSpy).toHaveBeenLastCalledWith("/communities/comm-1/people")

    await peopleApi.list("comm-1", { role: "PIANIST", includeArchived: true })
    expect(getSpy).toHaveBeenLastCalledWith(
      "/communities/comm-1/people?role=PIANIST&includeArchived=true",
    )
  })

  it("create posts the payload", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({})
    await peopleApi.create("comm-1", { name: "Alex", roles: ["PIANIST"] })
    expect(postSpy).toHaveBeenCalledWith("/communities/comm-1/people", {
      name: "Alex",
      roles: ["PIANIST"],
    })
  })

  it("update patches the person", async () => {
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue({})
    await peopleApi.update("comm-1", "p-1", { roles: ["CONDUCTOR"] })
    expect(patchSpy).toHaveBeenCalledWith("/communities/comm-1/people/p-1", {
      roles: ["CONDUCTOR"],
    })
  })

  it("archive and restore post to the action endpoints", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({})
    await peopleApi.archive("comm-1", "p-1")
    expect(postSpy).toHaveBeenLastCalledWith(
      "/communities/comm-1/people/p-1/archive",
    )
    await peopleApi.restore("comm-1", "p-1")
    expect(postSpy).toHaveBeenLastCalledWith(
      "/communities/comm-1/people/p-1/restore",
    )
  })
})

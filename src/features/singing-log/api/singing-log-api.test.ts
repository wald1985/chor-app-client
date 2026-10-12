import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { performancesApi } from "./performancesApi"
import { rehearsalsApi } from "./rehearsalsApi"

describe("performancesApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("list sends optional range and limit", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])
    await performancesApi.list("comm-1")
    expect(getSpy).toHaveBeenLastCalledWith("/communities/comm-1/performances")

    await performancesApi.list("comm-1", {
      from: "2026-09-01",
      to: "2026-09-30",
      limit: 8,
    })
    expect(getSpy).toHaveBeenLastCalledWith(
      "/communities/comm-1/performances?from=2026-09-01&to=2026-09-30&limit=8",
    )
  })

  it("record posts and remove deletes", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({})
    const deleteSpy = vi
      .spyOn(httpClient, "delete")
      .mockResolvedValue(undefined)
    await performancesApi.record("comm-1", {
      date: "2026-10-04",
      songId: "s-1",
    })
    expect(postSpy).toHaveBeenCalledWith("/communities/comm-1/performances", {
      date: "2026-10-04",
      songId: "s-1",
    })
    await performancesApi.remove("comm-1", "p-1")
    expect(deleteSpy).toHaveBeenCalledWith(
      "/communities/comm-1/performances/p-1",
    )
  })
})

describe("rehearsalsApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("covers the rehearsal and entry endpoints", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue({})
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({})
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue({})
    const deleteSpy = vi
      .spyOn(httpClient, "delete")
      .mockResolvedValue(undefined)

    await rehearsalsApi.list("c")
    expect(getSpy).toHaveBeenLastCalledWith("/communities/c/rehearsals")
    await rehearsalsApi.get("c", "r")
    expect(getSpy).toHaveBeenLastCalledWith("/communities/c/rehearsals/r")

    await rehearsalsApi.create("c", { date: "2026-10-08" })
    expect(postSpy).toHaveBeenLastCalledWith("/communities/c/rehearsals", {
      date: "2026-10-08",
    })
    await rehearsalsApi.update("c", "r", { note: null })
    expect(patchSpy).toHaveBeenLastCalledWith("/communities/c/rehearsals/r", {
      note: null,
    })
    await rehearsalsApi.addEntry("c", "r", { songId: "s" })
    expect(postSpy).toHaveBeenLastCalledWith(
      "/communities/c/rehearsals/r/entries",
      { songId: "s" },
    )
    await rehearsalsApi.removeEntry("c", "r", "e")
    expect(deleteSpy).toHaveBeenLastCalledWith(
      "/communities/c/rehearsals/r/entries/e",
    )
    await rehearsalsApi.remove("c", "r")
    expect(deleteSpy).toHaveBeenLastCalledWith("/communities/c/rehearsals/r")
  })
})

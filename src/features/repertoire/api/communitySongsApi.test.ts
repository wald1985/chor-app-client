import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { communitySongsApi } from "./communitySongsApi"

describe("communitySongsApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("getSongs calls GET /communities/:communityId/songs", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await communitySongsApi.getSongs("comm-1")
    expect(getSpy).toHaveBeenCalledWith("/communities/comm-1/songs")
  })

  it("getSongs serializes filters as query parameters", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await communitySongsApi.getSongs("comm-1", {
      search: "Gott",
      themeIds: ["t1", "t2"],
      containerId: "c1",
    })
    expect(getSpy).toHaveBeenCalledWith(
      "/communities/comm-1/songs?search=Gott&themeIds=t1%2Ct2&containerId=c1",
    )
  })
})

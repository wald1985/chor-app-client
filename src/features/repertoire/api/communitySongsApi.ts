import { httpClient } from "../../../lib/http/client"
import type {
  CommunitySongsParams,
  CommunitySongView,
} from "../types/repertoire.types"

export const communitySongsApi = {
  getSongs: (
    communityId: string,
    params?: CommunitySongsParams,
  ): Promise<CommunitySongView[]> => {
    const query = new URLSearchParams()
    if (params?.search) query.set("search", params.search)
    if (params?.themeIds && params.themeIds.length > 0) {
      query.set("themeIds", params.themeIds.join(","))
    }
    if (params?.containerId) query.set("containerId", params.containerId)
    const qs = query.toString()

    return httpClient.get<CommunitySongView[]>(
      `/communities/${encodeURIComponent(communityId)}/songs${qs ? `?${qs}` : ""}`,
    )
  },
}

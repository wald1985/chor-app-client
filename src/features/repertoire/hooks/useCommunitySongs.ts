import { useQuery } from "@tanstack/react-query"
import { communitySongsApi } from "../api/communitySongsApi"
import type {
  CommunitySongsParams,
  CommunitySongView,
} from "../types/repertoire.types"

export const repertoireKeys = {
  all: (communityId: string) => ["repertoire", communityId] as const,
  songs: (communityId: string, params?: CommunitySongsParams) =>
    ["repertoire", communityId, "songs", params ?? {}] as const,
}

export const useCommunitySongs = (
  communityId: string,
  params?: CommunitySongsParams,
) => {
  return useQuery<CommunitySongView[]>({
    queryKey: repertoireKeys.songs(communityId, params),
    queryFn: () => communitySongsApi.getSongs(communityId, params),
    enabled: Boolean(communityId),
  })
}

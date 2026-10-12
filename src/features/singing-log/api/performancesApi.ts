import { httpClient } from "../../../lib/http/client"
import type {
  PerformanceView,
  RecordPerformanceInput,
} from "../types/singing-log.types"

const base = (communityId: string) =>
  `/communities/${encodeURIComponent(communityId)}/performances`

export type ListPerformancesParams = {
  from?: string
  to?: string
  limit?: number
}

export const performancesApi = {
  list: (
    communityId: string,
    params?: ListPerformancesParams,
  ): Promise<PerformanceView[]> => {
    const query = new URLSearchParams()
    if (params?.from) query.set("from", params.from)
    if (params?.to) query.set("to", params.to)
    if (params?.limit) query.set("limit", String(params.limit))
    const qs = query.toString()
    return httpClient.get<PerformanceView[]>(
      `${base(communityId)}${qs ? `?${qs}` : ""}`,
    )
  },

  record: (
    communityId: string,
    input: RecordPerformanceInput,
  ): Promise<PerformanceView> =>
    httpClient.post<PerformanceView>(base(communityId), input),

  remove: (communityId: string, performanceId: string): Promise<undefined> =>
    httpClient.delete<undefined>(
      `${base(communityId)}/${encodeURIComponent(performanceId)}`,
    ),
}

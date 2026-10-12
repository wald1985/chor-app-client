import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { performancesApi } from "../api/performancesApi"
import type { ListPerformancesParams } from "../api/performancesApi"
import type {
  PerformanceView,
  RecordPerformanceInput,
} from "../types/singing-log.types"

export const performanceKeys = {
  all: (communityId: string) => ["performances", communityId] as const,
  list: (communityId: string, params?: ListPerformancesParams) =>
    ["performances", communityId, "list", params ?? {}] as const,
}

export const usePerformances = (
  communityId: string,
  params?: ListPerformancesParams,
) => {
  return useQuery<PerformanceView[]>({
    queryKey: performanceKeys.list(communityId, params),
    queryFn: () => performancesApi.list(communityId, params),
    enabled: Boolean(communityId),
  })
}

export const useRecordPerformance = (communityId: string) => {
  const queryClient = useQueryClient()
  return useMutation<PerformanceView, Error, RecordPerformanceInput>({
    mutationFn: input => performancesApi.record(communityId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: performanceKeys.all(communityId),
      }),
  })
}

export const useDeletePerformance = (communityId: string) => {
  const queryClient = useQueryClient()
  return useMutation<undefined, Error, string>({
    mutationFn: id => performancesApi.remove(communityId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: performanceKeys.all(communityId),
      }),
  })
}

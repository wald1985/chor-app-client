import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rehearsalsApi } from "../api/rehearsalsApi"
import type {
  CreateRehearsalInput,
  RehearsalDetailView,
  RehearsalEntryView,
  RehearsalSummaryView,
  SungSongInput,
  UpdateRehearsalInput,
} from "../types/singing-log.types"

export const rehearsalKeys = {
  all: (communityId: string) => ["rehearsals", communityId] as const,
  list: (communityId: string) => ["rehearsals", communityId, "list"] as const,
  detail: (communityId: string, rehearsalId: string) =>
    ["rehearsals", communityId, "detail", rehearsalId] as const,
}

export const useRehearsals = (communityId: string) => {
  return useQuery<RehearsalSummaryView[]>({
    queryKey: rehearsalKeys.list(communityId),
    queryFn: () => rehearsalsApi.list(communityId),
    enabled: Boolean(communityId),
  })
}

export const useRehearsal = (communityId: string, rehearsalId: string) => {
  return useQuery<RehearsalDetailView>({
    queryKey: rehearsalKeys.detail(communityId, rehearsalId),
    queryFn: () => rehearsalsApi.get(communityId, rehearsalId),
    enabled: Boolean(communityId) && Boolean(rehearsalId),
  })
}

const useInvalidateRehearsals = (communityId: string) => {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: rehearsalKeys.all(communityId) })
}

export const useCreateRehearsal = (communityId: string) => {
  const invalidate = useInvalidateRehearsals(communityId)
  return useMutation<RehearsalDetailView, Error, CreateRehearsalInput>({
    mutationFn: input => rehearsalsApi.create(communityId, input),
    onSuccess: () => invalidate(),
  })
}

export const useUpdateRehearsal = (communityId: string) => {
  const invalidate = useInvalidateRehearsals(communityId)
  return useMutation<
    RehearsalDetailView,
    Error,
    { rehearsalId: string; input: UpdateRehearsalInput }
  >({
    mutationFn: ({ rehearsalId, input }) =>
      rehearsalsApi.update(communityId, rehearsalId, input),
    onSuccess: () => invalidate(),
  })
}

export const useDeleteRehearsal = (communityId: string) => {
  const invalidate = useInvalidateRehearsals(communityId)
  return useMutation<undefined, Error, string>({
    mutationFn: id => rehearsalsApi.remove(communityId, id),
    onSuccess: () => invalidate(),
  })
}

export const useAddRehearsalEntry = (communityId: string) => {
  const invalidate = useInvalidateRehearsals(communityId)
  return useMutation<
    RehearsalEntryView,
    Error,
    { rehearsalId: string; input: SungSongInput }
  >({
    mutationFn: ({ rehearsalId, input }) =>
      rehearsalsApi.addEntry(communityId, rehearsalId, input),
    onSuccess: () => invalidate(),
  })
}

export const useRemoveRehearsalEntry = (communityId: string) => {
  const invalidate = useInvalidateRehearsals(communityId)
  return useMutation<
    undefined,
    Error,
    { rehearsalId: string; entryId: string }
  >({
    mutationFn: ({ rehearsalId, entryId }) =>
      rehearsalsApi.removeEntry(communityId, rehearsalId, entryId),
    onSuccess: () => invalidate(),
  })
}

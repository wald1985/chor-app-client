import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { peopleApi } from "../api/peopleApi"
import type {
  CreatePersonInput,
  ListPeopleParams,
  PersonView,
  UpdatePersonInput,
} from "../types/people.types"

export const peopleKeys = {
  all: (communityId: string) => ["people", communityId] as const,
  list: (communityId: string, params?: ListPeopleParams) =>
    ["people", communityId, "list", params ?? {}] as const,
}

export const usePeople = (communityId: string, params?: ListPeopleParams) => {
  return useQuery<PersonView[]>({
    queryKey: peopleKeys.list(communityId, params),
    queryFn: () => peopleApi.list(communityId, params),
    enabled: Boolean(communityId),
  })
}

const useInvalidatePeople = (communityId: string) => {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: peopleKeys.all(communityId) })
}

export const useCreatePerson = (communityId: string) => {
  const invalidate = useInvalidatePeople(communityId)
  return useMutation<PersonView, Error, CreatePersonInput>({
    mutationFn: input => peopleApi.create(communityId, input),
    onSuccess: () => invalidate(),
  })
}

export const useUpdatePerson = (communityId: string) => {
  const invalidate = useInvalidatePeople(communityId)
  return useMutation<
    PersonView,
    Error,
    { personId: string; input: UpdatePersonInput }
  >({
    mutationFn: ({ personId, input }) =>
      peopleApi.update(communityId, personId, input),
    onSuccess: () => invalidate(),
  })
}

export const useArchivePerson = (communityId: string) => {
  const invalidate = useInvalidatePeople(communityId)
  return useMutation<PersonView, Error, string>({
    mutationFn: personId => peopleApi.archive(communityId, personId),
    onSuccess: () => invalidate(),
  })
}

export const useRestorePerson = (communityId: string) => {
  const invalidate = useInvalidatePeople(communityId)
  return useMutation<PersonView, Error, string>({
    mutationFn: personId => peopleApi.restore(communityId, personId),
    onSuccess: () => invalidate(),
  })
}

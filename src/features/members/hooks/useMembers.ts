import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CommunityPermission } from "../../auth/types"
import { membersApi } from "../api/membersApi"
import type {
  CommunityMemberView,
  SetMemberPermissionsResult,
} from "../types/members.types"

export const memberKeys = {
  list: (communityId: string) => ["members", communityId] as const,
}

export const useCommunityMembers = (communityId: string, enabled = true) => {
  return useQuery<CommunityMemberView[]>({
    queryKey: memberKeys.list(communityId),
    queryFn: () => membersApi.list(communityId),
    enabled: enabled && Boolean(communityId),
  })
}

export const useSetMemberPermissions = (communityId: string) => {
  const queryClient = useQueryClient()
  return useMutation<
    SetMemberPermissionsResult,
    Error,
    { membershipId: string; permissions: CommunityPermission[] }
  >({
    mutationFn: ({ membershipId, permissions }) =>
      membersApi.setPermissions(communityId, membershipId, permissions),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: memberKeys.list(communityId) }),
  })
}

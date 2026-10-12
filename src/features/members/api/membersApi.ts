import { httpClient } from "../../../lib/http/client"
import type { CommunityPermission } from "../../auth/types"
import type {
  CommunityMemberView,
  SetMemberPermissionsResult,
} from "../types/members.types"

const base = (communityId: string) =>
  `/communities/${encodeURIComponent(communityId)}/members`

export const membersApi = {
  list: (communityId: string): Promise<CommunityMemberView[]> =>
    httpClient.get<CommunityMemberView[]>(base(communityId)),

  /** Replaces the member's whole permission set. */
  setPermissions: (
    communityId: string,
    membershipId: string,
    permissions: CommunityPermission[],
  ): Promise<SetMemberPermissionsResult> =>
    httpClient.put<SetMemberPermissionsResult>(
      `${base(communityId)}/${encodeURIComponent(membershipId)}/permissions`,
      { permissions },
    ),
}

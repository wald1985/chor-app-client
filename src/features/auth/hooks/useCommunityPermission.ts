import { useAppSelector } from "../../../app/hooks"
import { selectAuthMemberships } from "../authSlice"
import type { CommunityPermission } from "../types"

/**
 * Whether the user holds `permission` in the given Community. Permissions are
 * already effective (administrators receive all of them from the server).
 * This only controls what the UI offers; the server enforces it.
 */
export const useCommunityPermission = (
  communityId: string,
  permission: CommunityPermission,
): boolean => {
  const memberships = useAppSelector(selectAuthMemberships)
  return memberships.some(
    m => m.communityId === communityId && m.permissions.includes(permission),
  )
}

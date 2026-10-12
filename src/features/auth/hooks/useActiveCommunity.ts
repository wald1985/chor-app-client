import { useAppSelector } from "../../../app/hooks"
import { selectAuthMemberships } from "../authSlice"
import type { CommunityMembership } from "../types"

/**
 * The Community the user currently works in. There is no switcher yet, so it
 * is the first membership returned by login/me.
 */
export const useActiveCommunity = (): CommunityMembership | null => {
  const memberships = useAppSelector(selectAuthMemberships)
  return memberships.length > 0 ? memberships[0] : null
}

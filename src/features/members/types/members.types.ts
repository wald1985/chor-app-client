import type { CommunityPermission, CommunityRole } from "../../auth/types"

export type CommunityMemberView = {
  membershipId: string
  userId: string
  name: string
  email: string
  role: CommunityRole
  /** Effective permissions: administrators hold all of them. */
  permissions: CommunityPermission[]
}

export type SetMemberPermissionsResult = {
  membershipId: string
  permissions: CommunityPermission[]
}

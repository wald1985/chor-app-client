export type CommunityRole = "ADMINISTRATOR" | "MEMBER"

/** Mirrors `chor-app-server`'s `CommunityPermission` enum. */
export type CommunityPermission = "PEOPLE_MANAGE" | "REPERTOIRE_MANAGE"

export type CommunityMembership = {
  communityId: string
  communityName: string
  role: CommunityRole
  /** Effective permissions: administrators get all of them from the server. */
  permissions: CommunityPermission[]
}

export type AuthUser = {
  id: string
  email: string
  name: string
}

export type AuthSession = {
  accessToken: string
  user: AuthUser
  memberships: CommunityMembership[]
}

export type RegisterInput = {
  communityName: string
  name: string
  email: string
  password: string
}

export type RegisterResult = {
  userId: string
  communityId: string
  communityName: string
  role: CommunityRole
}

export type LoginInput = {
  email: string
  password: string
  remember: boolean
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
  remember: boolean
}

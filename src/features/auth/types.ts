export type CommunityRole = "ADMINISTRATOR" | "MEMBER"

export type CommunityMembership = {
  communityId: string
  communityName: string
  role: CommunityRole
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

export type SuperadminView = {
  id: string
  email: string
  name: string
  isCurrent: boolean
  createdAt: string
  updatedAt: string
}

export type AdminLoginInput = {
  email: string
  password: string
  remember: boolean
}

export type AdminLoginResponse = {
  accessToken: string
  superadmin: SuperadminView
}

export type AdminChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type AdminUpdateProfileInput = {
  name?: string
  email?: string
}

export type CreateSuperadminInput = {
  name: string
  email: string
  password: string
}

export type UpdateSuperadminInput = {
  name?: string
  email?: string
}

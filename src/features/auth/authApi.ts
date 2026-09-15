import { httpClient } from "../../lib/http/client"
import type {
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  CommunityMembership,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
} from "./types"

type MeResponse = {
  user: AuthUser
  memberships: CommunityMembership[]
}

type ChangePasswordResponse = {
  accessToken: string
}

export const authApi = {
  register: (input: RegisterInput) =>
    httpClient.post<RegisterResult>("/auth/register", input),

  login: (input: LoginInput) =>
    httpClient.post<AuthSession>("/auth/login", {
      email: input.email,
      password: input.password,
    }),

  me: () => httpClient.get<MeResponse>("/auth/me"),

  changePassword: (input: ChangePasswordInput) =>
    httpClient.post<ChangePasswordResponse>("/auth/change-password", input),

  forgotPassword: (input: ForgotPasswordInput) =>
    httpClient.post<{ message: string }>("/auth/forgot-password", input),

  resetPassword: (input: ResetPasswordInput) =>
    httpClient.post<AuthSession>("/auth/reset-password", {
      token: input.token,
      newPassword: input.newPassword,
    }),
}

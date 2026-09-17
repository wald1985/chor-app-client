import { httpClient } from "../../lib/http/client"
import type {
  AdminChangePasswordInput,
  AdminLoginInput,
  AdminLoginResponse,
  AdminUpdateProfileInput,
  CreateSuperadminInput,
  SuperadminView,
  UpdateSuperadminInput,
} from "./types"

export const superadminApi = {
  login: (input: AdminLoginInput) =>
    httpClient.post<AdminLoginResponse>("/admin/auth/login", {
      email: input.email,
      password: input.password,
    }),

  me: () => httpClient.get<SuperadminView>("/admin/me"),

  updateMe: (input: AdminUpdateProfileInput) =>
    httpClient.patch<SuperadminView>("/admin/me", input),

  changePassword: (input: AdminChangePasswordInput) =>
    httpClient.post<{ accessToken: string }>(
      "/admin/me/change-password",
      input,
    ),

  listSuperadmins: () => httpClient.get<SuperadminView[]>("/admin/superadmins"),

  createSuperadmin: (input: CreateSuperadminInput) =>
    httpClient.post<SuperadminView>("/admin/superadmins", input),

  updateSuperadmin: (id: string, input: UpdateSuperadminInput) =>
    httpClient.patch<SuperadminView>(`/admin/superadmins/${id}`, input),

  deleteSuperadmin: (id: string) =>
    httpClient.delete<undefined>(`/admin/superadmins/${id}`),
}

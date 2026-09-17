import type { RootState } from "../../app/store"
import { createAppSlice } from "../../app/createAppSlice"
import { setAdminAuthToken } from "../../lib/http/client"
import { clearToken, loadToken, saveToken } from "../auth/tokenStorage"
import { superadminApi } from "./superadminApi"
import type {
  AdminChangePasswordInput,
  AdminLoginInput,
  AdminUpdateProfileInput,
  SuperadminView,
} from "./types"

type AdminAuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated"

type AdminAuthState = {
  status: AdminAuthStatus
  admin: SuperadminView | null
  remember: boolean
}

const initialState: AdminAuthState = {
  status: "idle",
  admin: null,
  remember: false,
}

export const adminAuthSlice = createAppSlice({
  name: "adminAuth",
  initialState,
  reducers: create => ({
    bootstrapAdmin: create.asyncThunk(
      async () => {
        const stored = loadToken("admin")
        if (!stored) return null

        setAdminAuthToken(stored.token)
        try {
          const admin = await superadminApi.me()
          return { admin, remember: stored.location === "local" }
        } catch (error) {
          clearToken("admin")
          setAdminAuthToken(null)
          throw error
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        fulfilled: (state, action) => {
          if (action.payload) {
            state.status = "authenticated"
            state.admin = action.payload.admin
            state.remember = action.payload.remember
          } else {
            state.status = "unauthenticated"
          }
        },
        rejected: state => {
          state.status = "unauthenticated"
        },
      },
    ),

    loginAdmin: create.asyncThunk(
      async (input: AdminLoginInput) => {
        const session = await superadminApi.login(input)
        saveToken(session.accessToken, input.remember, "admin")
        setAdminAuthToken(session.accessToken)
        return {
          admin: session.superadmin,
          remember: input.remember,
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        fulfilled: (state, action) => {
          state.status = "authenticated"
          state.admin = action.payload.admin
          state.remember = action.payload.remember
        },
        rejected: state => {
          state.status = "unauthenticated"
        },
      },
    ),

    changeAdminPassword: create.asyncThunk(
      async (input: AdminChangePasswordInput, { getState }) => {
        const { accessToken } = await superadminApi.changePassword(input)
        const { remember } = (getState() as RootState).adminAuth
        saveToken(accessToken, remember, "admin")
        setAdminAuthToken(accessToken)
      },
    ),

    updateAdminProfile: create.asyncThunk(
      async (input: AdminUpdateProfileInput) => {
        const updated = await superadminApi.updateMe(input)
        return updated
      },
      {
        fulfilled: (state, action) => {
          state.admin = action.payload
        },
      },
    ),

    logoutAdmin: create.asyncThunk(
      () => {
        clearToken("admin")
        setAdminAuthToken(null)
      },
      {
        fulfilled: state => {
          state.status = "unauthenticated"
          state.admin = null
          state.remember = false
        },
      },
    ),
  }),
  selectors: {
    selectAdminAuthStatus: state => state.status,
    selectCurrentAdmin: state => state.admin,
    selectIsAdminAuthenticated: state => state.status === "authenticated",
  },
})

export const {
  bootstrapAdmin,
  loginAdmin,
  changeAdminPassword,
  updateAdminProfile,
  logoutAdmin,
} = adminAuthSlice.actions

export const {
  selectAdminAuthStatus,
  selectCurrentAdmin,
  selectIsAdminAuthenticated,
} = adminAuthSlice.selectors

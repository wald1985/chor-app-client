import type { RootState } from "../../app/store"
import { createAppSlice } from "../../app/createAppSlice"
import { setAuthToken } from "../../lib/http/client"
import { authApi } from "./authApi"
import { clearToken, loadToken, saveToken } from "./tokenStorage"
import type {
  AuthUser,
  ChangePasswordInput,
  CommunityMembership,
  LoginInput,
  ResetPasswordInput,
} from "./types"

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated"

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  memberships: CommunityMembership[]
  /** Whether the current session's token is persisted in localStorage (survives closing the tab) rather than sessionStorage. */
  remember: boolean
}

const initialState: AuthState = {
  status: "idle",
  user: null,
  memberships: [],
  remember: false,
}

export const authSlice = createAppSlice({
  name: "auth",
  initialState,
  reducers: create => ({
    /** Runs once on app start: restores a session from storage, if any, and validates it against the server. */
    bootstrap: create.asyncThunk(
      async () => {
        const stored = loadToken()
        if (!stored) return null

        setAuthToken(stored.token)
        try {
          const { user, memberships } = await authApi.me()
          return { user, memberships, remember: stored.location === "local" }
        } catch (error) {
          clearToken()
          setAuthToken(null)
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
            state.user = action.payload.user
            state.memberships = action.payload.memberships
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

    login: create.asyncThunk(
      async (input: LoginInput) => {
        const session = await authApi.login(input)
        saveToken(session.accessToken, input.remember)
        setAuthToken(session.accessToken)
        return {
          user: session.user,
          memberships: session.memberships,
          remember: input.remember,
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        fulfilled: (state, action) => {
          state.status = "authenticated"
          state.user = action.payload.user
          state.memberships = action.payload.memberships
          state.remember = action.payload.remember
        },
        rejected: state => {
          state.status = "unauthenticated"
        },
      },
    ),

    /** Resetting a password also signs the User in, same as login. */
    resetPassword: create.asyncThunk(
      async (input: ResetPasswordInput) => {
        const session = await authApi.resetPassword(input)
        saveToken(session.accessToken, input.remember)
        setAuthToken(session.accessToken)
        return {
          user: session.user,
          memberships: session.memberships,
          remember: input.remember,
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        fulfilled: (state, action) => {
          state.status = "authenticated"
          state.user = action.payload.user
          state.memberships = action.payload.memberships
          state.remember = action.payload.remember
        },
        rejected: state => {
          state.status = "unauthenticated"
        },
      },
    ),

    /** The server returns a fresh token (the old one is invalidated) — persist it the same way the current session was. */
    changePassword: create.asyncThunk(
      async (input: ChangePasswordInput, { getState }) => {
        const { accessToken } = await authApi.changePassword(input)
        const { remember } = (getState() as RootState).auth
        saveToken(accessToken, remember)
        setAuthToken(accessToken)
      },
    ),

    logout: create.asyncThunk(
      () => {
        clearToken()
        setAuthToken(null)
      },
      {
        fulfilled: state => {
          state.status = "unauthenticated"
          state.user = null
          state.memberships = []
          state.remember = false
        },
      },
    ),
  }),
  selectors: {
    selectAuthStatus: state => state.status,
    selectAuthUser: state => state.user,
    selectAuthMemberships: state => state.memberships,
    selectIsAuthenticated: state => state.status === "authenticated",
  },
})

export const { bootstrap, login, resetPassword, changePassword, logout } =
  authSlice.actions

export const {
  selectAuthStatus,
  selectAuthUser,
  selectAuthMemberships,
  selectIsAuthenticated,
} = authSlice.selectors

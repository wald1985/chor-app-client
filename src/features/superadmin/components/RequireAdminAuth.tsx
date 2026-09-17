import type { PropsWithChildren } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAppSelector } from "../../../app/hooks"
import { LoadingScreen } from "../../auth/components/LoadingScreen"
import { selectAdminAuthStatus } from "../adminAuthSlice"

/** Redirects to /admin/login when there is no active superadmin session. */
export const RequireAdminAuth = ({ children }: PropsWithChildren) => {
  const status = useAppSelector(selectAdminAuthStatus)
  const location = useLocation()

  if (status === "idle" || status === "loading") {
    return <LoadingScreen />
  }

  if (status !== "authenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

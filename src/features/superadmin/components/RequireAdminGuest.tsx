import type { PropsWithChildren } from "react"
import { Navigate } from "react-router-dom"
import { useAppSelector } from "../../../app/hooks"
import { LoadingScreen } from "../../auth/components/LoadingScreen"
import { selectAdminAuthStatus } from "../adminAuthSlice"

/** Keeps an already authenticated superadmin off the admin login page. */
export const RequireAdminGuest = ({ children }: PropsWithChildren) => {
  const status = useAppSelector(selectAdminAuthStatus)

  if (status === "idle" || status === "loading") {
    return <LoadingScreen />
  }

  if (status === "authenticated") {
    return <Navigate to="/admin/superadmins" replace />
  }

  return children
}

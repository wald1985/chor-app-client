import type { PropsWithChildren } from "react"
import { Navigate } from "react-router-dom"
import { useAppSelector } from "../../../app/hooks"
import { selectAuthStatus } from "../authSlice"
import { LoadingScreen } from "./LoadingScreen"

/** Keeps an already-signed-in visitor off the login/register/forgot-password pages. */
export const RequireGuest = ({ children }: PropsWithChildren) => {
  const status = useAppSelector(selectAuthStatus)

  if (status === "idle" || status === "loading") {
    return <LoadingScreen />
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />
  }

  return children
}

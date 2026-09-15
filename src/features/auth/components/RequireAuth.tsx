import type { PropsWithChildren } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAppSelector } from "../../../app/hooks"
import { selectAuthStatus } from "../authSlice"
import { LoadingScreen } from "./LoadingScreen"

/** Redirects to /login when there's no active session; remembers where the visitor was headed. */
export const RequireAuth = ({ children }: PropsWithChildren) => {
  const status = useAppSelector(selectAuthStatus)
  const location = useLocation()

  if (status === "idle" || status === "loading") {
    return <LoadingScreen />
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

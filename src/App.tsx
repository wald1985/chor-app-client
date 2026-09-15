import { useEffect } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { useAppDispatch } from "./app/hooks"
import { RequireAuth } from "./features/auth/components/RequireAuth"
import { RequireGuest } from "./features/auth/components/RequireGuest"
import { ChangePasswordPage } from "./features/auth/pages/ChangePasswordPage"
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { RegisterPage } from "./features/auth/pages/RegisterPage"
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage"
import { bootstrap } from "./features/auth/authSlice"
import { HomePage } from "./pages/HomePage"

export const App = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(bootstrap())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RequireGuest>
              <ForgotPasswordPage />
            </RequireGuest>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RequireGuest>
              <ResetPasswordPage />
            </RequireGuest>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

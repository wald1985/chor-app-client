import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { useAppDispatch } from "./app/hooks"
import { AppLayout } from "./app/layout/AppLayout"
import { navItems } from "./app/layout/navItems"
import { RequireAuth } from "./features/auth/components/RequireAuth"
import { RequireGuest } from "./features/auth/components/RequireGuest"
import { ChangePasswordPage } from "./features/auth/pages/ChangePasswordPage"
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { RegisterPage } from "./features/auth/pages/RegisterPage"
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage"
import { bootstrap } from "./features/auth/authSlice"
import { bootstrapAdmin } from "./features/superadmin/adminAuthSlice"
import { AdminLayout } from "./features/superadmin/components/AdminLayout"
import { RequireAdminAuth } from "./features/superadmin/components/RequireAdminAuth"
import { RequireAdminGuest } from "./features/superadmin/components/RequireAdminGuest"
import { AdminLoginPage } from "./features/superadmin/pages/AdminLoginPage"
import { AdminProfilePage } from "./features/superadmin/pages/AdminProfilePage"
import { SuperadminsListPage } from "./features/superadmin/pages/SuperadminsListPage"
import { AdminBooksPage } from "./features/catalog/pages/admin/AdminBooksPage"
import { AdminBookDetailPage } from "./features/catalog/pages/admin/AdminBookDetailPage"
import { AdminImportPage } from "./features/catalog/pages/admin/AdminImportPage"
import { AdminThemesPage } from "./features/catalog/pages/admin/AdminThemesPage"
import { CatalogBrowserPage } from "./features/catalog/pages/public/CatalogBrowserPage"
import { RepertoireSettingsPage } from "./features/catalog/pages/community/RepertoireSettingsPage"
import { AccountPage } from "./pages/AccountPage"
import { PlaceholderPage } from "./pages/PlaceholderPage"

export const App = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(bootstrap())
    void dispatch(bootstrapAdmin())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Default landing tab, matching the prototype's initially active "Vortrag" tab. */}
          <Route index element={<Navigate to="vortrag" replace />} />
          {navItems.map(item => {
            if (item.path === "themensuche") {
              return (
                <Route
                  key={item.path}
                  path={item.path}
                  element={<CatalogBrowserPage defaultMode="themes" />}
                />
              )
            }
            if (item.path === "lieder") {
              return (
                <Route
                  key={item.path}
                  path={item.path}
                  element={<CatalogBrowserPage defaultMode="songs" />}
                />
              )
            }
            return (
              <Route
                key={item.path}
                path={item.path}
                element={
                  <PlaceholderPage
                    title={item.label}
                    description={item.description}
                  />
                }
              />
            )
          })}
          <Route path="konto" element={<AccountPage />} />
          <Route
            path="communities/:communityId/repertoire"
            element={<RepertoireSettingsPage />}
          />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
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

        {/* Superadmin routes */}
        <Route
          path="/admin/login"
          element={
            <RequireAdminGuest>
              <AdminLoginPage />
            </RequireAdminGuest>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<Navigate to="superadmins" replace />} />
          <Route path="superadmins" element={<SuperadminsListPage />} />
          <Route path="me" element={<AdminProfilePage />} />
          <Route path="library" element={<Navigate to="books" replace />} />
          <Route path="library/books" element={<AdminBooksPage />} />
          <Route
            path="library/books/:bookId"
            element={<AdminBookDetailPage />}
          />
          <Route path="library/themes" element={<AdminThemesPage />} />
          <Route path="library/import" element={<AdminImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

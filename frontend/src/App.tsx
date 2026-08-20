import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { ROLES } from "@/lib/rbac"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { LogoutConfirmPage } from "@/pages/auth/LogoutConfirmPage"
import { SignInConfirmPage } from "@/pages/auth/SignInConfirmPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminIncidentDetailPage } from "@/pages/admin/AdminIncidentDetailPage"
import { AdminIncidentsPage } from "@/pages/admin/AdminIncidentsPage"
import { ComingSoonPage } from "@/pages/public/ComingSoonPage"
import { LandingPage } from "@/pages/public/LandingPage"
import { SupportPage, TermsPage } from "@/pages/public/LegalPages"
import { AccountPage } from "@/pages/user/AccountPage"
import { DashboardPage } from "@/pages/user/DashboardPage"
import { MapPage } from "@/pages/user/MapPage"
import { ReportsPage } from "@/pages/user/ReportsPage"
import { SearchPage } from "@/pages/user/SearchPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signin/confirm" element={<SignInConfirmPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/logout" element={<LogoutConfirmPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />

        {/* Citizen (USER + ADMIN may browse; data scoped in pages) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminIncidentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents/:id"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminIncidentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

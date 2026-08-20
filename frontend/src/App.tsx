import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { ROLES } from "@/lib/rbac"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { LogoutConfirmPage } from "@/pages/auth/LogoutConfirmPage"
import { SignInConfirmPage } from "@/pages/auth/SignInConfirmPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage"
import { AdminDepartmentsPage } from "@/pages/admin/AdminDepartmentsPage"
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminAuditLogPage } from "@/pages/admin/AdminAuditLogPage"
import { AdminIncidentCreatePage } from "@/pages/admin/AdminIncidentCreatePage"
import { AdminIncidentDetailPage } from "@/pages/admin/AdminIncidentDetailPage"
import { AdminIncidentEditPage } from "@/pages/admin/AdminIncidentEditPage"
import { AdminIncidentReviewPage } from "@/pages/admin/AdminIncidentReviewPage"
import { AdminIncidentsPage } from "@/pages/admin/AdminIncidentsPage"
import { AdminMapPage } from "@/pages/admin/AdminMapPage"
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage"
import { ComingSoonPage } from "@/pages/public/ComingSoonPage"
import { LandingPage } from "@/pages/public/LandingPage"
import { PrivacyPage, SupportPage, TermsPage } from "@/pages/public/LegalPages"
import { AccountPage } from "@/pages/user/AccountPage"
import { DashboardPage } from "@/pages/user/DashboardPage"
import { IncidentDetailPage } from "@/pages/user/IncidentDetailPage"
import { MapPage } from "@/pages/user/MapPage"
import { ReportIncidentPage } from "@/pages/user/ReportIncidentPage"
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
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />

        {/* Citizen */}
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
          path="/reports/:id"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <IncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute roles={[ROLES.USER, ROLES.ADMIN]}>
              <ReportIncidentPage />
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
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminAnalyticsPage />
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
          path="/admin/incidents/new"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminIncidentCreatePage />
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
        <Route
          path="/admin/incidents/:id/edit"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminIncidentEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidents/:id/review"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminIncidentReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/map"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminDepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminNotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <AdminAuditLogPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { IncidentsListPage } from "@/pages/incidents/incident-list"
import { NewIncidentPage } from "@/pages/incidents/new-incident"
import { IncidentDetailPage } from "@/pages/incidents/incident-detail"
import { EditIncidentPage } from "@/pages/incidents/edit-incident"
import { RequireSession } from "@/components/auth/require-session"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { LogoutConfirmPage } from "@/pages/auth/LogoutConfirmPage"
import { SignInConfirmPage } from "@/pages/auth/SignInConfirmPage"
import { SignInPage } from "@/pages/auth/SignInPage"
import { SignUpPage } from "@/pages/auth/SignUpPage"
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signin/confirm" element={<SignInConfirmPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/logout" element={<LogoutConfirmPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireSession>
              <DashboardPage />
            </RequireSession>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireSession>
              <ReportsPage />
            </RequireSession>
          }
        />
        <Route
          path="/map"
          element={
            <RequireSession>
              <MapPage />
            </RequireSession>
          }
        />
        <Route
          path="/search"
          element={
            <RequireSession>
              <SearchPage />
            </RequireSession>
          }
        />
        <Route
          path="/account"
          element={
            <RequireSession>
              <AccountPage />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/incidents" element={<RequireSession><IncidentsListPage /></RequireSession>} />
        <Route path="/incidents/new" element={<RequireSession><NewIncidentPage /></RequireSession>} />
        <Route path="/incidents/:id" element={<RequireSession><IncidentDetailPage /></RequireSession>} />
        <Route path="/incidents/:id/edit" element={<RequireSession><EditIncidentPage /></RequireSession>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
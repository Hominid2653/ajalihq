import { Navigate, Route, Routes } from "react-router-dom"

import { IncidentsListPage } from "@/pages/incidents/incident-list"
import { NewIncidentPage } from "@/pages/incidents/new-incident"
import { IncidentDetailPage } from "@/pages/incidents/incident-detail"
import { EditIncidentPage } from "@/pages/incidents/edit-incident"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/incidents" replace />} />
      <Route path="/incidents" element={<IncidentsListPage />} />
      <Route path="/incidents/new" element={<NewIncidentPage />} />
      <Route path="/incidents/:id" element={<IncidentDetailPage />} />
      <Route path="/incidents/:id/edit" element={<EditIncidentPage />} />
    </Routes>
  )
}

export default App
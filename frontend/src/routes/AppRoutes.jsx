import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import BudgetsPage from "../pages/BudgetsPage";
import CheckInPage from "../pages/CheckInPage";
import DashboardPage from "../pages/DashboardPage";
import EventDetailPage from "../pages/EventDetailPage";
import EventsPage from "../pages/EventsPage";
import LoginPage from "../pages/LoginPage";
import MyRegistrationsPage from "../pages/MyRegistrationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import RegisterPage from "../pages/RegisterPage";
import RegistrationsPage from "../pages/RegistrationsPage";
import StudentsPage from "../pages/StudentsPage";
import VolunteersPage from "../pages/VolunteersPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />

          {/* Student only */}
          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route path="/my-registrations" element={<MyRegistrationsPage />} />
          </Route>

          {/* Admin + volunteer */}
          <Route element={<ProtectedRoute roles={["admin", "volunteer"]} />}>
            <Route path="/registrations" element={<RegistrationsPage />} />
            <Route path="/check-in" element={<CheckInPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/volunteers" element={<VolunteersPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

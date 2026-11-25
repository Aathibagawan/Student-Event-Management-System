import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader } from "../components/Feedback";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

// Lazy loading: each page becomes its own JS file, downloaded only when the user opens it.
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const EventsPage = lazy(() => import("../pages/EventsPage"));
const EventDetailPage = lazy(() => import("../pages/EventDetailPage"));
const MyRegistrationsPage = lazy(() => import("../pages/MyRegistrationsPage"));
const RegistrationsPage = lazy(() => import("../pages/RegistrationsPage"));
const CheckInPage = lazy(() => import("../pages/CheckInPage"));
const StudentsPage = lazy(() => import("../pages/StudentsPage"));
const VolunteersPage = lazy(() => import("../pages/VolunteersPage"));
const BudgetsPage = lazy(() => import("../pages/BudgetsPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
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
    </Suspense>
  );
}

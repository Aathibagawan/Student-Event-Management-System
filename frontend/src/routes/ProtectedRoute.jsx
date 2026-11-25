import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap routes that need login. Pass `roles` to restrict by role.
 * NOTE: this only controls what React shows. The real security is on the Django API.
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Checking session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

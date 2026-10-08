import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Please enter your email and password.");
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? "Invalid email or password." : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>ACE Events</h1>
        <p className="muted">Event &amp; Symposium Management Platform</p>
        <ErrorMessage message={error} />
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="username" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in..." : "Login"}
        </button>
        <p className="muted center">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

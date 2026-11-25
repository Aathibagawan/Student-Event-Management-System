import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { ErrorMessage } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";
import { validateLogin } from "../utils/validators";

const DEMO = [
  ["Admin", "admin@ace.local"],
  ["Volunteer", "volunteer1@ace.local"],
  ["Student", "student1@ace.local"],
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length) return;
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 p-4">
      <form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-xl" onSubmit={handleSubmit} noValidate>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">🎓 ACE Events</h1>
          <p className="text-sm text-slate-500">Event &amp; Symposium Management Platform</p>
        </div>
        <ErrorMessage message={error} />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="username" />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="current-password" />
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
        <p className="text-center text-sm text-slate-500">
          New student? <Link className="font-medium text-indigo-600 hover:underline" to="/register">Create an account</Link>
        </p>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1 font-medium text-slate-600">Demo accounts (password: Demo@12345)</p>
          {DEMO.map(([role, email]) => (
            <button key={role} type="button" className="mr-2 mt-1 rounded border border-slate-200 bg-white px-2 py-1 hover:bg-slate-100"
              onClick={() => setForm({ email, password: "Demo@12345" })}>{role}</button>
          ))}
        </div>
      </form>
    </div>
  );
}

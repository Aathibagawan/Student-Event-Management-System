import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/Feedback";
import { authService } from "../services/endpoints";
import { getErrorMessage } from "../utils/format";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", roll_number: "", department: "", year: "", phone: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Frontend validation = better UX only. The backend validates again.
    if (!form.first_name.trim()) return setError("First name is required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      const payload = { ...form, year: form.year ? Number(form.year) : null };
      await authService.register(payload);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card wide" onSubmit={handleSubmit} noValidate>
        <h1>Student Sign Up</h1>
        <ErrorMessage message={error} />
        <div className="grid-2">
          <label>First name<input name="first_name" value={form.first_name} onChange={handleChange} /></label>
          <label>Last name<input name="last_name" value={form.last_name} onChange={handleChange} /></label>
        </div>
        <label>Email<input name="email" type="email" value={form.email} onChange={handleChange} /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" /></label>
        <div className="grid-2">
          <label>Roll number<input name="roll_number" value={form.roll_number} onChange={handleChange} /></label>
          <label>Department<input name="department" value={form.department} onChange={handleChange} /></label>
          <label>Year<input name="year" type="number" min="1" max="6" value={form.year} onChange={handleChange} /></label>
          <label>Phone<input name="phone" value={form.phone} onChange={handleChange} /></label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        <p className="muted center">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

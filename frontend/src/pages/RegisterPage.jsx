import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { ErrorMessage } from "../components/Feedback";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/endpoints";
import { getErrorMessage, getFieldErrors } from "../utils/format";
import { validateRegister } from "../utils/validators";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", roll_number: "", department: "", year: "", phone: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await authService.register({ ...form, year: form.year ? Number(form.year) : null });
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      setErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const f = (name, label, props = {}) => (
    <FormField label={label} name={name} value={form[name]} onChange={handleChange} error={errors[name]} {...props} />
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 p-4">
      <form className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-8 shadow-xl" onSubmit={handleSubmit} noValidate>
        <h1 className="text-center text-2xl font-bold text-slate-900">Student Sign Up</h1>
        <ErrorMessage message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          {f("first_name", "First name")}
          {f("last_name", "Last name")}
        </div>
        {f("email", "Email", { type: "email" })}
        {f("password", "Password", { type: "password", autoComplete: "new-password" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {f("roll_number", "Roll number")}
          {f("department", "Department")}
          {f("year", "Year", { type: "number", min: 1, max: 6 })}
          {f("phone", "Phone")}
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link className="font-medium text-indigo-600 hover:underline" to="/login">Login</Link></p>
      </form>
    </div>
  );
}

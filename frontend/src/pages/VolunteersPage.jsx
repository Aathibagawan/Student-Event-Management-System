import { useState } from "react";
import FormField from "../components/FormField";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";
import useFetch from "../hooks/useFetch";
import { userService } from "../services/endpoints";
import { getErrorMessage, getFieldErrors } from "../utils/format";
import { validateVolunteer } from "../utils/validators";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", department: "", phone: "" };

export default function VolunteersPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => userService.volunteers(), []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = validateVolunteer(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await userService.createVolunteer(form);
      toast.success("Volunteer created.");
      setShowForm(false);
      setForm(EMPTY);
      reload();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const f = (name, label, props = {}) => (
    <FormField label={label} name={name} value={form[name]} onChange={handleChange} error={errors[name]} {...props} />
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Volunteers</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Volunteer</button>
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && <Loader />}
      {!loading && data?.length === 0 && <EmptyState title="No volunteers yet" text="Add a volunteer, then assign them to events from the event page." />}
      {data?.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Department</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{v.full_name}</td>
                  <td className="td">{v.email}</td>
                  <td className="td">{v.department || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title="Add Volunteer" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <ErrorMessage message={formError} />
            <div className="grid gap-4 sm:grid-cols-2">
              {f("first_name", "First name")}
              {f("last_name", "Last name")}
            </div>
            {f("email", "Email", { type: "email" })}
            {f("password", "Temporary password", { type: "password", autoComplete: "new-password" })}
            <div className="grid gap-4 sm:grid-cols-2">
              {f("department", "Department")}
              {f("phone", "Phone")}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Create volunteer"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

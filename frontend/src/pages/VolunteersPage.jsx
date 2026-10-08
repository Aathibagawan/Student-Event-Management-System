import { useState } from "react";
import { EmptyState, ErrorMessage, Loader } from "../components/Feedback";
import Modal from "../components/Modal";
import useFetch from "../hooks/useFetch";
import { userService } from "../services/endpoints";
import { getErrorMessage } from "../utils/format";

const EMPTY = { first_name: "", last_name: "", email: "", password: "", department: "", phone: "" };

export default function VolunteersPage() {
  const { data, loading, error, reload } = useFetch(() => userService.volunteers(), []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.first_name.trim() || !form.email.trim() || form.password.length < 8) {
      return setFormError("First name, email and a password of at least 8 characters are required.");
    }
    setBusy(true);
    try {
      await userService.createVolunteer(form);
      setShowForm(false);
      setForm(EMPTY);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Volunteers</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Volunteer</button>
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && <Loader />}
      {!loading && data?.length === 0 && <EmptyState title="No volunteers yet" text="Add a volunteer, then assign them to events from the event page." />}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th></tr></thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id}>
                  <td data-label="Name">{v.full_name}</td>
                  <td data-label="Email">{v.email}</td>
                  <td data-label="Department">{v.department || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title="Add Volunteer" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} noValidate>
            <ErrorMessage message={formError} />
            <div className="grid-2">
              <label>First name<input name="first_name" value={form.first_name} onChange={handleChange} /></label>
              <label>Last name<input name="last_name" value={form.last_name} onChange={handleChange} /></label>
            </div>
            <label>Email<input name="email" type="email" value={form.email} onChange={handleChange} /></label>
            <label>Temporary password<input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" /></label>
            <div className="grid-2">
              <label>Department<input name="department" value={form.department} onChange={handleChange} /></label>
              <label>Phone<input name="phone" value={form.phone} onChange={handleChange} /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Create volunteer"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

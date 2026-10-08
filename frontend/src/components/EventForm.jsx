import { useState } from "react";
import { ErrorMessage } from "./Feedback";
import { eventService } from "../services/endpoints";
import { getErrorMessage } from "../utils/format";

export const EVENT_TYPES = ["Symposium", "Workshop", "Hackathon", "Technical Event", "Non-Technical Event", "Seminar", "Cultural Event"];
export const EVENT_STATUSES = ["Upcoming", "Registration Open", "Registration Closed", "Completed", "Cancelled"];

// "2026-11-05T10:30:00+05:30" -> "2026-11-05T10:30" for <input type="datetime-local">
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EventForm({ event, onSaved, onCancel }) {
  const editing = Boolean(event);
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "Workshop",
    date: event?.date || "",
    start_time: event?.start_time?.slice(0, 5) || "10:00",
    end_time: event?.end_time?.slice(0, 5) || "12:00",
    venue: event?.venue || "",
    registration_deadline: toLocalInput(event?.registration_deadline),
    max_participants: event?.max_participants || 50,
    registration_fee: event?.registration_fee || 0,
    status: event?.status || "Upcoming",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.date || !form.venue.trim() || !form.registration_deadline) {
      return setError("Title, date, venue and registration deadline are required.");
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        max_participants: Number(form.max_participants),
        registration_fee: form.registration_fee || 0,
        registration_deadline: new Date(form.registration_deadline).toISOString(),
      };
      const saved = editing ? await eventService.update(event.id, payload) : await eventService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={error} />
      <label>Title<input name="title" value={form.title} onChange={handleChange} /></label>
      <label>Description<textarea name="description" rows="3" value={form.description} onChange={handleChange} /></label>
      <div className="grid-2">
        <label>Type
          <select name="event_type" value={form.event_type} onChange={handleChange}>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Status
          <select name="status" value={form.status} onChange={handleChange}>
            {EVENT_STATUSES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Date<input name="date" type="date" value={form.date} onChange={handleChange} /></label>
        <label>Venue<input name="venue" value={form.venue} onChange={handleChange} /></label>
        <label>Start time<input name="start_time" type="time" value={form.start_time} onChange={handleChange} /></label>
        <label>End time<input name="end_time" type="time" value={form.end_time} onChange={handleChange} /></label>
        <label>Registration deadline<input name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={handleChange} /></label>
        <label>Max participants<input name="max_participants" type="number" min="1" value={form.max_participants} onChange={handleChange} /></label>
        <label>Registration fee (₹)<input name="registration_fee" type="number" min="0" step="0.01" value={form.registration_fee} onChange={handleChange} /></label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Create event"}</button>
      </div>
    </form>
  );
}

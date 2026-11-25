import { useMemo, useState } from "react";
import FormField from "./FormField";
import { ErrorMessage } from "./Feedback";
import { useToast } from "../context/ToastContext";
import { eventService } from "../services/endpoints";
import { getErrorMessage, getFieldErrors } from "../utils/format";
import { validateEvent, validatePoster } from "../utils/validators";

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
  const toast = useToast();
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
  const [poster, setPoster] = useState(null); // File chosen by the user
  const [removePoster, setRemovePoster] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Preview of the chosen file (or the existing poster) - recalculated only when they change.
  const preview = useMemo(() => {
    if (poster) return URL.createObjectURL(poster);
    return removePoster ? "" : event?.poster || "";
  }, [poster, removePoster, event]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files[0] || null;
    const problem = validatePoster(file);
    setErrors((prev) => ({ ...prev, poster: problem }));
    setPoster(problem ? null : file);
    setRemovePoster(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = validateEvent(form, poster);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const payload = {
        ...form,
        registration_fee: form.registration_fee || 0,
        registration_deadline: new Date(form.registration_deadline).toISOString(),
      };
      if (poster) payload.poster = poster;
      if (removePoster) payload.remove_poster = true;
      const saved = editing ? await eventService.update(event.id, payload) : await eventService.create(payload);
      toast.success(editing ? "Event updated." : "Event created.");
      onSaved(saved);
    } catch (err) {
      setErrors(getFieldErrors(err)); // show server-side errors under the matching field
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <FormField label={label} name={name} value={form[name]} onChange={handleChange} error={errors[name]} {...props} />
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={formError} />
      {field("title", "Title")}
      {field("description", "Description", { as: "textarea", rows: 3 })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("event_type", "Type", { as: "select", children: EVENT_TYPES.map((t) => <option key={t}>{t}</option>) })}
        {field("status", "Status", { as: "select", children: EVENT_STATUSES.map((t) => <option key={t}>{t}</option>) })}
        {field("date", "Date", { type: "date" })}
        {field("venue", "Venue")}
        {field("start_time", "Start time", { type: "time" })}
        {field("end_time", "End time", { type: "time" })}
        {field("registration_deadline", "Registration deadline", { type: "datetime-local" })}
        {field("max_participants", "Max participants", { type: "number", min: 1 })}
        {field("registration_fee", "Registration fee (₹)", { type: "number", min: 0, step: "0.01" })}
      </div>

      <div>
        <label className="label" htmlFor="poster">Poster (JPG / PNG / WEBP, max 2 MB)</label>
        <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
        {errors.poster && <p className="field-error" role="alert">{errors.poster}</p>}
        {preview && (
          <div className="mt-3 flex items-center gap-3">
            <img src={preview} alt="Poster preview" className="h-24 w-40 rounded-lg border border-slate-200 object-cover" />
            {editing && event?.poster && !poster && (
              <button type="button" className="btn btn-sm" onClick={() => setRemovePoster(true)}>Remove poster</button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Create event"}</button>
      </div>
    </form>
  );
}

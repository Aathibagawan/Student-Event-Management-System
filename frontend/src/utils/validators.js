// Client-side validation = better UX only. The Django API validates everything again.
export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || "");
const blank = (v) => !String(v ?? "").trim();

export function validateLogin(f) {
  const e = {};
  if (blank(f.email)) e.email = "Email is required.";
  else if (!isEmail(f.email)) e.email = "Enter a valid email address.";
  if (!f.password) e.password = "Password is required.";
  return e;
}

export function validateRegister(f) {
  const e = {};
  if (blank(f.first_name)) e.first_name = "First name is required.";
  if (blank(f.email)) e.email = "Email is required.";
  else if (!isEmail(f.email)) e.email = "Enter a valid email address.";
  if (!f.password) e.password = "Password is required.";
  else if (f.password.length < 8) e.password = "Password must be at least 8 characters.";
  if (f.year && (Number(f.year) < 1 || Number(f.year) > 6)) e.year = "Year must be between 1 and 6.";
  if (f.phone && !/^[0-9+\-\s]{7,15}$/.test(f.phone)) e.phone = "Enter a valid phone number.";
  return e;
}

export const MAX_POSTER_MB = 2;
export const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePoster(file) {
  if (!file) return "";
  if (!POSTER_TYPES.includes(file.type)) return "Poster must be a JPG, PNG or WEBP image.";
  if (file.size > MAX_POSTER_MB * 1024 * 1024) return `Poster must be smaller than ${MAX_POSTER_MB} MB.`;
  return "";
}

export function validateEvent(f, poster) {
  const e = {};
  if (blank(f.title)) e.title = "Title is required.";
  if (!f.date) e.date = "Date is required.";
  if (blank(f.venue)) e.venue = "Venue is required.";
  if (!f.registration_deadline) e.registration_deadline = "Registration deadline is required.";
  if (f.start_time && f.end_time && f.end_time <= f.start_time) e.end_time = "End time must be after start time.";
  if (Number(f.max_participants) < 1) e.max_participants = "Must be at least 1.";
  if (Number(f.registration_fee) < 0) e.registration_fee = "Fee cannot be negative.";
  const posterError = validatePoster(poster);
  if (posterError) e.poster = posterError;
  return e;
}

export function validateVolunteer(f) {
  const e = {};
  if (blank(f.first_name)) e.first_name = "First name is required.";
  if (!isEmail(f.email)) e.email = "Enter a valid email address.";
  if (!f.password || f.password.length < 8) e.password = "Password must be at least 8 characters.";
  return e;
}

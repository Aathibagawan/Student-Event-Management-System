export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const formatTime = (t) => {
  if (!t) return "-";
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export const formatMoney = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

// Turns an API error response into one readable string.
// Shapes: {error, details:{field:[msgs]}} (from our exception handler) or {error: "..."} (direct).
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const data = err?.response?.data;
  if (!data) return err?.message === "Network Error" ? "Cannot reach the server." : fallback;
  if (data.details && typeof data.details === "object") {
    const parts = [];
    Object.entries(data.details).forEach(([key, value]) => {
      if (key === "detail") parts.push(String(value));
      else parts.push(`${key.replace(/_/g, " ")}: ${[].concat(value).join(" ")}`);
    });
    if (parts.length) return parts.join(" | ");
  }
  return typeof data.error === "string" && data.error ? data.error : fallback;
}

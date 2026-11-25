const TONES = {
  Upcoming: "blue",
  "Registration Open": "green",
  "Registration Closed": "orange",
  Completed: "gray",
  Cancelled: "red",
  Confirmed: "green",
  "Checked In": "green",
  "Not Checked In": "orange",
};

export default function StatusBadge({ value }) {
  return <span className={`badge badge-${TONES[value] || "gray"}`}>{value}</span>;
}

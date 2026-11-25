import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = {
  admin: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "📅", "Events"],
    ["/registrations", "📝", "Registrations"],
    ["/students", "🎓", "Students"],
    ["/volunteers", "🙋", "Volunteers"],
    ["/budgets", "💰", "Budgets"],
    ["/check-in", "📷", "QR Check-In"],
  ],
  student: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "📅", "Browse Events"],
    ["/my-registrations", "🎟️", "My Registrations"],
  ],
  volunteer: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "📅", "Assigned Events"],
    ["/registrations", "📝", "Participants"],
    ["/check-in", "📷", "QR Check-In"],
  ],
};

const ROLE_BADGE = { admin: "badge-purple", student: "badge-blue", volunteer: "badge-green" };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar: fixed drawer on phones, static column from the lg breakpoint up */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-200 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-slate-700 px-5 py-5">
          <div className="text-xl font-bold text-white">🎓 ACE Events</div>
          <div className="mt-1 text-xs text-slate-400">Event &amp; Symposium Management</div>
        </div>
        <nav className="space-y-1 p-3" onClick={() => setOpen(false)}>
          {(NAV[user.role] || []).map(([to, icon, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800"}`}>
              <span aria-hidden>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button className="rounded-lg p-2 text-xl hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm">
            <strong className="hidden sm:inline">{user.full_name}</strong>
            <span className={`badge ${ROLE_BADGE[user.role]}`}>{user.role}</span>
          </div>
          <button className="btn btn-sm" onClick={handleLogout}>Logout</button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

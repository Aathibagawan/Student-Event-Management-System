import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = {
  admin: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "🎉", "Events"],
    ["/registrations", "📝", "Registrations"],
    ["/students", "🎓", "Students"],
    ["/volunteers", "🤝", "Volunteers"],
    ["/budgets", "💰", "Budgets"],
    ["/check-in", "✅", "QR Check-In"],
  ],
  student: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "🎉", "Browse Events"],
    ["/my-registrations", "🎟️", "My Registrations"],
  ],
  volunteer: [
    ["/dashboard", "📊", "Dashboard"],
    ["/events", "🎉", "Assigned Events"],
    ["/registrations", "📝", "Participants"],
    ["/check-in", "✅", "QR Check-In"],
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-title">ACE Events</div>
          <div className="brand-sub">Event &amp; Symposium Management Platform</div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {(NAV[user.role] || []).map(([to, icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <span>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            ☰
          </button>
          <div className="topbar-spacer" />
          <div className="user-chip">
            <strong>{user.full_name}</strong>
            <span className={`badge badge-role role-${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

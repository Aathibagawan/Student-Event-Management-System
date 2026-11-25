import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../routes/ProtectedRoute";

let mockAuth = { user: null, loading: false };
vi.mock("../context/AuthContext", () => ({ useAuth: () => mockAuth }));

function renderAt(roles) {
  return render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route element={<ProtectedRoute roles={roles} />}>
          <Route path="/secret" element={<div>Secret page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => { mockAuth = { user: null, loading: false }; });

  it("redirects anonymous users to login", () => {
    renderAt();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("lets a user with the right role in", () => {
    mockAuth = { user: { role: "admin" }, loading: false };
    renderAt(["admin"]);
    expect(screen.getByText("Secret page")).toBeInTheDocument();
  });

  it("sends a wrong-role user back to the dashboard", () => {
    mockAuth = { user: { role: "student" }, loading: false };
    renderAt(["admin"]);
    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
  });
});

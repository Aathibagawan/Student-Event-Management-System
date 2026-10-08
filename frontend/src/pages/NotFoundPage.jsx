import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card center">
        <h1>404</h1>
        <p className="muted">That page does not exist.</p>
        <Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link>
      </div>
    </div>
  );
}

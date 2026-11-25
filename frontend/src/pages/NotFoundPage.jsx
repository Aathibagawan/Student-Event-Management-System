import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>
      <p className="text-slate-500">That page does not exist.</p>
      <Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link>
    </div>
  );
}

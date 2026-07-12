import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">Page not found</h1>
      <p className="text-sm text-neutral-600">
        The page you're looking for doesn't exist. Check the URL and try again, or return to the dashboard.
      </p>
      <Link
        to="/"
        className="inline-block rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;

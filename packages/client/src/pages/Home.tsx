import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">Home</h1>
      <p data-testid="user-email" className="text-sm text-neutral-600">
        Signed in as {user?.email}
      </p>
      <button
        type="button"
        data-testid="logout-btn"
        onClick={handleLogout}
        className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        Log out
      </button>
    </div>
  );
}

export default Home;

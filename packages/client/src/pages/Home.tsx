import { useAuth } from "@/context/AuthContext";

function Home() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
      <p data-testid="user-email" className="text-sm text-neutral-600">
        Signed in as {user?.email}
      </p>
    </div>
  );
}

export default Home;

import { useAuth } from "@/context/AuthContext";

function Profile() {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-900">{user?.email}</dd>
        </div>
        {user?.role && (
          <div>
            <dt className="text-neutral-500">Role</dt>
            <dd className="text-neutral-900">{user.role}</dd>
          </div>
        )}
        {user?.department && (
          <div>
            <dt className="text-neutral-500">Department</dt>
            <dd className="text-neutral-900">{user.department}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default Profile;

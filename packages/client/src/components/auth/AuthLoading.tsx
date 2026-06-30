/** Full-height placeholder shown while the session is being restored on load. */
export function AuthLoading() {
  return (
    <p data-testid="auth-loading" className="text-sm text-neutral-500">
      Loading…
    </p>
  );
}

/* The admin's sign-in logo: the Jomiez app icon and wordmark. */
export function Logo() {
  return (
    <div className="jomiez-admin-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/brand/jomiez-icon.png" alt="" width={48} height={48} />
      <div>
        <strong>Jomiez</strong>
        <span>Admin</span>
      </div>
    </div>
  );
}

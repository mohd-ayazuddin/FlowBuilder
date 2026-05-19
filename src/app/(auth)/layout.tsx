/**
 * Auth Layout
 * Simply passes through children — AuthProvider is already in the root layout.
 * Having a duplicate AuthProvider here was causing double-nesting and auth state conflicts.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

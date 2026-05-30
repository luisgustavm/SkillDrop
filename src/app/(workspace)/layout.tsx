import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequireAuth } from "@/components/shared/require-auth";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}

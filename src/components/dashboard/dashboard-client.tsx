"use client";

import { ErrorState } from "@/components/shared/error-state";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { FavoritesPanel } from "@/components/dashboard/favorites-panel";
import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUiStore } from "@/store/ui-store";

export function DashboardClient() {
  const { user, profile } = useAuth();
  const { uploads, favorites, activities, stats, loading, error } = useDashboardData(user?.uid);
  const search = useDebouncedValue(useUiStore((state) => state.globalSearch), 180).toLowerCase();

  const favoriteIds = new Set(favorites.map((favorite) => favorite.uploadId));
  const filteredUploads = uploads.filter((upload) => {
    if (!search) return true;

    return [upload.title, upload.description, upload.fileName, upload.fileType, ...upload.tags]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg border p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Workspace acadêmico</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              Bom estudo, {profile?.name?.split(" ")[0] ?? "estudante"}.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Organize entregas, visualize materiais importantes e converse com a IA sem sair da sua área.
            </p>
          </div>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}

      <StatsGrid stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <RecentUploads userId={user?.uid ?? ""} uploads={filteredUploads} favoriteUploadIds={favoriteIds} />
        <div className="space-y-6">
          <FavoritesPanel favorites={favorites} uploads={uploads} />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}

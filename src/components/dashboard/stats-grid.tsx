"use client";

import { Files, HardDrive, Share2, Star } from "lucide-react";
import { formatBytes } from "@/utils/file";
import type { DashboardStats } from "@/types/dashboard";

type StatsGridProps = {
  stats: DashboardStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: "Uploads", value: stats.totalUploads.toString(), icon: Files },
    { label: "Armazenamento", value: formatBytes(stats.totalStorageBytes), icon: HardDrive },
    { label: "Favoritos", value: stats.totalFavorites.toString(), icon: Star },
    { label: "Compartilhados", value: stats.sharedUploads.toString(), icon: Share2 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="glass-panel rounded-lg border p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal">{item.value}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Activity, Bot, MessageSquare, Share2, Star, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActivityLog, ActivityType } from "@/types/activity";
import { formatRelativeDate } from "@/utils/date";

const iconMap = {
  upload_created: UploadCloud,
  upload_shared: Share2,
  favorite_added: Star,
  comment_created: MessageSquare,
  ai_message: Bot,
} satisfies Record<ActivityType, typeof Activity>;

export function ActivityFeed({ activities }: { activities: ActivityLog[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">Atividade</h2>
        <p className="text-sm text-muted-foreground">Histórico recente da sua área.</p>
      </div>
      <div className="p-4">
        {activities.length ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type] ?? Activity;

              return (
                <div key={activity.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(activity.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Activity} title="Sem atividade" description="Suas ações importantes aparecerão aqui." />
        )}
      </div>
    </section>
  );
}

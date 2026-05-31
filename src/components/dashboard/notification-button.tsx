"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { listenUserNotifications, markNotificationRead } from "@/services/academic-service";
import type { SkillDropNotification } from "@/types/academic";
import { formatRelativeDate } from "@/utils/date";

const notificationKindLabel: Record<SkillDropNotification["kind"], string> = {
  room: "Sala",
  material: "Material",
  task: "Atividade",
  message: "Mensagem",
};

export function NotificationButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SkillDropNotification[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    return listenUserNotifications(user.uid, setNotifications, (error) => toast.error(error.message));
  }, [user]);

  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read), [notifications]);

  const markOneAsRead = async (notification: SkillDropNotification) => {
    if (notification.read) return;

    try {
      await markNotificationRead(notification.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel marcar a notificacao.");
    }
  };

  const markAllAsRead = async () => {
    if (!unreadNotifications.length) return;

    setSaving(true);
    try {
      await Promise.all(unreadNotifications.map((notification) => markNotificationRead(notification.id)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel limpar as notificacoes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="icon" title="Notificacoes" onClick={() => setOpen((current) => !current)}>
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadNotifications.length ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-card shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notificacoes</p>
              <p className="text-xs text-muted-foreground">{unreadNotifications.length} nao lida{unreadNotifications.length === 1 ? "" : "s"}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" disabled={saving || !unreadNotifications.length} onClick={() => void markAllAsRead()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Ler tudo
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md p-3 text-left transition hover:bg-muted",
                    !notification.read && "bg-primary/5",
                  )}
                  onClick={() => void markOneAsRead(notification)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={notification.read ? "muted" : "default"}>{notificationKindLabel[notification.kind]}</Badge>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(notification.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{notification.title}</p>
                  {notification.message ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p> : null}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium">Sem notificacoes</p>
                <p className="mt-1 text-xs text-muted-foreground">Pedidos de entrada e avisos importantes aparecem aqui.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

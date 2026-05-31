"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Code2,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  Search,
  Share2,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/store/ui-store";

const navigation = [
  { href: "/rooms", label: "Salas privadas", icon: LockKeyhole },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/uploads", label: "Uploads", icon: UploadCloud },
  { href: "/editor", label: "Editor", icon: Code2 },
  { href: "/chat", label: "IA", icon: Bot },
  { href: "/shared", label: "Compartilhar", icon: Share2 },
];

function pageTitle(pathname: string) {
  if (pathname.startsWith("/global-chat")) return "Salas privadas";
  return navigation.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const { profile, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const globalSearch = useUiStore((state) => state.globalSearch);
  const setGlobalSearch = useUiStore((state) => state.setGlobalSearch);
  const resolvedTheme = theme === "dark" ? "light" : "dark";

  useEffect(() => {
    navigation.forEach((item) => router.prefetch(item.href));
  }, [router]);

  const navigate = (href: string) => {
    router.prefetch(href);
    if (href !== pathname) setRouteLoading(true);
    setSidebarOpen(false);
  };

  useEffect(() => {
    setRouteLoading(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <button
        type="button"
        aria-label="Fechar menu"
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 opacity-0 backdrop-blur-sm transition-opacity lg:hidden",
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card/95 backdrop-blur-xl transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/rooms" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              SD
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{APP_NAME}</p>
              <p className="mt-1 text-xs text-muted-foreground">Área acadêmica</p>
            </div>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Fechar menu"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <UserAvatar src={profile?.avatar} name={profile?.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.name ?? "Estudante"}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email ?? "Sessão convidada"}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" title="Sair" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Abrir menu"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="hidden min-w-40 sm:block">
              <p className="text-xs text-muted-foreground">SkillDrop</p>
              <h1 className="text-lg font-semibold leading-tight">{pageTitle(pathname)}</h1>
            </div>
            <div className="relative ml-auto w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Buscar arquivos, tags e atividades"
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Alternar tema"
              onClick={() => setTheme(resolvedTheme)}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" aria-hidden="true" />
            </Button>
          </div>
          <div className={cn("h-0.5 bg-primary/70 opacity-0 transition-opacity", routeLoading && "opacity-100")} />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

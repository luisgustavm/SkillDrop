"use client";

import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/store/ui-store";

export function RoomsLobbyShell({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const globalSearch = useUiStore((state) => state.globalSearch);
  const setGlobalSearch = useUiStore((state) => state.setGlobalSearch);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              SD
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{APP_NAME}</p>
              <p className="mt-1 text-xs text-muted-foreground">Lobby seguro</p>
            </div>
          </Link>

          <div className="relative hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Buscar salas"
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <UserAvatar src={profile?.avatar} name={profile?.name} className="h-8 w-8" />
              <span className="max-w-40 truncate text-sm font-medium">{profile?.name ?? "Estudante"}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b px-4 py-3 md:hidden">
        <div className="relative mx-auto max-w-7xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Buscar salas"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

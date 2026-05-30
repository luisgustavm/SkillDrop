"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, firebaseReady, testModeAvailable, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (firebaseReady || testModeAvailable) && !user) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [firebaseReady, loading, router, testModeAvailable, user]);

  if (!firebaseReady && !testModeAvailable) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <ErrorState message={error ?? "Configure as variáveis do Firebase para acessar a plataforma."} />
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Carregando sessão
      </main>
    );
  }

  return <>{children}</>;
}

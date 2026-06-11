"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/hooks/use-auth";
import { setUserAccountStatus } from "@/services/user-service";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, firebaseReady, error, logout, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && firebaseReady && !user) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [firebaseReady, loading, router, user]);

  if (!firebaseReady) {
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

  if (profile?.accountStatus === "inactive") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-soft">
          <h1 className="text-xl font-semibold tracking-normal">Conta desativada</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sua conta esta pausada. Reative para voltar ao SkillDrop ou saia da sessao.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() =>
                void setUserAccountStatus(user, "active")
                  .then(refreshProfile)
                  .then(() => toast.success("Conta reativada."))
                  .catch((reactivateError) =>
                    toast.error(reactivateError instanceof Error ? reactivateError.message : "Nao foi possivel reativar a conta."),
                  )
              }
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reativar
            </Button>
            <Button type="button" variant="outline" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

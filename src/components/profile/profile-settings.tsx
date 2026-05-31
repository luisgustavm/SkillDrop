"use client";

import { Camera, Loader2, Mail, Power, Save, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmCard } from "@/components/shared/delete-confirm-card";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getFirebaseErrorMessage } from "@/firebase/errors";
import { useAuth } from "@/hooks/use-auth";
import { deleteUserAccount, setUserAccountStatus, updateUserProfile } from "@/services/user-service";

export function ProfileSettings() {
  const router = useRouter();
  const { user, profile, logout, refreshProfile, resetPassword } = useAuth();
  const [name, setName] = useState(profile?.name ?? user?.displayName ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? user?.photoURL ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? user?.displayName ?? "");
    setAvatar(profile?.avatar ?? user?.photoURL ?? "");
  }, [profile, user]);

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      await updateUserProfile(user, { name, avatar });
      await refreshProfile();
      toast.success("Perfil atualizado.");
    } catch (saveError) {
      const message = getFirebaseErrorMessage(saveError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    const email = profile?.email ?? user?.email;
    if (!email) return;

    setSendingReset(true);
    setError(null);

    try {
      await resetPassword(email);
      toast.success("Link de senha enviado para seu e-mail.");
    } catch (resetError) {
      const message = getFirebaseErrorMessage(resetError);
      setError(message);
      toast.error(message);
    } finally {
      setSendingReset(false);
    }
  };

  const deactivateAccount = async () => {
    if (!user) return;

    setDeactivating(true);
    setError(null);

    try {
      await setUserAccountStatus(user, "inactive");
      toast.success("Conta desativada.");
      await logout();
      router.replace("/");
    } catch (deactivateError) {
      const message = getFirebaseErrorMessage(deactivateError);
      setError(message);
      toast.error(message);
    } finally {
      setDeactivating(false);
    }
  };

  const removeAccount = async () => {
    if (!user) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteUserAccount(user);
      toast.success("Conta excluida.");
      await logout().catch(() => undefined);
      router.replace("/");
    } catch (deleteError) {
      const message = getFirebaseErrorMessage(deleteError);
      setError(
        message.includes("recent")
          ? "Por seguranca, entre novamente na sua conta e tente excluir de novo."
          : message,
      );
      toast.error("Nao foi possivel excluir a conta agora.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="glass-panel rounded-lg border p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar src={avatar || profile?.avatar} name={name || profile?.name} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">Perfil e conta</h1>
              <Badge variant={profile?.accountStatus === "inactive" ? "muted" : "secondary"}>
                {profile?.accountStatus === "inactive" ? "Desativada" : "Ativa"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualize seus dados, gerencie acesso e controle o status da sua conta.
            </p>
          </div>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
            <CardDescription>Essas informacoes aparecem para voce e em novos convites de sala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="profile-name"
                    value={name}
                    maxLength={80}
                    onChange={(event) => setName(event.target.value)}
                    className="pl-9"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-avatar">URL da foto</Label>
                <div className="relative">
                  <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="profile-avatar"
                    value={avatar}
                    onChange={(event) => setAvatar(event.target.value)}
                    className="pl-9"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{profile?.email ?? user?.email ?? "E-mail nao informado"}</p>
              <p className="mt-1">O e-mail fica vinculado ao login. Para trocar, crie outra conta ou ajuste pelo provedor usado.</p>
            </div>
            <Button type="button" disabled={saving || !name.trim()} onClick={() => void saveProfile()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Salvar perfil
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguranca</CardTitle>
              <CardDescription>Acoes de acesso da sua conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={sendingReset || !(profile?.email ?? user?.email)}
                onClick={() => void sendPasswordReset()}
              >
                {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                Enviar link de senha
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zona sensivel</CardTitle>
              <CardDescription>Desative temporariamente ou exclua sua conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" variant="outline" className="w-full" disabled={deactivating} onClick={() => void deactivateAccount()}>
                {deactivating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                Desativar conta
              </Button>
              <DeleteConfirmCard
                title="Excluir conta"
                description="Sua conta sera marcada como excluida e o login sera removido do Firebase Auth. Esta acao pode exigir login recente."
                confirmLabel="Excluir conta"
                triggerLabel="Excluir conta"
                triggerTitle="Excluir conta"
                className="w-full"
                loading={deleting}
                onConfirm={removeAccount}
              />
              <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>Exclusao de conta pode exigir que voce faca login novamente por seguranca.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

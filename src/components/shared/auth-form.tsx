"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
<<<<<<< HEAD
import { ArrowLeft, FlaskConical, Globe, KeyRound, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
=======
import { Globe, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "login" | "register" | "reset";

export function AuthForm({ mode }: { mode: AuthMode }) {
  if (mode === "register") return <RegisterForm />;
  if (mode === "reset") return <ResetPasswordForm />;

  return <LoginForm />;
}

function LoginForm() {
<<<<<<< HEAD
  const { login, loginGoogle, loginGuest, loginTest, loading, error, user, firebaseReady, testModeAvailable } = useAuth();
=======
  const { login, loginGoogle, loginGuest, loading, error, user } = useAuth();
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
  const router = useRouter();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useRedirectWhenAuthenticated(Boolean(user));

  return (
    <AuthFrame
      title="Entrar no SkillDrop"
<<<<<<< HEAD
      description="Acesse sua área acadêmica."
=======
      description="Acesse seu workspace acadêmico."
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
      footer={
        <>
          Novo por aqui?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
<<<<<<< HEAD
      {!firebaseReady && testModeAvailable ? (
        <TestModePanel
          onStart={async () => {
            await loginTest();
            toast.success("Modo teste ativado.");
            router.replace(getAuthRedirectPath());
          }}
        />
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login(values.email, values.password);
            toast.success("Sessão iniciada.");
            router.replace(getAuthRedirectPath());
          } catch (authError) {
            showAuthActionError(authError);
          }
=======
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await login(values.email, values.password);
          toast.success("Sessão iniciada.");
          router.replace(getAuthRedirectPath());
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        })}
      >
        {error ? <ErrorState message={error} /> : null}
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
<<<<<<< HEAD
        <Button type="submit" className="w-full" disabled={!firebaseReady || loading || form.formState.isSubmitting}>
=======
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
          Entrar
        </Button>
      </form>

      <AuthAlternatives
<<<<<<< HEAD
        disabled={!firebaseReady || loading}
=======
        loading={loading}
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        onGoogle={async () => {
          await loginGoogle();
          toast.success("Login Google conectado.");
          router.replace(getAuthRedirectPath());
        }}
        onGuest={async () => {
          await loginGuest();
          toast.success("Sessão convidada criada.");
          router.replace(getAuthRedirectPath());
        }}
      />

<<<<<<< HEAD
      <Button asChild variant="ghost" className="w-full">
        <Link href="/reset-password">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Esqueci minha senha
        </Link>
      </Button>
=======
      <Link href="/reset-password" className="block text-center text-sm font-medium text-primary hover:underline">
        Esqueci minha senha
      </Link>
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
    </AuthFrame>
  );
}

function RegisterForm() {
<<<<<<< HEAD
  const { register, loginGoogle, loginGuest, loginTest, loading, error, user, firebaseReady, testModeAvailable } = useAuth();
=======
  const { register, loginGoogle, loginGuest, loading, error, user } = useAuth();
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useRedirectWhenAuthenticated(Boolean(user));

  return (
    <AuthFrame
      title="Criar conta"
      description="Organize entregas, links e códigos em um só lugar."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
<<<<<<< HEAD
      {!firebaseReady && testModeAvailable ? (
        <TestModePanel
          onStart={async () => {
            await loginTest();
            toast.success("Modo teste ativado.");
            router.replace(getAuthRedirectPath());
          }}
        />
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await register(values.name, values.email, values.password);
            toast.success("Conta criada.");
            router.replace(getAuthRedirectPath());
          } catch (authError) {
            showAuthActionError(authError);
          }
=======
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await register(values.name, values.email, values.password);
          toast.success("Conta criada.");
          router.replace(getAuthRedirectPath());
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        })}
      >
        {error ? <ErrorState message={error} /> : null}
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input autoComplete="name" {...form.register("name")} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
<<<<<<< HEAD
        <Button type="submit" className="w-full" disabled={!firebaseReady || loading || form.formState.isSubmitting}>
=======
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          Registrar
        </Button>
      </form>

      <AuthAlternatives
<<<<<<< HEAD
        disabled={!firebaseReady || loading}
=======
        loading={loading}
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        onGoogle={async () => {
          await loginGoogle();
          toast.success("Login Google conectado.");
          router.replace(getAuthRedirectPath());
        }}
        onGuest={async () => {
          await loginGuest();
          toast.success("Sessão convidada criada.");
          router.replace(getAuthRedirectPath());
        }}
      />
    </AuthFrame>
  );
}

function ResetPasswordForm() {
<<<<<<< HEAD
  const { resetPassword, loading, error, firebaseReady } = useAuth();
=======
  const { resetPassword, loading, error } = useAuth();
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <AuthFrame
      title="Recuperar senha"
      description="Enviaremos um link seguro para seu e-mail."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar para login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
<<<<<<< HEAD
          try {
            await resetPassword(values.email);
            toast.success("E-mail de recuperação enviado.");
          } catch (authError) {
            showAuthActionError(authError);
          }
=======
          await resetPassword(values.email);
          toast.success("E-mail de recuperação enviado.");
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        })}
      >
        {error ? <ErrorState message={error} /> : null}
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
<<<<<<< HEAD
        <Button type="submit" className="w-full" disabled={!firebaseReady || loading || form.formState.isSubmitting}>
=======
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
          Enviar link
        </Button>
      </form>
    </AuthFrame>
  );
}

<<<<<<< HEAD
function TestModePanel({ onStart }: { onStart: () => Promise<void> }) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Teste local disponível</p>
          <p className="mt-1 text-muted-foreground">
            Use uma sessão de demonstração para testar as telas e salas privadas sem configurar o Firebase local.
          </p>
          <Button type="button" size="sm" className="mt-3" onClick={() => void onStart().catch(showAuthActionError)}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar no modo teste
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthAlternatives({
  disabled,
  onGoogle,
  onGuest,
}: {
  disabled: boolean;
=======
function AuthAlternatives({
  loading,
  onGoogle,
  onGuest,
}: {
  loading: boolean;
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
  onGoogle: () => Promise<void>;
  onGuest: () => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-card px-3">ou continue com</span>
        <span className="absolute left-0 top-1/2 -z-10 h-px w-full bg-border" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
<<<<<<< HEAD
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void onGoogle().catch(showAuthActionError)}>
          <Globe className="h-4 w-4" aria-hidden="true" />
          Google
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void onGuest().catch(showAuthActionError)}>
=======
        <Button type="button" variant="outline" disabled={loading} onClick={() => void onGoogle()}>
          <Globe className="h-4 w-4" aria-hidden="true" />
          Google
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void onGuest()}>
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
          Convidado
        </Button>
      </div>
    </div>
  );
}

<<<<<<< HEAD
function showAuthActionError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Não foi possível concluir a autenticação.");
}

=======
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function AuthFrame({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-soft">
      <div className="mb-6">
<<<<<<< HEAD
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para tela inicial
        </Link>
=======
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        <Link href="/" className="mb-6 flex w-fit items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            SD
          </span>
          <span className="font-semibold">SkillDrop</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
      <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}

function useRedirectWhenAuthenticated(authenticated: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (authenticated) router.replace(getAuthRedirectPath());
  }, [authenticated, router]);
}

function getAuthRedirectPath() {
  if (typeof window === "undefined") return "/dashboard";

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) return nextPath;

  return "/dashboard";
}

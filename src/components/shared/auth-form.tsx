"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
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
  const { login, loginGoogle, loginGuest, loading, error, user } = useAuth();
  const router = useRouter();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useRedirectWhenAuthenticated(Boolean(user));

  return (
    <AuthFrame
      title="Entrar no SkillDrop"
      description="Acesse seu workspace acadêmico."
      footer={
        <>
          Novo por aqui?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await login(values.email, values.password);
          toast.success("Sessão iniciada.");
          router.replace(getAuthRedirectPath());
        })}
      >
        {error ? <ErrorState message={error} /> : null}
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
          Entrar
        </Button>
      </form>

      <AuthAlternatives
        loading={loading}
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

      <Link href="/reset-password" className="block text-center text-sm font-medium text-primary hover:underline">
        Esqueci minha senha
      </Link>
    </AuthFrame>
  );
}

function RegisterForm() {
  const { register, loginGoogle, loginGuest, loading, error, user } = useAuth();
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
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await register(values.name, values.email, values.password);
          toast.success("Conta criada.");
          router.replace(getAuthRedirectPath());
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
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          Registrar
        </Button>
      </form>

      <AuthAlternatives
        loading={loading}
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
  const { resetPassword, loading, error } = useAuth();
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
          await resetPassword(values.email);
          toast.success("E-mail de recuperação enviado.");
        })}
      >
        {error ? <ErrorState message={error} /> : null}
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
          Enviar link
        </Button>
      </form>
    </AuthFrame>
  );
}

function AuthAlternatives({
  loading,
  onGoogle,
  onGuest,
}: {
  loading: boolean;
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
        <Button type="button" variant="outline" disabled={loading} onClick={() => void onGoogle()}>
          <Globe className="h-4 w-4" aria-hidden="true" />
          Google
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void onGuest()}>
          Convidado
        </Button>
      </div>
    </div>
  );
}

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

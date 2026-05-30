<<<<<<< HEAD
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, FileUp, LockKeyhole, QrCode, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
  "Salas privadas por código ou link",
  "Uploads, links e códigos organizados",
  "Assistente IA para estudo e revisão",
];

const featureCards = [
  {
    title: "Sala fechada para cada turma",
    description: "Crie um espaço privado, compartilhe o código e mantenha a conversa da equipe no lugar certo.",
    icon: LockKeyhole,
  },
  {
    title: "Materiais em contexto",
    description: "Guarde arquivos, links, comentários e favoritos sem espalhar tudo em conversas perdidas.",
    icon: FileUp,
  },
  {
    title: "Compartilhamento rápido",
    description: "Gere links e QR Codes para materiais compartilháveis quando precisar apresentar ou revisar.",
    icon: QrCode,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
          <ProductScene />
        </div>
        <div className="absolute inset-y-0 left-0 z-10 hidden w-[56%] bg-gradient-to-r from-card via-card/95 to-card/10 lg:block" aria-hidden="true" />

        <header className="relative z-20 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              SD
            </span>
            <span className="font-semibold">SkillDrop</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Criar conta</Link>
            </Button>
          </nav>
        </header>

        <div className="relative z-20 mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-5">
              Plataforma acadêmica com salas privadas
            </Badge>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">SkillDrop</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Organize entregas, links, códigos e conversas da turma em um ambiente limpo, privado e pronto para estudo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="default" className="h-11 px-5">
                <Link href="/register">
                  Começar agora
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="h-11 px-5">
                <Link href="/login?next=/rooms">
                  Entrar em uma sala
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Fluxo profissional</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              Menos improviso, mais clareza para a turma.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="rounded-lg border bg-card p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductScene() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-50 xl:opacity-65">
      <div className="absolute left-[57%] top-24 w-[820px] rounded-lg border bg-background shadow-panel xl:left-[52%] xl:w-[900px] 2xl:left-[50%]">
        <div className="flex h-12 items-center gap-2 border-b px-4">
          <span className="h-3 w-3 rounded-full bg-destructive" />
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="h-3 w-3 rounded-full bg-secondary" />
          <span className="ml-4 h-6 w-60 rounded-md bg-muted" />
        </div>
        <div className="grid min-h-[560px] grid-cols-[220px_1fr_260px]">
          <div className="border-r p-4">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                SD
              </span>
              <div>
                <span className="block h-3 w-24 rounded bg-foreground/20" />
                <span className="mt-2 block h-2 w-20 rounded bg-muted" />
              </div>
            </div>
            {[LockKeyhole, FileUp, Bot, QrCode].map((Icon, index) => (
              <div key={index} className="mb-2 flex h-10 items-center gap-3 rounded-md bg-muted px-3">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="h-2 w-24 rounded bg-foreground/15" />
              </div>
            ))}
          </div>
          <div className="p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <span className="block h-4 w-44 rounded bg-foreground/20" />
                <span className="mt-3 block h-2 w-72 rounded bg-muted" />
              </div>
              <span className="h-9 w-28 rounded-md bg-primary/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[UsersRound, ShieldCheck, FileUp].map((Icon, index) => (
                <div key={index} className="rounded-lg border bg-card p-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="mt-5 block h-5 w-14 rounded bg-foreground/20" />
                  <span className="mt-3 block h-2 w-24 rounded bg-muted" />
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border bg-card">
              <div className="border-b p-4">
                <span className="block h-3 w-36 rounded bg-foreground/20" />
              </div>
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 border-b p-4 last:border-b-0">
                  <span className="h-10 w-10 rounded-md bg-primary/10" />
                  <div className="min-w-0 flex-1">
                    <span className="block h-3 w-44 rounded bg-foreground/20" />
                    <span className="mt-2 block h-2 w-64 rounded bg-muted" />
                  </div>
                  <span className="h-8 w-8 rounded-md bg-muted" />
                </div>
              ))}
            </div>
          </div>
          <div className="border-l p-4">
            <div className="rounded-lg border bg-card p-4">
              <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="mt-5 block h-3 w-32 rounded bg-foreground/20" />
              <span className="mt-3 block h-8 w-36 rounded bg-muted" />
              <span className="mt-4 block h-9 w-full rounded-md bg-primary/20" />
            </div>
            <div className="mt-4 rounded-lg border bg-card p-4">
              <span className="block h-3 w-28 rounded bg-foreground/20" />
              <span className="mt-4 block h-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
=======
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
}

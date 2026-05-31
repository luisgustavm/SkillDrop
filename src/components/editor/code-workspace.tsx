"use client";

import dynamic from "next/dynamic";
import {
  Clipboard,
  ClipboardCheck,
  Download,
  Edit3,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Save,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmCard } from "@/components/shared/delete-confirm-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { createCodeSnippet, deleteCodeSnippet, listenCodeSnippets, updateCodeSnippet } from "@/services/code-service";
import type { CodeLanguage, CodeSnippet } from "@/types/code";
import { formatRelativeDate } from "@/utils/date";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[520px] w-full" />,
});

const languages: Array<{ label: string; value: CodeLanguage; extension: string }> = [
  { label: "JavaScript", value: "javascript", extension: "js" },
  { label: "TypeScript", value: "typescript", extension: "ts" },
  { label: "Python", value: "python", extension: "py" },
  { label: "Java", value: "java", extension: "java" },
  { label: "C#", value: "csharp", extension: "cs" },
  { label: "HTML", value: "html", extension: "html" },
  { label: "CSS", value: "css", extension: "css" },
  { label: "SQL", value: "sql", extension: "sql" },
];

const defaultLanguage = languages[1];

export function CodeWorkspace() {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(defaultLanguage);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadingSnippets, setLoadingSnippets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const { copied, copy } = useClipboard();
  const editorRef = useRef<HTMLElement | null>(null);
  const fileName = useMemo(() => {
    const safeTitle = title.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-{2,}/g, "-") || "skilldrop-code";

    return `${safeTitle}.${language.extension}`;
  }, [language.extension, title]);

  useEffect(() => {
    if (!user?.uid) {
      setSnippets([]);
      setLoadingSnippets(false);
      return;
    }

    setLoadingSnippets(true);

    return listenCodeSnippets(
      (items) => {
        setSnippets(items);
        setLoadingSnippets(false);
      },
      (snippetError) => {
        setError(snippetError.message);
        setLoadingSnippets(false);
      },
    );
  }, [user?.uid]);

  const resetDraft = () => {
    setTitle("");
    setCode("");
    setLanguage(defaultLanguage);
    setEditingId(null);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveSnippet = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        userId: user.uid,
        authorName: profile?.name ?? user.displayName ?? "Estudante",
        authorAvatar: profile?.avatar ?? user.photoURL ?? null,
        title,
        language: language.value,
        extension: language.extension,
        code,
      };

      if (editingId) {
        await updateCodeSnippet(editingId, payload);
        toast.success("Código atualizado.");
      } else {
        await createCodeSnippet(payload);
        toast.success("Código salvo e publicado para todos.");
      }

      resetDraft();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Não foi possível salvar o código.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const editSnippet = (snippet: CodeSnippet) => {
    setEditingId(snippet.id);
    setTitle(snippet.title);
    setCode(snippet.code);
    setLanguage(languages.find((item) => item.value === snippet.language) ?? defaultLanguage);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const removeSnippet = async (snippet: CodeSnippet) => {
    setDeletingId(snippet.id);
    setError(null);

    try {
      await deleteCodeSnippet(snippet.id);
      if (editingId === snippet.id) resetDraft();
      toast.success("Código excluído.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Não foi possível excluir o código.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const copySnippet = async (snippet: CodeSnippet) => {
    await navigator.clipboard.writeText(snippet.code);
    setCopiedSnippetId(snippet.id);
    toast.success("Código copiado.");
    window.setTimeout(() => setCopiedSnippetId(null), 1500);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        {error ? <ErrorState message={error} /> : null}

        <section
          ref={editorRef}
          className={cn(
            "overflow-hidden rounded-lg border bg-card",
            fullscreen && "fixed inset-3 z-50 rounded-lg shadow-2xl",
          )}
        >
          <div className="space-y-4 border-b p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-base font-semibold">{editingId ? "Editar código salvo" : "Novo código"}</h2>
                <p className="text-sm text-muted-foreground">Salve e publique códigos para todos verem no SkillDrop.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={resetDraft}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo
                </Button>
                <Button type="button" disabled={saving || !title.trim() || !code.trim()} onClick={() => void saveSnippet()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  {editingId ? "Atualizar" : "Salvar e publicar"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
              <div className="space-y-1">
                <Label htmlFor="code-title" className="text-xs text-muted-foreground">
                  Título do código
                </Label>
                <Input
                  id="code-title"
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Validação de formulário com Zod"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="language" className="text-xs text-muted-foreground">
                  Linguagem
                </Label>
                <select
                  id="language"
                  value={language.value}
                  onChange={(event) =>
                    setLanguage(languages.find((item) => item.value === event.target.value) ?? defaultLanguage)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {languages.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" title="Copiar código" onClick={() => void copy(code)}>
                  {copied ? <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <Button type="button" variant="outline" size="icon" title="Baixar código" onClick={download}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" size="icon" title="Tela cheia" onClick={() => setFullscreen((value) => !value)}>
                  {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          </div>

          <div className={cn("h-[560px]", fullscreen && "h-[calc(100vh-190px)]")}>
            <MonacoEditor
              height="100%"
              language={language.value}
              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                wordWrap: "on",
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 },
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </section>
      </div>

      <aside className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Códigos publicados</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cards compactos para copiar, editar ou excluir.</p>
        </div>

        <div className="max-h-[760px] space-y-3 overflow-y-auto p-4">
          {loadingSnippets ? <SnippetSkeleton /> : null}

          {!loadingSnippets && !snippets.length ? (
            <EmptyState
              title="Nenhum código salvo"
              description="Salve seu primeiro código para ele aparecer aqui compactado."
            />
          ) : null}

          {snippets.map((snippet) => {
            const mine = snippet.userId === user?.uid;
            const currentLanguage = languages.find((item) => item.value === snippet.language);

            return (
              <article key={snippet.id} className="rounded-lg border bg-background p-3 transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{snippet.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="muted">{currentLanguage?.label ?? snippet.language}</Badge>
                      <span>{formatRelativeDate(snippet.updatedAt ?? snippet.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Copiar código"
                    onClick={() => void copySnippet(snippet)}
                  >
                    {copiedSnippetId === snippet.id ? (
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Clipboard className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>

                <pre className="mt-3 max-h-24 overflow-hidden rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
                  <code>{snippet.code}</code>
                </pre>

                <div className="mt-3 flex items-center gap-2">
                  <UserAvatar src={snippet.authorAvatar} name={snippet.authorName} className="h-7 w-7" />
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{snippet.authorName}</p>
                  {mine ? (
                    <>
                      <Button type="button" variant="outline" size="icon" title="Editar código" onClick={() => editSnippet(snippet)}>
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <DeleteConfirmCard
                        title="Excluir codigo"
                        description={`O codigo "${snippet.title}" sera removido da lista de codigos publicados.`}
                        confirmLabel="Excluir codigo"
                        triggerTitle="Excluir codigo"
                        triggerVariant="outline"
                        iconOnly
                        loading={deletingId === snippet.id}
                        onConfirm={() => removeSnippet(snippet)}
                      />
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

function SnippetSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-lg border p-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-20 w-full" />
          <Skeleton className="mt-3 h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

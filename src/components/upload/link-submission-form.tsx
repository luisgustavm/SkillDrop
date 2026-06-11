"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeTags } from "@/lib/sanitize";
import { linkUploadSchema, type LinkUploadFormValues } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { saveLinkUpload } from "@/services/upload-service";

type LinkSubmissionFormProps = {
  userId: string;
  roomId: string;
};

export function LinkSubmissionForm({ userId, roomId }: LinkSubmissionFormProps) {
  const form = useForm<LinkUploadFormValues>({
    resolver: zodResolver(linkUploadSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      tags: "",
      visibility: "private",
    },
  });

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Salvar link</h2>
          <p className="text-sm text-muted-foreground">Adicione repositórios, protótipos, vídeos ou referências externas.</p>
        </div>
      </div>

      <form
        className="mt-5 grid gap-4 lg:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await saveLinkUpload({
              userId,
              roomId,
              url: values.url,
              metadata: {
                title: values.title,
                description: values.description,
                tags: sanitizeTags(values.tags),
                visibility: values.visibility,
              },
            });
            form.reset({ title: "", url: "", description: "", tags: "", visibility: "private" });
            toast.success("Link salvo.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao salvar link.");
          }
        })}
      >
        <Field label="Título" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} placeholder="Ex: Repositório do projeto" />
        </Field>
        <Field label="URL" error={form.formState.errors.url?.message}>
          <Input type="url" {...form.register("url")} placeholder="https://..." />
        </Field>
        <div className="lg:col-span-2">
          <Field label="Descrição" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} placeholder="Explique por que este link é importante." />
          </Field>
        </div>
        <Field label="Tags">
          <Input {...form.register("tags")} placeholder="github, frontend, entrega" />
          <div className="mt-2 flex flex-wrap gap-2">
            {sanitizeTags(form.watch("tags") ?? "").map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Visibilidade</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["private", "shared"] as const).map((visibility) => (
              <label
                key={visibility}
                className={cn(
                  "cursor-pointer rounded-md border p-3 text-sm transition hover:bg-muted",
                  form.watch("visibility") === visibility && "border-primary bg-primary/10 text-primary",
                )}
              >
                <input type="radio" value={visibility} className="sr-only" {...form.register("visibility")} />
                {visibility === "private" ? "Privado" : "Compartilhável"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="lg:col-span-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Salvar link
          </Button>
        </div>
      </form>
    </section>
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

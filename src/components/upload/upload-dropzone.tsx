"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileUp, RotateCcw, Send, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { useUpload } from "@/hooks/use-upload";
import { ACCEPTED_EXTENSIONS } from "@/lib/constants";
import { sanitizeTags } from "@/lib/sanitize";
import { uploadMetadataSchema, type UploadMetadataFormValues } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { classifyFile, formatBytes } from "@/utils/file";

type UploadDropzoneProps = {
  userId: string;
  roomId: string;
};

export function UploadDropzone({ userId, roomId }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const upload = useUpload(userId, roomId);
  const form = useForm<UploadMetadataFormValues>({
    resolver: zodResolver(uploadMetadataSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      visibility: "private",
    },
  });
  const selectedVisibility = form.watch("visibility");

  const handleFile = (file?: File) => {
    upload.selectFile(file ?? null);
    if (file && !form.getValues("title")) {
      form.setValue("title", file.name.replace(/\.[^/.]+$/, ""), { shouldValidate: true });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await upload.startUpload({
        title: values.title,
        description: values.description,
        tags: sanitizeTags(values.tags),
        visibility: values.visibility,
      });
      toast.success("Arquivo enviado com sucesso.");
      form.reset({ title: "", description: "", tags: "", visibility: "private" });
      upload.selectFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar arquivo.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] 2xl:grid-cols-[minmax(0,1fr)_520px]">
      <section className="space-y-4">
        <div
          className={cn(
            "glass-panel flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition",
            dragActive && "border-primary bg-primary/5",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          {upload.file ? (
            <div className="w-full max-w-xl">
                <div className="mx-auto mb-5 w-fit">
                  <FileTypeIcon type={classifyFile(upload.file)} className="h-14 w-14" />
                </div>
                <h2 className="truncate text-xl font-semibold">{upload.file.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatBytes(upload.file.size)} · {upload.file.type || "tipo desconhecido"}
                </p>

                {upload.previewUrl ? (
                  <div className="mt-5 overflow-hidden rounded-lg border bg-background">
                    {upload.file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={upload.previewUrl} alt="Prévia do arquivo" className="max-h-72 w-full object-contain" />
                    ) : upload.file.type.startsWith("video/") ? (
                      <video src={upload.previewUrl} controls className="max-h-72 w-full" />
                    ) : (
                      <iframe src={upload.previewUrl} title="Prévia do PDF" className="h-72 w-full" />
                    )}
                  </div>
                ) : null}

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{upload.progress.percentage}%</span>
                  </div>
                  <Progress value={upload.progress.percentage} />
                  <div className="flex flex-wrap justify-center gap-2">
                    {upload.status === "uploading" ? (
                      <Button type="button" variant="destructive" size="sm" onClick={upload.cancelUpload}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        Cancelar
                      </Button>
                    ) : null}
                    {["error", "cancelled"].includes(upload.status) ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void upload.retryUpload()}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Tentar novamente
                      </Button>
                    ) : null}
                    <Button type="button" variant="ghost" size="sm" onClick={() => upload.selectFile(null)}>
                      Trocar arquivo
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileUp className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-semibold">Arraste seu material aqui</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  PDFs, imagens, ZIPs, vídeos, documentos, textos e código-fonte até 100 MB.
                </p>
                <Button type="button" className="mt-6" onClick={() => fileInputRef.current?.click()}>
                  Selecionar arquivo
                </Button>
              </div>
            )}
        </div>

        {upload.error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {upload.error}
          </div>
        ) : null}
        {upload.status === "completed" ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Material salvo com sucesso na sua biblioteca.
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">Metadados</h2>
          <p className="text-sm text-muted-foreground">Essas informações ajudam você a encontrar e compartilhar o material depois.</p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register("title")} placeholder="Ex: Lista de TypeScript" />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Explique o conteudo, contexto ou instrucoes para revisao."
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" {...form.register("tags")} placeholder="matemática, projeto, revisão" />
            <div className="flex flex-wrap gap-2">
              {sanitizeTags(form.watch("tags") ?? "").map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Visibilidade</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["private", "shared"] as const).map((visibility) => (
                <label
                  key={visibility}
                  className={cn(
                    "cursor-pointer rounded-md border p-3 text-sm transition hover:bg-muted",
                    selectedVisibility === visibility && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  <input type="radio" value={visibility} className="sr-only" {...form.register("visibility")} />
                  {visibility === "private" ? "Privado" : "Compartilhavel"}
                </label>
              ))}
            </div>
            {selectedVisibility === "shared" ? (
              <p className="rounded-md border bg-muted/60 p-3 text-xs text-muted-foreground">
                Arquivos compartilhaveis sao salvos no Vercel Blob e podem ser abertos ou baixados pelo link da sala.
              </p>
            ) : null}
          </fieldset>
        </div>

        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={!upload.file || upload.status === "uploading" || form.formState.isSubmitting}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Enviar material
        </Button>
      </section>
    </form>
  );
}

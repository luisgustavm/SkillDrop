"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadUploadButton } from "@/components/shared/download-upload-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { OpenUploadButton } from "@/components/shared/open-upload-button";
import { setFavorite } from "@/services/favorite-service";
import type { AcademicUpload, FileKind } from "@/types/upload";
import { formatRelativeDate } from "@/utils/date";
import { formatBytes } from "@/utils/file";
import { cn } from "@/lib/utils";

type RecentUploadsProps = {
  userId: string;
  uploads: AcademicUpload[];
  favoriteUploadIds: Set<string>;
};

export function RecentUploads({ userId, uploads, favoriteUploadIds }: RecentUploadsProps) {
  const [typeFilter, setTypeFilter] = useState<FileKind | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "private" | "shared">("all");
  const filteredUploads = useMemo(
    () =>
      uploads.filter((upload) => {
        const matchesType = typeFilter === "all" || upload.fileType === typeFilter;
        const matchesVisibility = visibilityFilter === "all" || upload.visibility === visibilityFilter;

        return matchesType && matchesVisibility;
      }),
    [typeFilter, uploads, visibilityFilter],
  );

  if (!uploads.length) {
    return (
      <EmptyState
        title="Nenhum envio ainda"
        description="Envie PDFs, códigos, imagens, vídeos ou ZIPs para organizar suas atividades."
        action={
          <Button asChild>
            <Link href="/uploads">Enviar arquivo</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Uploads recentes</h2>
            <p className="text-sm text-muted-foreground">Materiais recentes com tags, status e ações rápidas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as FileKind | "all")}
              className="h-9 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filtrar por tipo"
            >
              <option value="all">Todos os tipos</option>
              <option value="pdf">PDF</option>
              <option value="document">Documento</option>
              <option value="archive">ZIP</option>
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
              <option value="code">Código</option>
              <option value="link">Link</option>
            </select>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as "all" | "private" | "shared")}
              className="h-9 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filtrar por visibilidade"
            >
              <option value="all">Todas visibilidades</option>
              <option value="private">Privados</option>
              <option value="shared">Compartilhados</option>
            </select>
          </div>
        </div>
      </div>
      <div className="divide-y">
        {filteredUploads.length ? filteredUploads.map((upload) => {
          const isFavorite = favoriteUploadIds.has(upload.id);

          return (
            <div key={upload.id} className="flex flex-col gap-4 p-4 transition hover:bg-muted/45 sm:flex-row sm:items-center">
              <FileTypeIcon type={upload.fileType} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{upload.title}</p>
                  <Badge variant={upload.visibility === "shared" ? "default" : "muted"}>
                    {upload.visibility === "shared" ? "compartilhado" : "privado"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {upload.description || upload.fileName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{formatBytes(upload.size)}</span>
                  <span>{formatRelativeDate(upload.createdAt)}</span>
                  {upload.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  onClick={async () => {
                    await setFavorite(userId, upload.id, !isFavorite);
                    toast.success(isFavorite ? "Removido dos favoritos." : "Adicionado aos favoritos.");
                  }}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-brand-amber text-brand-amber")} aria-hidden="true" />
                </Button>
                <OpenUploadButton upload={upload} iconOnly />
                {upload.visibility === "shared" ? <DownloadUploadButton upload={upload} iconOnly /> : null}
              </div>
            </div>
          );
        }) : (
          <div className="p-4">
            <EmptyState title="Nada nesse filtro" description="Ajuste tipo, visibilidade ou busca para encontrar materiais." />
          </div>
        )}
      </div>
    </div>
  );
}

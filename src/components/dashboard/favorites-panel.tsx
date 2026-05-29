"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { openAcademicUpload } from "@/services/local-file-service";
import type { Favorite } from "@/types/favorite";
import type { AcademicUpload } from "@/types/upload";

type FavoritesPanelProps = {
  favorites: Favorite[];
  uploads: AcademicUpload[];
};

export function FavoritesPanel({ favorites, uploads }: FavoritesPanelProps) {
  const favoriteUploads = favorites
    .map((favorite) => uploads.find((upload) => upload.id === favorite.uploadId))
    .filter((upload): upload is AcademicUpload => Boolean(upload));

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">Favoritos</h2>
        <p className="text-sm text-muted-foreground">Materiais para acessar rápido.</p>
      </div>
      <div className="p-4">
        {favoriteUploads.length ? (
          <div className="space-y-3">
            {favoriteUploads.slice(0, 5).map((upload) => (
              <button
                key={upload.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-muted"
                onClick={() => {
                  void openAcademicUpload(upload).catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Não foi possível abrir o material.");
                  });
                }}
              >
                <FileTypeIcon type={upload.fileType} className="h-9 w-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{upload.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{upload.fileName}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            title="Sem favoritos"
            description="Marque uploads importantes para encontrá-los aqui."
            action={
              <Link href="/uploads" className="text-sm font-medium text-primary hover:underline">
                Ver uploads
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}

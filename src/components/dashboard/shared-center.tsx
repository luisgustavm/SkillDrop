"use client";

import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { DownloadUploadButton } from "@/components/shared/download-upload-button";
import { DeleteUploadButton } from "@/components/shared/delete-upload-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { OpenUploadButton } from "@/components/shared/open-upload-button";
import { QrShare } from "@/components/shared/qr-share";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { AcademicUpload } from "@/types/upload";
import { cn } from "@/lib/utils";

type SharedCenterProps = {
  roomId: string;
};

export function SharedCenter({ roomId }: SharedCenterProps) {
  const { user } = useAuth();
  const { uploads } = useDashboardData(user?.uid, roomId);
  const sharedUploads = uploads.filter((upload) => upload.visibility === "shared");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!selectedId && sharedUploads[0]) setSelectedId(sharedUploads[0].id);
  }, [selectedId, sharedUploads]);

  const selectedUpload = useMemo<AcademicUpload | null>(
    () => sharedUploads.find((upload) => upload.id === selectedId) ?? sharedUploads[0] ?? null,
    [selectedId, sharedUploads],
  );

  if (!sharedUploads.length) {
    return (
      <EmptyState
        icon={Share2}
        title="Nada compartilhado"
        description="Envie um material com visibilidade compartilhável para gerar link e QR Code."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="rounded-lg border bg-card">
        <div className="border-b p-5">
          <h1 className="text-xl font-semibold tracking-normal">Central de compartilhamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Links e QR Codes para apresentar ou revisar materiais compartilháveis.</p>
        </div>
        <div className="divide-y">
          {sharedUploads.map((upload) => (
            <button
              key={upload.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted",
                selectedUpload?.id === upload.id && "bg-primary/10",
              )}
              onClick={() => setSelectedId(upload.id)}
            >
              <FileTypeIcon type={upload.fileType} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium">{upload.title}</p>
                  {upload.storageProvider === "browser" ? <Badge variant="muted">local antigo</Badge> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{upload.fileName}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold">Link e QR Code</h2>
        {selectedUpload && origin ? <QrShare url={`${origin}/share/${selectedUpload.shareId}`} /> : null}
        {selectedUpload ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <OpenUploadButton upload={selectedUpload} label="Abrir" className="w-full" />
            <DownloadUploadButton upload={selectedUpload} className="w-full" />
            <DeleteUploadButton upload={selectedUpload} label="Excluir" className="w-full" onDeleted={() => setSelectedId(null)} />
          </div>
        ) : null}
        {selectedUpload?.storageProvider === "browser" ? (
          <p className="text-xs text-muted-foreground">
            Este material foi enviado antes do modo baixavel. Se o arquivo nao abrir aqui, reenvie como compartilhavel ate 640 KB ou salve um link externo.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

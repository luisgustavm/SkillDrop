"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { QrShare } from "@/components/shared/qr-share";
import { OpenUploadButton } from "@/components/shared/open-upload-button";
import { DownloadUploadButton } from "@/components/shared/download-upload-button";
import { isFirebaseConfigured } from "@/firebase/client";
import { listenSharedUploadByShareId } from "@/services/upload-service";
import type { AcademicUpload } from "@/types/upload";
import { formatRelativeDate } from "@/utils/date";
import { formatBytes } from "@/utils/file";

export function ShareViewer({ shareId }: { shareId: string }) {
  const [upload, setUpload] = useState<AcademicUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setError("Firebase não está configurado.");
      return;
    }

    return listenSharedUploadByShareId(
      shareId,
      (item) => {
        setUpload(item);
        setLoading(false);
      },
      (shareError) => {
        setError(shareError.message);
        setLoading(false);
      },
    );
  }, [shareId]);

  if (loading) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Carregando compartilhamento...</div>;
  }

  if (error) return <ErrorState message={error} />;

  if (!upload) {
    return <EmptyState title="Link indisponível" description="Este material não existe ou não está compartilhado." />;
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <FileTypeIcon type={upload.fileType} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">{upload.title}</h1>
            <Badge>compartilhado</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{upload.description || upload.fileName}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{formatBytes(upload.size)}</span>
            <span>{formatRelativeDate(upload.createdAt)}</span>
            {upload.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <OpenUploadButton upload={upload} />
          <DownloadUploadButton upload={upload} />
        </div>
      </div>
      {upload.storageProvider === "browser" ? (
        <p className="mt-4 rounded-md border bg-muted/60 p-3 text-sm text-muted-foreground">
<<<<<<< HEAD
          Este material está disponível no dispositivo de envio. Para acesso em outros dispositivos, prefira compartilhar links externos.
=======
          Este arquivo foi salvo gratuitamente no navegador de quem enviou. O link compartilha os metadados; o arquivo abre apenas nesse mesmo navegador.
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
        </p>
      ) : null}
      {shareUrl ? <div className="mt-6"><QrShare url={shareUrl} /></div> : null}
    </section>
  );
}

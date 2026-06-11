"use client";

import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { ErrorState } from "@/components/shared/error-state";
import { CommentsPanel } from "@/components/upload/comments-panel";
import { LinkSubmissionForm } from "@/components/upload/link-submission-form";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUiStore } from "@/store/ui-store";

type UploadPageProps = {
  roomId: string;
};

export function UploadPage({ roomId }: UploadPageProps) {
  const { user, profile } = useAuth();
  const { uploads, favorites, error } = useDashboardData(user?.uid, roomId);
  const search = useDebouncedValue(useUiStore((state) => state.globalSearch), 180).trim().toLowerCase();
  const favoriteIds = new Set(favorites.map((favorite) => favorite.uploadId));
  const filteredUploads = uploads.filter((upload) => {
    if (!search) return true;

    return [upload.title, upload.description, upload.fileName, upload.fileType, ...upload.tags]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-primary">Organização de materiais</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">Enviar material</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Adicione arquivos, links, tags e observações para manter suas entregas fáceis de encontrar.
        </p>
      </section>

      {error ? <ErrorState message={error} /> : null}
      <UploadDropzone userId={user?.uid ?? ""} roomId={roomId} />
      <LinkSubmissionForm userId={user?.uid ?? ""} roomId={roomId} />
      <RecentUploads userId={user?.uid ?? ""} roomId={roomId} uploads={filteredUploads} favoriteUploadIds={favoriteIds} />
      <CommentsPanel userId={user?.uid ?? ""} profile={profile} uploads={filteredUploads} />
    </div>
  );
}

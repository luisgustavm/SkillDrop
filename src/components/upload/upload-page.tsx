"use client";

import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { ErrorState } from "@/components/shared/error-state";
import { CommentsPanel } from "@/components/upload/comments-panel";
import { LinkSubmissionForm } from "@/components/upload/link-submission-form";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function UploadPage() {
  const { user, profile } = useAuth();
  const { uploads, favorites, error } = useDashboardData(user?.uid);
  const favoriteIds = new Set(favorites.map((favorite) => favorite.uploadId));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-primary">Upload inteligente</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">Enviar atividade</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Validação, prévia, progresso, cancelamento e metadados persistidos no Firebase.
        </p>
      </section>

      {error ? <ErrorState message={error} /> : null}
      <UploadDropzone userId={user?.uid ?? ""} />
      <LinkSubmissionForm userId={user?.uid ?? ""} />
      <RecentUploads userId={user?.uid ?? ""} uploads={uploads} favoriteUploadIds={favoriteIds} />
      <CommentsPanel userId={user?.uid ?? ""} profile={profile} uploads={uploads} />
    </div>
  );
}

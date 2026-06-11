"use client";

import { MessageSquare, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { createComment, listenComments } from "@/services/comment-service";
import type { Comment } from "@/types/comment";
import type { AcademicUpload } from "@/types/upload";
import type { SkillDropUser } from "@/types/user";
import { formatRelativeDate } from "@/utils/date";
import { cn } from "@/lib/utils";

type CommentsPanelProps = {
  userId: string;
  profile: SkillDropUser | null;
  uploads: AcademicUpload[];
};

export function CommentsPanel({ userId, profile, uploads }: CommentsPanelProps) {
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(uploads[0]?.id ?? null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUploadId && uploads[0]) setSelectedUploadId(uploads[0].id);
  }, [selectedUploadId, uploads]);

  useEffect(() => {
    if (!selectedUploadId) return;

    return listenComments(selectedUploadId, setComments, (commentError) => setError(commentError.message));
  }, [selectedUploadId]);

  const selectedUpload = useMemo(
    () => uploads.find((upload) => upload.id === selectedUploadId) ?? null,
    [selectedUploadId, uploads],
  );

  const submitComment = async () => {
    if (!selectedUpload || !content.trim()) return;

    try {
      await createComment({
        userId,
        roomId: selectedUpload.roomId,
        uploadId: selectedUpload.id,
        authorName: profile?.name ?? "Estudante",
        authorAvatar: profile?.avatar ?? null,
        content,
      });
      setContent("");
      toast.success("Comentário publicado.");
    } catch (commentError) {
      toast.error(commentError instanceof Error ? commentError.message : "Erro ao comentar.");
    }
  };

  if (!uploads.length) {
    return <EmptyState icon={MessageSquare} title="Comentários aguardando uploads" description="Envie um material para iniciar uma conversa sobre ele." />;
  }

  return (
    <section className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-[280px_1fr]">
      <div>
        <h2 className="text-base font-semibold">Comentários</h2>
        <p className="mt-1 text-sm text-muted-foreground">Converse sobre cada entrega.</p>
        <div className="mt-4 space-y-2">
          {uploads.slice(0, 8).map((upload) => (
            <button
              key={upload.id}
              type="button"
              className={cn(
                "w-full rounded-md border p-3 text-left text-sm transition hover:bg-muted",
                selectedUpload?.id === upload.id && "border-primary bg-primary/10 text-primary",
              )}
              onClick={() => setSelectedUploadId(upload.id)}
            >
              <span className="line-clamp-1 font-medium">{upload.title}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{upload.fileName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-96 flex-col">
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto rounded-lg border bg-background p-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {comments.length ? (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-md border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeDate(comment.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{comment.content}</p>
              </div>
            ))
          ) : (
            <EmptyState icon={MessageSquare} title="Sem comentários" description="Adicione observações, feedbacks ou instruções." />
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Escreva um comentário sobre este envio..."
            className="min-h-20 flex-1 resize-none"
          />
          <Button type="button" className="sm:self-end" disabled={!content.trim()} onClick={() => void submitComment()}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Publicar
          </Button>
        </div>
      </div>
    </section>
  );
}

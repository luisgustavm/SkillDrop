"use client";

import {
  Download,
  FileText,
  Globe2,
  ImagePlus,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  ShieldCheck,
  SmilePlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeFileName } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  createGlobalChatAttachment,
  listenGlobalMessages,
  MAX_GLOBAL_CHAT_ATTACHMENT_BYTES,
  sendGlobalMessage,
} from "@/services/global-chat-service";
import type { GlobalChatAttachment, GlobalChatMessage } from "@/types/chat";
import { formatRelativeDate } from "@/utils/date";
import { formatBytes } from "@/utils/file";

const emojiOptions = ["😀", "😂", "😍", "😎", "🔥", "✨", "👏", "🙏", "💡", "✅", "📚", "💻", "🚀", "🎯", "🧠", "⭐"];
const attachmentAccept = "image/*,.pdf,.doc,.docx,.zip,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.cs,.html,.css,.sql,.json";

export function GlobalChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<GlobalChatAttachment | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoading(true);

    return listenGlobalMessages(
      (items) => {
        setMessages(items);
        setLoading(false);
      },
      (chatError) => {
        setError(chatError.message);
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = async () => {
    const trimmedContent = content.trim();
    if ((!trimmedContent && !attachment) || !user) return;

    setSending(true);
    setError(null);

    try {
      await sendGlobalMessage({
        userId: user.uid,
        authorName: profile?.name ?? user.displayName ?? "Estudante",
        authorAvatar: profile?.avatar ?? user.photoURL ?? null,
        content: trimmedContent,
        attachment,
      });
      setContent("");
      setAttachment(null);
      setEmojiOpen(false);
    } catch (chatError) {
      const message = chatError instanceof Error ? chatError.message : "Não foi possível enviar a mensagem.";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const nextContent = `${content.slice(0, start)}${emoji}${content.slice(end)}`;

    setContent(nextContent);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const selectAttachment = async (file: File | undefined) => {
    if (!file) return;

    setPreparingAttachment(true);
    setError(null);

    try {
      const nextAttachment = await createGlobalChatAttachment(file);
      setAttachment(nextAttachment);
      toast.success("Anexo pronto para enviar.");
    } catch (attachmentError) {
      const message = attachmentError instanceof Error ? attachmentError.message : "Não foi possível anexar o arquivo.";
      setError(message);
      toast.error(message);
    } finally {
      setPreparingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-128px)] gap-6 xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Chat global</h2>
              <p className="text-sm text-muted-foreground">Converse com todos os estudantes conectados ao SkillDrop.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? <GlobalChatSkeleton /> : null}

          {!loading && !messages.length ? (
            <EmptyState
              icon={Globe2}
              title="Nenhuma mensagem ainda"
              description="Envie a primeira mensagem para abrir a conversa da turma."
            />
          ) : null}

          {messages.map((message) => (
            <GlobalMessageBubble key={message.id} message={message} mine={message.userId === user?.uid} />
          ))}
          <div ref={endRef} />
        </div>

        {error ? (
          <div className="border-t p-3">
            <ErrorState message={error} className="p-3" />
          </div>
        ) : null}

        <div className="border-t p-4">
          {attachment ? <PendingAttachment attachment={attachment} onRemove={() => setAttachment(null)} /> : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Button type="button" variant="outline" size="icon" title="Adicionar emoji" onClick={() => setEmojiOpen((value) => !value)}>
                    <SmilePlus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {emojiOpen ? (
                    <div className="absolute bottom-12 left-0 z-20 grid w-56 grid-cols-8 gap-1 rounded-lg border bg-popover p-2 shadow-lg">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-base transition hover:bg-muted"
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Anexar foto ou arquivo"
                  disabled={preparingAttachment}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preparingAttachment ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Paperclip className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={attachmentAccept}
                  className="hidden"
                  onChange={(event) => void selectAttachment(event.target.files?.[0])}
                />
              </div>

              <Textarea
                ref={textareaRef}
                value={content}
                maxLength={1000}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Escreva uma mensagem para o chat global..."
                className="min-h-16 resize-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    void submit();
                  }
                }}
              />
            </div>
            <Button type="button" disabled={sending || preparingAttachment || (!content.trim() && !attachment)} onClick={() => void submit()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Enviar
            </Button>
          </div>
          <p className="mt-2 text-right text-xs text-muted-foreground">{content.length}/1000</p>
        </div>
      </div>

      <aside className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Comunidade</h2>
            <p className="text-sm text-muted-foreground">Mensagens em tempo real via Firestore.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm text-muted-foreground">
          <p>Seu nome aparece junto da mensagem para manter a conversa clara.</p>
          <p>As regras do Firestore bloqueiam envio em nome de outro usuário.</p>
          <p>Fotos e arquivos pequenos podem ser enviados com limite de {formatBytes(MAX_GLOBAL_CHAT_ATTACHMENT_BYTES)} por mensagem.</p>
          <p>Mensagens antigas ficam limitadas para manter a tela rápida.</p>
        </div>
      </aside>
    </section>
  );
}

function GlobalMessageBubble({ message, mine }: { message: GlobalChatMessage; mine: boolean }) {
  return (
    <div className={cn("flex gap-3", mine && "justify-end")}>
      {!mine ? <UserAvatar src={message.authorAvatar} name={message.authorName} /> : null}
      <div
        className={cn(
          "max-w-[88%] rounded-lg border p-3 text-sm leading-6",
          mine ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        <div className={cn("mb-1 flex flex-wrap items-center gap-2 text-xs", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
          <span className="font-medium">{mine ? "Você" : message.authorName}</span>
          <span>{formatRelativeDate(message.createdAt)}</span>
        </div>
        {message.content ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
        {message.attachment ? <MessageAttachment attachment={message.attachment} mine={mine} /> : null}
      </div>
      {mine ? <UserAvatar src={message.authorAvatar} name={message.authorName} /> : null}
    </div>
  );
}

function downloadAttachment(attachment: GlobalChatAttachment) {
  const anchor = document.createElement("a");
  anchor.href = attachment.dataUrl;
  anchor.download = sanitizeFileName(attachment.name) || "skilldrop-anexo";
  anchor.click();
}

function PendingAttachment({ attachment, onRemove }: { attachment: GlobalChatAttachment; onRemove: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <AttachmentIcon attachment={attachment} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" title="Remover anexo" onClick={onRemove}>
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function MessageAttachment({ attachment, mine }: { attachment: GlobalChatAttachment; mine: boolean }) {
  if (attachment.kind === "image") {
    return (
      <button
        type="button"
        className="mt-3 block overflow-hidden rounded-lg border bg-background text-left"
        title="Baixar imagem"
        onClick={() => downloadAttachment(attachment)}
      >
        <span
          role="img"
          aria-label={attachment.name}
          className="block h-56 w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${attachment.dataUrl}")` }}
        />
        <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {attachment.name} · {formatBytes(attachment.size)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "mt-3 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-muted",
        mine ? "bg-background text-foreground" : "bg-muted/50",
      )}
      onClick={() => downloadAttachment(attachment)}
    >
      <AttachmentIcon attachment={attachment} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        <span className="block text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
      </span>
      <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function AttachmentIcon({ attachment }: { attachment: GlobalChatAttachment }) {
  const Icon = attachment.kind === "image" ? ImagePlus : FileText;

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function GlobalChatSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className={cn("flex gap-3", item % 2 === 1 && "justify-end")}>
          {item % 2 === 0 ? <Skeleton className="h-10 w-10 rounded-md" /> : null}
          <div className="w-full max-w-md rounded-lg border p-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
          {item % 2 === 1 ? <Skeleton className="h-10 w-10 rounded-md" /> : null}
        </div>
      ))}
    </div>
  );
}

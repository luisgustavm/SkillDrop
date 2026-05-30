"use client";

import {
  Copy,
  DoorOpen,
  Download,
  FileText,
  Hash,
  ImagePlus,
  Link2,
  Loader2,
  LockKeyhole,
  MessagesSquare,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeFileName } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  createPrivateRoom,
  joinPrivateRoom,
  listenRoomMessages,
  listenUserRooms,
  normalizeRoomCode,
  sendRoomMessage,
} from "@/services/room-service";
import {
  createDemoRoom,
  joinDemoRoom,
  listDemoRoomMessages,
  listDemoRooms,
  sendDemoRoomMessage,
} from "@/services/demo-room-service";
import { createGlobalChatAttachment, MAX_GLOBAL_CHAT_ATTACHMENT_BYTES } from "@/services/global-chat-service";
import type { GlobalChatAttachment, PrivateRoom, RoomMessage } from "@/types/chat";
import { formatRelativeDate } from "@/utils/date";
import { formatBytes } from "@/utils/file";

const attachmentAccept = "image/*,.pdf,.doc,.docx,.zip,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.cs,.html,.css,.sql,.json";

export function GlobalChat() {
  const { user, profile, firebaseReady, testMode } = useAuth();
  const [rooms, setRooms] = useState<PrivateRoom[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("Sala de estudos");
  const [joinCode, setJoinCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [handledInviteCode, setHandledInviteCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<GlobalChatAttachment | null>(null);
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );
  const activeInviteUrl = activeRoom && origin ? `${origin}/rooms?room=${activeRoom.code}` : "";
  const refreshDemoRooms = useCallback(() => {
    if (!user) return;

    setRooms(listDemoRooms(user.uid));
  }, [user]);

  const selectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setError(null);
    setContent("");
    setAttachment(null);

    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("room", roomId);
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  const joinRoomByCode = useCallback(
    async (rawCode: string, silent = false) => {
      if (!user) return;

      const code = normalizeRoomCode(rawCode);
      if (!code) return;

      setJoining(true);
      setError(null);

      try {
        const joinedCode = firebaseReady ? await joinPrivateRoom({ userId: user.uid, code }) : joinDemoRoom(user.uid, code);
        if (!firebaseReady) refreshDemoRooms();
        selectRoom(joinedCode);
        setJoinCode("");
        if (!silent) toast.success("Você entrou na sala.");
      } catch (joinError) {
        const message = joinError instanceof Error ? joinError.message : "Não foi possível entrar na sala.";
        setError(message);
        toast.error(message);
      } finally {
        setJoining(false);
      }
    },
    [firebaseReady, refreshDemoRooms, selectRoom, user],
  );

  useEffect(() => {
    setOrigin(window.location.origin);
    const code = normalizeRoomCode(new URLSearchParams(window.location.search).get("room") ?? "");
    if (code) {
      setInviteCode(code);
      setJoinCode(code);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);

    if (!firebaseReady) {
      setRooms(listDemoRooms(user.uid));
      setLoadingRooms(false);
      return;
    }

    return listenUserRooms(
      user.uid,
      (items) => {
        setRooms(items);
        setLoadingRooms(false);
      },
      (roomsError) => {
        setError(roomsError.message);
        setLoadingRooms(false);
      },
    );
  }, [firebaseReady, user?.uid]);

  useEffect(() => {
    if (!user || !inviteCode || handledInviteCode === inviteCode) return;

    setHandledInviteCode(inviteCode);
    void joinRoomByCode(inviteCode, true);
  }, [handledInviteCode, inviteCode, joinRoomByCode, user]);

  useEffect(() => {
    if (activeRoomId && rooms.some((room) => room.id === activeRoomId)) return;
    if (inviteCode && rooms.some((room) => room.id === inviteCode)) {
      setActiveRoomId(inviteCode);
      return;
    }
    if (!activeRoomId && rooms[0]) setActiveRoomId(rooms[0].id);
  }, [activeRoomId, inviteCode, rooms]);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    if (!firebaseReady) {
      setMessages(listDemoRoomMessages(activeRoomId));
      setLoadingMessages(false);
      return;
    }

    return listenRoomMessages(
      activeRoomId,
      (items) => {
        setMessages(items);
        setLoadingMessages(false);
      },
      (messagesError) => {
        setError(messagesError.message);
        setLoadingMessages(false);
      },
    );
  }, [activeRoomId, firebaseReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const createRoom = async () => {
    if (!user) return;

    setCreating(true);
    setError(null);

    try {
      const roomInput = {
        userId: user.uid,
        ownerName: profile?.name ?? user.displayName ?? "Estudante",
        name: roomName,
      };
      const code = firebaseReady ? await createPrivateRoom(roomInput) : createDemoRoom(roomInput);
      if (!firebaseReady) refreshDemoRooms();
      setRoomName("Sala de estudos");
      selectRoom(code);
      toast.success(testMode ? "Sala de teste criada." : "Sala privada criada.");
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Não foi possível criar a sala.";
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const submitMessage = async () => {
    const trimmedContent = content.trim();
    if ((!trimmedContent && !attachment) || !user || !activeRoom) return;

    setSending(true);
    setError(null);

    try {
      const messageInput = {
        userId: user.uid,
        authorName: profile?.name ?? user.displayName ?? "Estudante",
        authorAvatar: profile?.avatar ?? user.photoURL ?? null,
        content: trimmedContent,
        attachment,
      };
      if (firebaseReady) {
        await sendRoomMessage(activeRoom.id, messageInput);
      } else {
        sendDemoRoomMessage(activeRoom.id, messageInput);
        refreshDemoRooms();
        setMessages(listDemoRoomMessages(activeRoom.id));
      }
      setContent("");
      setAttachment(null);
    } catch (messageError) {
      const message = messageError instanceof Error ? messageError.message : "Não foi possível enviar a mensagem.";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
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

  const copyText = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  };

  return (
    <section className="grid min-h-[calc(100vh-128px)] gap-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
      <aside className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-semibold">Salas privadas</h1>
            <p className="text-sm text-muted-foreground">Crie uma sala ou entre usando um código de convite.</p>
            {testMode ? <Badge variant="secondary" className="mt-2">modo teste local</Badge> : null}
          </div>
        </div>

        <form
          className="space-y-2 rounded-lg border bg-background p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void createRoom();
          }}
        >
          <p className="text-sm font-medium">Nova sala</p>
          <Input
            value={roomName}
            maxLength={80}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Ex: Turma DS 2026"
          />
          <Button type="submit" className="w-full" disabled={creating || !roomName.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            Criar sala
          </Button>
        </form>

        <form
          className="space-y-2 rounded-lg border bg-background p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void joinRoomByCode(joinCode);
          }}
        >
          <p className="text-sm font-medium">Entrar por código</p>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={joinCode}
              maxLength={8}
              onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
              placeholder="CODIGO"
              className="pl-9 uppercase"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={joining || normalizeRoomCode(joinCode).length !== 8}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DoorOpen className="h-4 w-4" aria-hidden="true" />}
            Entrar na sala
          </Button>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Minhas salas</p>
            <Badge variant="muted">{rooms.length}</Badge>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {loadingRooms ? <RoomListSkeleton /> : null}
            {!loadingRooms && !rooms.length ? (
              <EmptyState
                icon={MessagesSquare}
                title="Nenhuma sala"
                description="Crie uma sala privada para sua turma ou entre com um código."
                className="min-h-40"
              />
            ) : null}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={cn(
                  "w-full rounded-md border p-3 text-left transition hover:bg-muted",
                  activeRoom?.id === room.id && "border-primary bg-primary/10",
                )}
                onClick={() => selectRoom(room.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{room.name}</span>
                  <span className="text-xs text-muted-foreground">{room.memberCount}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {room.lastMessageText ? `${room.lastMessageAuthorName}: ${room.lastMessageText}` : `Código ${room.code}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border bg-card">
        {activeRoom ? (
          <>
            <div className="border-b p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold">{activeRoom.name}</h2>
                    <Badge variant="secondary">{activeRoom.code}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sala privada com {activeRoom.memberCount} participante{activeRoom.memberCount === 1 ? "" : "s"}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyText(activeRoom.code, "Código copiado.")}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Código
                  </Button>
                  {activeInviteUrl ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => void copyText(activeInviteUrl, "Link de convite copiado.")}>
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                      Link
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
              {loadingMessages ? <MessageSkeleton /> : null}
              {!loadingMessages && !messages.length ? (
                <EmptyState
                  icon={LockKeyhole}
                  title="Conversa privada pronta"
                  description="Compartilhe o código ou o link da sala para começar a conversa."
                />
              ) : null}
              {messages.map((message) => (
                <RoomMessageBubble key={message.id} message={message} mine={message.userId === user?.uid} />
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
                    <p className="text-xs text-muted-foreground">Anexos de até {formatBytes(MAX_GLOBAL_CHAT_ATTACHMENT_BYTES)}.</p>
                  </div>
                  <Textarea
                    value={content}
                    maxLength={1000}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Escreva uma mensagem para a sala..."
                    className="min-h-16 resize-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        void submitMessage();
                      }
                    }}
                  />
                </div>
                <Button type="button" disabled={sending || preparingAttachment || (!content.trim() && !attachment)} onClick={() => void submitMessage()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  Enviar
                </Button>
              </div>
              <p className="mt-2 text-right text-xs text-muted-foreground">{content.length}/1000</p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessagesSquare}
              title="Escolha uma sala"
              description="Crie uma sala privada ou entre por código para liberar a conversa."
            />
          </div>
        )}
      </div>

      <aside className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Convite seguro</h2>
            <p className="text-sm text-muted-foreground">A entrada acontece por código ou link.</p>
          </div>
        </div>

        {activeRoom ? (
          <div className="space-y-3 rounded-lg border bg-background p-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Código da sala</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-normal">{activeRoom.code}</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => void copyText(activeRoom.code, "Código copiado.")}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar código
            </Button>
            {activeInviteUrl ? (
              <Button type="button" className="w-full" onClick={() => void copyText(activeInviteUrl, "Link de convite copiado.")}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Copiar link
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Somente quem tem o código ou link consegue entrar na sala.</p>
          </div>
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>As mensagens ficam separadas por sala e só aparecem para participantes.</p>
          </div>
          <div className="flex gap-3">
            <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Anexos pequenos podem ser enviados junto da conversa.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

function RoomMessageBubble({ message, mine }: { message: RoomMessage; mine: boolean }) {
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

function RoomListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-md border p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-44" />
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
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

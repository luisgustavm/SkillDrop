"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Crown,
  DoorOpen,
  Download,
  FileText,
  Hash,
  ImagePlus,
  Link2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  UserCheck,
  UserX,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmCard } from "@/components/shared/delete-confirm-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeFileName } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  approveRoomJoinRequest,
  createPrivateRoom,
  deletePrivateRoom,
  listenRoomDirectMessages,
  listenRoomMessages,
  listenUserRooms,
  normalizeRoomCode,
  rejectRoomJoinRequest,
  requestJoinPrivateRoom,
  sendRoomDirectMessage,
  sendRoomMessage,
} from "@/services/room-service";
import { createGlobalChatAttachment, MAX_GLOBAL_CHAT_ATTACHMENT_BYTES } from "@/services/global-chat-service";
import type { GlobalChatAttachment, PrivateRoom, RoomDirectMessage, RoomMemberProfile, RoomMessage } from "@/types/chat";
import { formatRelativeDate } from "@/utils/date";
import { formatBytes } from "@/utils/file";

const attachmentAccept = "image/*,.pdf,.doc,.docx,.zip,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.cs,.html,.css,.sql,.json";

type GlobalChatProps = {
  initialRoomId?: string | null;
  lobbyOnly?: boolean;
};

export function GlobalChat({ initialRoomId = null, lobbyOnly = false }: GlobalChatProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const normalizedInitialRoomId = initialRoomId ? normalizeRoomCode(initialRoomId) : null;
  const [rooms, setRooms] = useState<PrivateRoom[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(normalizedInitialRoomId);
  const [roomName, setRoomName] = useState("Sala de estudos");
  const [joinCode, setJoinCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [content, setContent] = useState("");
  const [privateContent, setPrivateContent] = useState("");
  const [attachment, setAttachment] = useState<GlobalChatAttachment | null>(null);
  const [selectedPrivateMember, setSelectedPrivateMember] = useState<RoomMemberProfile | null>(null);
  const [privateMessages, setPrivateMessages] = useState<RoomDirectMessage[]>([]);
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingPrivate, setSendingPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const privateEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );
  const activeMessageRoomId = activeRoom?.id ?? null;
  const activeRoomOwner = Boolean(activeRoom && user?.uid === activeRoom.ownerId);
  const activeInviteUrl = activeRoom && origin ? `${origin}/rooms?room=${activeRoom.code}` : "";
  const roomUnavailable = Boolean(normalizedInitialRoomId && !loadingRooms && !activeRoom);
  const roomMembers = activeRoom?.memberProfiles ?? [];
  const selectRoom = useCallback(
    (roomId: string) => {
      if (lobbyOnly) {
        router.push(`/rooms/${encodeURIComponent(roomId)}`);
        return;
      }

      if (normalizedInitialRoomId) {
        router.push(`/rooms/${encodeURIComponent(roomId)}`);
        return;
      }

      setActiveRoomId(roomId);
      setError(null);
      setContent("");
      setAttachment(null);
      setSelectedPrivateMember(null);
      setPrivateContent("");
      setPrivateMessages([]);
    },
    [lobbyOnly, normalizedInitialRoomId, router],
  );

  const requestRoomAccess = useCallback(
    async (rawCode: string, silent = false) => {
      if (!user) return;

      const code = normalizeRoomCode(rawCode);
      if (!code) return;

      setJoining(true);
      setError(null);

      try {
        const userName = profile?.name ?? user.displayName ?? "Estudante";
        const userAvatar = profile?.avatar ?? user.photoURL ?? null;
        const result = await requestJoinPrivateRoom({ userId: user.uid, userName, userAvatar, code });
        setJoinCode("");
        if (result.status === "already-member") {
          if (!silent) toast.info("Você já participa dessa sala. Use a lista lateral para entrar.");
          return;
        }

        if (!silent) toast.success("Pedido enviado. Aguarde a aprovação do admin.");
      } catch (joinError) {
        const message = joinError instanceof Error ? joinError.message : "Não foi possível enviar o pedido.";
        setError(message);
        toast.error(message);
      } finally {
        setJoining(false);
      }
    },
    [profile, user],
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
    if (normalizedInitialRoomId) {
      setActiveRoomId(normalizedInitialRoomId);
      return;
    }

    if (lobbyOnly) setActiveRoomId(null);
  }, [lobbyOnly, normalizedInitialRoomId]);

  useEffect(() => {
    if (!user?.uid) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);

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
  }, [user?.uid]);

  useEffect(() => {
    if (loadingRooms || normalizedInitialRoomId) return;
    if (activeRoomId && rooms.some((room) => room.id === activeRoomId)) return;
    if (activeRoomId) setActiveRoomId(null);
  }, [activeRoomId, loadingRooms, normalizedInitialRoomId, rooms]);

  useEffect(() => {
    if (!activeMessageRoomId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);

    return listenRoomMessages(
      activeMessageRoomId,
      (items) => {
        setMessages(items);
        setLoadingMessages(false);
      },
      (messagesError) => {
        setError(messagesError.message);
        setLoadingMessages(false);
      },
    );
  }, [activeMessageRoomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    privateEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [privateMessages]);

  useEffect(() => {
    if (!activeRoom || !selectedPrivateMember) return;
    if (!activeRoom.memberIds.includes(selectedPrivateMember.userId)) {
      setSelectedPrivateMember(null);
      setPrivateContent("");
      setPrivateMessages([]);
    }
  }, [activeRoom, selectedPrivateMember]);

  useEffect(() => {
    if (!activeRoom?.id || !user?.uid || !selectedPrivateMember) {
      setPrivateMessages([]);
      setLoadingPrivateMessages(false);
      return;
    }

    setLoadingPrivateMessages(true);

    return listenRoomDirectMessages(
      {
        roomId: activeRoom.id,
        currentUserId: user.uid,
        peerUserId: selectedPrivateMember.userId,
      },
      (items) => {
        setPrivateMessages(items);
        setLoadingPrivateMessages(false);
      },
      (privateError) => {
        setError(privateError.message);
        setLoadingPrivateMessages(false);
      },
    );
  }, [activeRoom?.id, selectedPrivateMember, user?.uid]);

  const createRoom = async () => {
    if (!user) return;

    setCreating(true);
    setError(null);

    try {
      const roomInput = {
        userId: user.uid,
        ownerName: profile?.name ?? user.displayName ?? "Estudante",
        ownerAvatar: profile?.avatar ?? user.photoURL ?? null,
        name: roomName,
      };
      const code = await createPrivateRoom(roomInput);
      setRoomName("Sala de estudos");
      toast.success(`Sala privada criada: ${code}`);
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
      await sendRoomMessage(activeRoom.id, messageInput);
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

  const reviewRequest = async (requestUserId: string, action: "approve" | "reject") => {
    if (!activeRoom) return;

    setReviewingRequestId(requestUserId);
    setError(null);

    try {
      if (action === "approve") {
        await approveRoomJoinRequest({ roomId: activeRoom.id, requestUserId });
      } else {
        await rejectRoomJoinRequest({ roomId: activeRoom.id, requestUserId });
      }
      toast.success(action === "approve" ? "Entrada aprovada." : "Pedido recusado.");
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : "Não foi possível revisar o pedido.";
      setError(message);
      toast.error(message);
    } finally {
      setReviewingRequestId(null);
    }
  };

  const submitPrivateMessage = async () => {
    const trimmedContent = privateContent.trim();
    if (!trimmedContent || !user || !activeRoom || !selectedPrivateMember) return;

    setSendingPrivate(true);
    setError(null);

    try {
      await sendRoomDirectMessage({
        roomId: activeRoom.id,
        currentUserId: user.uid,
        peerUserId: selectedPrivateMember.userId,
        authorName: profile?.name ?? user.displayName ?? "Estudante",
        authorAvatar: profile?.avatar ?? user.photoURL ?? null,
        peerName: selectedPrivateMember.name,
        peerAvatar: selectedPrivateMember.avatar,
        content: trimmedContent,
      });
      setPrivateContent("");
    } catch (messageError) {
      const message = messageError instanceof Error ? messageError.message : "Nao foi possivel enviar a mensagem privada.";
      setError(message);
      toast.error(message);
    } finally {
      setSendingPrivate(false);
    }
  };

  const removeRoom = async (room: PrivateRoom) => {
    if (!user || user.uid !== room.ownerId) return;

    setDeletingRoomId(room.id);
    setError(null);

    try {
      await deletePrivateRoom(room.id);

      if (activeRoomId === room.id) {
        setActiveRoomId(null);
        setMessages([]);
        router.replace("/rooms");
      }
      toast.success("Sala excluida.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir a sala.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingRoomId(null);
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
            <p className="text-sm text-muted-foreground">Salas aprovadas pelo admin aparecem aqui.</p>
          </div>
        </div>

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
              <article
                key={room.id}
                className={cn(
                  "rounded-md border p-3 transition",
                  activeRoom?.id === room.id && "border-primary bg-primary/10",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{room.name}</span>
                  <span className="text-xs text-muted-foreground">{room.memberCount}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {room.lastMessageText ? `${room.lastMessageAuthorName}: ${room.lastMessageText}` : `Código ${room.code}`}
                </p>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <Button type="button" size="sm" variant={activeRoom?.id === room.id ? "default" : "outline"} onClick={() => selectRoom(room.id)}>
                    <DoorOpen className="h-4 w-4" aria-hidden="true" />
                    Entrar
                  </Button>
                  {room.ownerId === user?.uid ? (
                    <DeleteConfirmCard
                      title="Excluir sala"
                      description={`A sala "${room.name}" sera apagada. Todos os participantes perderao o acesso e as conversas desta sala deixarao de aparecer.`}
                      confirmLabel="Excluir sala"
                      triggerTitle="Excluir sala"
                      iconOnly
                      loading={deletingRoomId === room.id}
                      onConfirm={() => removeRoom(room)}
                    />
                  ) : null}
                </div>
              </article>
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
        ) : roomUnavailable ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
              <EmptyState
                icon={LockKeyhole}
                title="Sala indisponivel"
                description="Essa sala ainda nao esta liberada para sua conta. Entre pelo codigo no lobby e aguarde a aprovacao do admin."
              />
              <Button asChild className="mt-4">
                <Link href="/rooms">Voltar para minhas salas</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-xl space-y-5">
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Hash className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-normal">Entrar em uma sala privada</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Digite o código da sala e envie um pedido. A sala aparece na lateral depois que o admin aprovar.
                </p>
              </div>

              <form
                className="rounded-lg border bg-background p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestRoomAccess(joinCode);
                }}
              >
                <label htmlFor="room-code" className="text-sm font-medium">
                  Código da sala
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="room-code"
                      value={joinCode}
                      maxLength={8}
                      onChange={(event) => setJoinCode(normalizeRoomCode(event.target.value))}
                      placeholder="CODIGO"
                      className="pl-9 uppercase"
                    />
                  </div>
                  <Button type="submit" disabled={joining || normalizeRoomCode(joinCode).length !== 8}>
                    {joining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    Enviar pedido
                  </Button>
                </div>
                {inviteCode ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Código do link preenchido. Envie o pedido para aguardar a aprovação.
                  </p>
                ) : null}
              </form>

              <form
                className="rounded-lg border bg-card p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createRoom();
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">Criar sala como admin</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Você vira admin da sala e aprova quem pedir entrada pelo código.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={roomName}
                        maxLength={80}
                        onChange={(event) => setRoomName(event.target.value)}
                        placeholder="Ex: Turma DS 2026"
                      />
                      <Button type="submit" variant="outline" disabled={creating || !roomName.trim()}>
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                        Criar
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
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
            {activeRoomOwner ? (
              <DeleteConfirmCard
                title="Excluir sala"
                description={`A sala "${activeRoom.name}" sera apagada. Todos os participantes perderao o acesso e as conversas desta sala deixarao de aparecer.`}
                confirmLabel="Excluir sala"
                triggerLabel="Excluir sala"
                triggerTitle="Excluir sala"
                className="w-full"
                loading={deletingRoomId === activeRoom.id}
                onConfirm={() => removeRoom(activeRoom)}
              />
            ) : null}
          </div>
        ) : null}

        {activeRoom ? (
          <div className="space-y-3 rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Integrantes</h3>
                <p className="mt-1 text-xs text-muted-foreground">Admin e participantes aprovados.</p>
              </div>
              <Badge variant="muted">{roomMembers.length}</Badge>
            </div>
            <div className="space-y-2">
              {roomMembers.map((member) => {
                const mine = member.userId === user?.uid;
                const admin = member.role === "admin";

                return (
                  <div key={member.userId} className="rounded-md border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={member.avatar} name={member.name} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-medium">{mine ? "Voce" : member.name}</p>
                          {admin ? (
                            <Badge variant="secondary" className="shrink-0">
                              <Crown className="h-3 w-3" aria-hidden="true" />
                              Admin
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{admin ? "Administrador da sala" : "Integrante"}</p>
                      </div>
                    </div>
                    {!mine ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedPrivateMember?.userId === member.userId ? "default" : "outline"}
                        className="mt-3 w-full"
                        onClick={() => {
                          setSelectedPrivateMember(member);
                          setPrivateContent("");
                          setError(null);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Mensagem privada
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeRoom && selectedPrivateMember ? (
          <PrivateMessagePanel
            member={selectedPrivateMember}
            messages={privateMessages}
            currentUserId={user?.uid ?? ""}
            content={privateContent}
            loading={loadingPrivateMessages}
            sending={sendingPrivate}
            endRef={privateEndRef}
            onContentChange={setPrivateContent}
            onClose={() => {
              setSelectedPrivateMember(null);
              setPrivateContent("");
            }}
            onSend={() => void submitPrivateMessage()}
          />
        ) : null}

        {activeRoom && activeRoomOwner ? (
          <div className="space-y-3 rounded-lg border bg-background p-4">
            <div>
              <h3 className="text-sm font-semibold">Pedidos de entrada</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Aprove para a sala aparecer na lista do estudante.
              </p>
            </div>
            {activeRoom.pendingRequests.length ? (
              <div className="space-y-2">
                {activeRoom.pendingRequests.map((request) => (
                  <div key={request.userId} className="rounded-md border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={request.avatar} name={request.name} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{request.name}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeDate(request.requestedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={reviewingRequestId === request.userId}
                        onClick={() => void reviewRequest(request.userId, "approve")}
                      >
                        {reviewingRequestId === request.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <UserCheck className="h-4 w-4" aria-hidden="true" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reviewingRequestId === request.userId}
                        onClick={() => void reviewRequest(request.userId, "reject")}
                      >
                        <UserX className="h-4 w-4" aria-hidden="true" />
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Nenhum pedido pendente.
              </p>
            )}
          </div>
        ) : null}

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>Quem tem o código ou link pode pedir entrada na sala.</p>
          </div>
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>As mensagens só aparecem depois que o admin aprova o participante.</p>
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

function PrivateMessagePanel({
  member,
  messages,
  currentUserId,
  content,
  loading,
  sending,
  endRef,
  onContentChange,
  onClose,
  onSend,
}: {
  member: RoomMemberProfile;
  messages: RoomDirectMessage[];
  currentUserId: string;
  content: string;
  loading: boolean;
  sending: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  onContentChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <UserAvatar src={member.avatar} name={member.name} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">Privado com {member.name}</h3>
          <p className="text-xs text-muted-foreground">Somente voces dois veem esta conversa.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" title="Fechar conversa privada" onClick={onClose}>
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="scrollbar-thin max-h-72 space-y-3 overflow-y-auto rounded-md border bg-card p-3">
        {loading ? <Skeleton className="h-20 w-full" /> : null}
        {!loading && !messages.length ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Envie a primeira mensagem privada.
          </p>
        ) : null}
        {messages.map((message) => (
          <DirectMessageBubble key={message.id} message={message} mine={message.userId === currentUserId} />
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <Textarea
          value={content}
          maxLength={1000}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Escreva uma mensagem privada..."
          className="min-h-20 resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) onSend();
          }}
        />
        <Button type="submit" className="w-full" disabled={sending || !content.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Enviar privado
        </Button>
      </form>
    </div>
  );
}

function DirectMessageBubble({ message, mine }: { message: RoomDirectMessage; mine: boolean }) {
  return (
    <div className={cn("flex", mine && "justify-end")}>
      <div
        className={cn(
          "max-w-[92%] rounded-lg border px-3 py-2 text-sm leading-5",
          mine ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn("mt-1 text-[11px]", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
          {formatRelativeDate(message.createdAt)}
        </p>
      </div>
    </div>
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

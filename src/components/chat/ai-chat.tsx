"use client";

import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listenChatHistory, saveChatMessage } from "@/services/chat-service";
import type { ChatMessage } from "@/types/chat";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";

const tasks = [
  { label: "Dúvida", value: "question" },
  { label: "Explicar código", value: "explain_code" },
  { label: "Resumir", value: "summarize" },
  { label: "Melhorar", value: "improve" },
  { label: "Detectar erros", value: "detect_errors" },
  { label: "Descrição automática", value: "describe_upload" },
] as const;

type AiTask = (typeof tasks)[number]["value"];

type AiChatProps = {
  roomId: string;
};

export function AiChat({ roomId }: AiChatProps) {
  const { user, getIdToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState<AiTask>("question");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    return listenChatHistory(user.uid, roomId, setMessages, (chatError) => setError(chatError.message));
  }, [roomId, user?.uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingAnswer]);

  const submit = async () => {
    const content = prompt.trim();
    if (!content || !user) return;

    setLoading(true);
    setError(null);
    setPrompt("");
    setStreamingAnswer("");

    try {
      await saveChatMessage({ userId: user.uid, roomId, role: "user", content });
      const token = await getIdToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          task,
          roomId,
          messages: [...messages.slice(-12).map(({ role, content: messageContent }) => ({ role, content: messageContent })), { role: "user", content }],
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Não foi possível conversar com a IA.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        answer += decoder.decode(result.value, { stream: !done });
        setStreamingAnswer(answer);
      }

      if (answer.trim()) {
        await saveChatMessage({ userId: user.uid, roomId, role: "assistant", content: answer.trim() });
      }
      setStreamingAnswer("");
    } catch (chatError) {
      const message = chatError instanceof Error ? chatError.message : "Erro inesperado no assistente.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-128px)] gap-6 xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Assistente IA</h2>
              <p className="text-sm text-muted-foreground">Explique códigos, resuma materiais e gere melhorias.</p>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          {!messages.length && !streamingAnswer ? (
            <EmptyState
              icon={Bot}
              title="Comece uma conversa"
              description="Envie uma dúvida ou cole um trecho de código para receber uma resposta contextual."
            />
          ) : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {streamingAnswer ? (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="max-w-[88%] rounded-lg border bg-background p-3 text-sm leading-6 whitespace-pre-wrap">
                {streamingAnswer}
              </div>
            </div>
          ) : null}

          {loading && !streamingAnswer ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Pensando
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {error ? <p className="border-t px-4 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="border-t p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {tasks.map((item) => (
              <button
                key={item.value}
                type="button"
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted",
                  task === item.value && "border-primary bg-primary/10 text-primary",
                )}
                onClick={() => setTask(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Digite sua pergunta, cole um código ou descreva o arquivo..."
              className="min-h-20 flex-1 resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  void submit();
                }
              }}
            />
            <Button type="button" className="sm:self-end" disabled={loading || !prompt.trim()} onClick={() => void submit()}>
              <Send className="h-4 w-4" aria-hidden="true" />
              Enviar
            </Button>
          </div>
        </div>
      </div>

      <aside className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold">Boas práticas</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>Inclua o objetivo da atividade e o formato de resposta desejado.</p>
          <p>Para PDFs, envie o trecho ou resumo do conteúdo que precisa analisar.</p>
          <p>Para código, informe linguagem, erro observado e resultado esperado.</p>
        </div>
      </aside>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const assistant = message.role === "assistant";
  const Icon = assistant ? Bot : UserRound;

  return (
    <div className={cn("flex gap-3", !assistant && "justify-end")}>
      {assistant ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[88%] rounded-lg border p-3 text-sm leading-6 whitespace-pre-wrap",
          assistant ? "bg-background" : "bg-primary text-primary-foreground",
        )}
      >
        {message.content}
        <p className={cn("mt-2 text-xs", assistant ? "text-muted-foreground" : "text-primary-foreground/75")}>
          {formatRelativeDate(message.createdAt)}
        </p>
      </div>
      {!assistant ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
}

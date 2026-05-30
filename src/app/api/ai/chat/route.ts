import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getAdminAuth } from "@/firebase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/server-env";
import { aiChatRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";

const taskInstructions = {
  question: "Responda dúvidas acadêmicas com clareza, passos práticos e exemplos quando ajudar.",
  explain_code: "Explique o código enviado, destaque fluxo, riscos, bugs simples e melhorias de legibilidade.",
  summarize: "Resuma o conteúdo em tópicos objetivos, preservando conceitos e próximos passos.",
  improve: "Sugira melhorias concretas, com prioridade e impacto esperado.",
  detect_errors: "Procure erros simples, inconsistências e riscos. Seja específico e proponha correções.",
  describe_upload: "Gere uma descrição curta e útil para um material acadêmico enviado pelo estudante.",
} as const;

const systemPrompt = `Você é o assistente IA do SkillDrop, uma plataforma SaaS acadêmica.
Ajude estudantes a organizar entregas, entender códigos, resumir materiais e melhorar projetos.
Responda em português do Brasil, com objetividade, sem inventar conteúdo que não foi fornecido.
Quando analisar código, seja preciso, cite trechos pelo nome de função/arquivo se aparecerem e proponha correções seguras.`;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  return request.cookies.get("skilldrop_id_token")?.value;
}

async function authenticate(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Sessão ausente.");

  return getAdminAuth().verifyIdToken(token);
}

function buildInput(payload: ReturnType<typeof aiChatRequestSchema.parse>) {
  const transcript = payload.messages
    .map((message) => `${message.role === "user" ? "Estudante" : "Assistente"}: ${message.content}`)
    .join("\n\n");

  return [
    `Tarefa: ${taskInstructions[payload.task]}`,
    payload.context ? `Contexto adicional:\n${payload.context}` : null,
    `Histórico recente:\n${transcript}`,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

export async function POST(request: NextRequest) {
  try {
    if (!serverEnv.openAiApiKey) {
      return Response.json({ error: "OPENAI_API_KEY não está configurada." }, { status: 500 });
    }

    const decodedToken = await authenticate(request);
    const rateLimit = checkRateLimit(decodedToken.uid, { max: 20, windowMs: 60_000 });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Limite de mensagens atingido. Tente novamente em alguns segundos." },
        { status: 429, headers: { "X-RateLimit-Reset": String(rateLimit.resetAt) } },
      );
    }

    const payload = aiChatRequestSchema.parse(await request.json());
    const client = new OpenAI({ apiKey: serverEnv.openAiApiKey });
    const encoder = new TextEncoder();

    const stream = client.responses.stream({
      model: serverEnv.openAiModel,
      instructions: systemPrompt,
      input: buildInput(payload),
      max_output_tokens: 1400,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar a mensagem.";
    const status = message === "Sessão ausente." ? 401 : 400;

    return Response.json({ error: message }, { status });
  }
}

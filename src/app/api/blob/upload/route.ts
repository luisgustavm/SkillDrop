import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { assertServerRoomMember, getVerifiedRequestUser } from "@/services/server-firebase-service";

export const runtime = "nodejs";

function normalizeRoomCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

function parseClientPayload(clientPayload: string | null) {
  const parsed = JSON.parse(clientPayload || "{}") as { roomId?: unknown };
  const roomId = typeof parsed.roomId === "string" ? normalizeRoomCode(parsed.roomId) : "";

  if (roomId.length !== 8) {
    throw new Error("Sala invalida para envio.");
  }

  return { roomId };
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob nao esta configurado. Crie um Blob Store na Vercel e rode vercel env pull.");
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getVerifiedRequestUser(request);
        const { roomId } = parseClientPayload(clientPayload);

        await assertServerRoomMember(roomId, user);

        if (!pathname.startsWith(`rooms/${roomId}/${user.uid}/`)) {
          throw new Error("Caminho de upload invalido.");
        }

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          tokenPayload: JSON.stringify({ roomId, userId: user.uid }),
        };
      },
      onUploadCompleted: async () => undefined,
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel preparar o upload." },
      { status: 400 },
    );
  }
}

import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerUploadOwnerAndUrl, getVerifiedRequestUser } from "@/services/server-firebase-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob nao esta configurado. Configure BLOB_READ_WRITE_TOKEN.");
    }

    const user = await getVerifiedRequestUser(request);
    const body = (await request.json()) as { uploadId?: unknown };
    const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";

    if (!uploadId) {
      throw new Error("Material invalido para exclusao.");
    }

    const upload = await getServerUploadOwnerAndUrl(uploadId, user);

    if (!upload) {
      return NextResponse.json({ ok: true });
    }

    if (upload.userId !== user.uid) {
      return NextResponse.json({ error: "Voce so pode excluir materiais que voce enviou." }, { status: 403 });
    }

    if (upload.storageProvider === "blob" && upload.fileUrl) {
      await del(upload.fileUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel excluir o arquivo." },
      { status: 400 },
    );
  }
}

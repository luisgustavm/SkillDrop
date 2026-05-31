import type { Metadata } from "next";
import { CodeWorkspace } from "@/components/editor/code-workspace";

export const metadata: Metadata = {
  title: "Editor da sala",
};

export default async function RoomEditorPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <CodeWorkspace roomId={roomId} />;
}

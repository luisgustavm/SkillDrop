import type { Metadata } from "next";
import { AiChat } from "@/components/chat/ai-chat";

export const metadata: Metadata = {
  title: "IA da sala",
};

export default async function RoomChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <AiChat roomId={roomId} />;
}

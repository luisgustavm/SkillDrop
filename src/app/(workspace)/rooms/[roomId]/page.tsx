import type { Metadata } from "next";
import { GlobalChat } from "@/components/chat/global-chat";

export const metadata: Metadata = {
  title: "Sala privada",
};

export default async function RoomContentPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <GlobalChat initialRoomId={roomId} />;
}

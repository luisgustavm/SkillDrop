import type { Metadata } from "next";
import { SharedCenter } from "@/components/dashboard/shared-center";

export const metadata: Metadata = {
  title: "Compartilhamento da sala",
};

export default async function RoomSharedPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <SharedCenter roomId={roomId} />;
}

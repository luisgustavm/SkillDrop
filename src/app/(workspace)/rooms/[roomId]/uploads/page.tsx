import type { Metadata } from "next";
import { UploadPage } from "@/components/upload/upload-page";

export const metadata: Metadata = {
  title: "Uploads da sala",
};

export default async function RoomUploadsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <UploadPage roomId={roomId} />;
}

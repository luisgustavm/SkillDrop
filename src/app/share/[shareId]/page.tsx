import type { Metadata } from "next";
import { ShareViewer } from "@/components/shared/share-viewer";

export const metadata: Metadata = {
  title: "Material compartilhado",
};

export default async function SharedUploadPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  return (
    <main className="min-h-screen px-4 py-10">
      <ShareViewer shareId={shareId} />
    </main>
  );
}

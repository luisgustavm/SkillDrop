import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard da sala",
};

export default async function RoomDashboardPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <DashboardClient roomId={roomId} />;
}

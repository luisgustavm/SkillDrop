import type { Metadata } from "next";
import { GlobalChat } from "@/components/chat/global-chat";

export const metadata: Metadata = {
  title: "Salas privadas",
};

export default function RoomsPage() {
  return <GlobalChat />;
}

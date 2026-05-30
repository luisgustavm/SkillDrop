import type { Metadata } from "next";
import { AiChat } from "@/components/chat/ai-chat";

export const metadata: Metadata = {
  title: "Assistente IA",
};

export default function ChatPage() {
  return <AiChat />;
}

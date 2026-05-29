import type { Metadata } from "next";
import { GlobalChat } from "@/components/chat/global-chat";

export const metadata: Metadata = {
  title: "Chat global",
};

export default function GlobalChatPage() {
  return <GlobalChat />;
}

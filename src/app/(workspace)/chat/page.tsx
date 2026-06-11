import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Assistente IA",
};

export default function ChatPage() {
  redirect("/rooms");
}

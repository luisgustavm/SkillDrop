import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editor",
};

export default function EditorPage() {
  redirect("/rooms");
}

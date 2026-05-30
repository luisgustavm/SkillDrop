import type { Metadata } from "next";
import { CodeWorkspace } from "@/components/editor/code-workspace";

export const metadata: Metadata = {
  title: "Editor",
};

export default function EditorPage() {
  return <CodeWorkspace />;
}

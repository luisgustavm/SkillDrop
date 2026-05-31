import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Compartilhar",
};

export default function SharedPage() {
  redirect("/rooms");
}

import type { Metadata } from "next";
import { SharedCenter } from "@/components/dashboard/shared-center";

export const metadata: Metadata = {
  title: "Compartilhar",
};

export default function SharedPage() {
  return <SharedCenter />;
}

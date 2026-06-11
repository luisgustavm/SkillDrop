import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Uploads",
};

export default function UploadsPage() {
  redirect("/rooms");
}

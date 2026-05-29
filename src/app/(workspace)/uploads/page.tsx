import type { Metadata } from "next";
import { UploadPage } from "@/components/upload/upload-page";

export const metadata: Metadata = {
  title: "Uploads",
};

export default function UploadsPage() {
  return <UploadPage />;
}

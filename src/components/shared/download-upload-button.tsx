"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadAcademicUpload } from "@/services/local-file-service";
import type { AcademicUpload } from "@/types/upload";

type DownloadUploadButtonProps = {
  upload: AcademicUpload;
  label?: string;
  iconOnly?: boolean;
  className?: string;
};

export function DownloadUploadButton({ upload, label = "Baixar", iconOnly = false, className }: DownloadUploadButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      title="Baixar material"
      className={className}
      onClick={async () => {
        try {
          await downloadAcademicUpload(upload);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível baixar o material.");
        }
      }}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {iconOnly ? null : label}
    </Button>
  );
}

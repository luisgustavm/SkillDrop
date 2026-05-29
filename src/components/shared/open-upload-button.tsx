"use client";

import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openAcademicUpload } from "@/services/local-file-service";
import type { AcademicUpload } from "@/types/upload";

type OpenUploadButtonProps = {
  upload: AcademicUpload;
  label?: string;
  iconOnly?: boolean;
  className?: string;
};

export function OpenUploadButton({ upload, label = "Abrir", iconOnly = false, className }: OpenUploadButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "icon" : "default"}
      title="Abrir material"
      className={className}
      onClick={async () => {
        try {
          await openAcademicUpload(upload);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível abrir o material.");
        }
      }}
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      {iconOnly ? null : label}
    </Button>
  );
}

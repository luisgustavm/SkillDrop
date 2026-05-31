"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmCard } from "@/components/shared/delete-confirm-card";
import { useAuth } from "@/hooks/use-auth";
import { deleteAcademicUpload } from "@/services/upload-service";
import type { AcademicUpload } from "@/types/upload";

type DeleteUploadButtonProps = {
  upload: AcademicUpload;
  iconOnly?: boolean;
  label?: string;
  className?: string;
  onDeleted?: () => void;
};

export function DeleteUploadButton({
  upload,
  iconOnly = false,
  label = "Excluir",
  className,
  onDeleted,
}: DeleteUploadButtonProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  if (user?.uid !== upload.userId) return null;

  const removeUpload = async () => {
    setDeleting(true);
    try {
      await deleteAcademicUpload(upload);
      toast.success("Material excluido.");
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o material.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmCard
      title="Excluir material"
      description={`O material "${upload.title}" sera removido da sua conta. Se ele estiver compartilhado, o link publico deixara de funcionar.`}
      confirmLabel="Excluir material"
      triggerLabel={label}
      triggerTitle="Excluir material"
      iconOnly={iconOnly}
      className={className}
      loading={deleting}
      onConfirm={removeUpload}
    />
  );
}

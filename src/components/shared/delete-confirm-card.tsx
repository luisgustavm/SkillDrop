"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type DeleteConfirmCardProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  triggerLabel?: string;
  triggerTitle?: string;
  iconOnly?: boolean;
  loading?: boolean;
  className?: string;
  triggerSize?: ButtonProps["size"];
  triggerVariant?: ButtonProps["variant"];
  onConfirm: () => Promise<void> | void;
};

export function DeleteConfirmCard({
  title,
  description,
  confirmLabel = "Excluir",
  triggerLabel = "Excluir",
  triggerTitle = "Excluir",
  iconOnly = false,
  loading = false,
  className,
  triggerSize,
  triggerVariant = "destructive",
  onConfirm,
}: DeleteConfirmCardProps) {
  const [open, setOpen] = useState(false);

  const close = () => {
    if (!loading) setOpen(false);
  };

  const confirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize ?? (iconOnly ? "icon" : "default")}
        title={triggerTitle}
        className={className}
        disabled={loading}
        onClick={() => setOpen(true)}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
        {iconOnly ? <span className="sr-only">{triggerTitle}</span> : triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border bg-card p-5 shadow-panel">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold">{title}</h2>
                  <Button type="button" variant="ghost" size="icon" title="Fechar" disabled={loading} onClick={close}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" disabled={loading} onClick={close}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" disabled={loading} onClick={() => void confirm()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                {confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

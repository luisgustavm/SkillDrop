"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";

type QrShareProps = {
  url: string;
};

export function QrShare({ url }: QrShareProps) {
  const { copy } = useClipboard();

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
      <QRCodeSVG value={url} size={92} bgColor="transparent" fgColor="currentColor" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Compartilhamento</p>
        <p className="truncate text-xs text-muted-foreground">{url}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await copy(url);
            toast.success("Link copiado.");
          }}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copiar link
        </Button>
      </div>
    </div>
  );
}

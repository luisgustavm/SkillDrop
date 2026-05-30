import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message: string;
  className?: string;
};

export function ErrorState({ title = "Não foi possível carregar", message, className }: ErrorStateProps) {
  return (
    <div className={cn("rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm", className)}>
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

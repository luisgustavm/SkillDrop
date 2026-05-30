import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
}

export function Progress({ value, className, ...props }: ProgressProps) {
  const normalized = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}

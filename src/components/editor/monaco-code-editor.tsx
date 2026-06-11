"use client";

import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import type { EditorProps, OnMount } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

loader.config({ paths: { vs: "/monaco/vs" } });

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[520px] w-full" />,
});

type MonacoCodeEditorProps = Pick<EditorProps, "height" | "language" | "theme" | "value" | "options"> & {
  onChange: (value: string) => void;
  className?: string;
};

function isMonacoFailure(reason: unknown) {
  if (reason instanceof Event) {
    const target = reason.target as HTMLScriptElement | null;

    return Boolean(target?.src?.includes("/monaco/") || target?.src?.includes("monaco-editor") || target?.src?.includes("loader.js"));
  }

  const message = reason instanceof Error ? reason.message : String(reason ?? "");

  return /monaco|loader\.js|Loading chunk|failed to fetch|network/i.test(message);
}

export function MonacoCodeEditor({ className, height = "100%", onChange, value = "", ...props }: MonacoCodeEditorProps) {
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isMonacoFailure(event.error) || isMonacoFailure(event)) setFallback(true);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isMonacoFailure(event.reason)) {
        event.preventDefault();
        setFallback(true);
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const onMount: OnMount = () => setFallback(false);

  if (fallback) {
    return (
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className={cn("h-full min-h-[520px] resize-none rounded-none border-0 font-mono text-sm leading-6", className)}
        style={{ height }}
      />
    );
  }

  return (
    <MonacoEditor
      {...props}
      height={height}
      value={value}
      onMount={onMount}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      loading={<Skeleton className="h-full min-h-[520px] w-full" />}
    />
  );
}

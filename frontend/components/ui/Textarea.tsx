import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-44 w-full resize-y rounded-md border border-white/10 bg-bg/70 px-3 py-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent/70 ${className}`}
      {...props}
    />
  );
}


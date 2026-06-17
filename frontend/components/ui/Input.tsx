import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full rounded-md border border-white/10 bg-bg/70 px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent/70 ${className}`}
      {...props}
    />
  );
}


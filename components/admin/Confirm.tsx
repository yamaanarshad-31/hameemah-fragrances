"use client";
import { useTransition } from "react";

/** A button that runs a server action after an optional confirm(). */
export function ActionButton({ action, confirmText, children, className = "" }: { action: () => Promise<unknown>; confirmText?: string; children: React.ReactNode; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => (!confirmText || confirm(confirmText)) && start(async () => { await action(); })} className={`disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );
}

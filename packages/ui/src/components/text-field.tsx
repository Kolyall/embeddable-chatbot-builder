import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Input } from "./input";
import { Label } from "./label";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  wrapperClassName?: string;
};

/**
 * Shared "label above input" wrapper used by every plain text/email/password
 * field across apps/app and apps/admin. Not used for textareas or selects —
 * those stay local to each form since they don't repeat as consistently.
 */
export function TextField({ label, className, wrapperClassName, id, ...props }: Props) {
  // Label and Input are separate elements (unlike a wrapping <label>), so
  // they need a shared id/htmlFor to stay associated — most call sites don't
  // pass their own id, so fall back to a generated one rather than silently
  // breaking that association (click-to-focus, screen readers, `for`).
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} className={className} {...props} />
    </div>
  );
}

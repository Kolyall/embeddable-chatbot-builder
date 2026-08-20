import type { InputHTMLAttributes, ReactNode } from "react";
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
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={className} {...props} />
    </div>
  );
}

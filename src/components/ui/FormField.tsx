import { ReactNode } from "react";
import { Label } from "./Label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-[#E8572A] ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-[#71717A]">{hint}</p>}
    </div>
  );
}

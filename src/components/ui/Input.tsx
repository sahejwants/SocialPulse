import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-11 px-4 rounded-lg border bg-white text-[#18181B] text-sm",
          "placeholder:text-[#A1A1AA] transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:ring-offset-0 focus:border-transparent",
          error
            ? "border-[#DC2626] focus:ring-[#DC2626]"
            : "border-[#E4E4DC] hover:border-[#C4C4BB]",
          "disabled:pointer-events-none disabled:opacity-50 disabled:bg-[#F4F4F0]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

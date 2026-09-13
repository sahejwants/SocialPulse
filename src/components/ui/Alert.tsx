import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

type AlertVariant = "error" | "success" | "info" | "warning";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ElementType; classes: string }> = {
  error: {
    icon: XCircle,
    classes: "bg-red-50 border-red-200 text-red-800",
  },
  success: {
    icon: CheckCircle,
    classes: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  info: {
    icon: Info,
    classes: "bg-blue-50 border-blue-200 text-blue-800",
  },
  warning: {
    icon: AlertCircle,
    classes: "bg-amber-50 border-amber-200 text-amber-800",
  },
};

export function Alert({ variant = "info", title, message, className }: AlertProps) {
  const { icon: Icon, classes } = config[variant];
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        classes,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

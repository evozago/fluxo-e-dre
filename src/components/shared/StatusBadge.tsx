import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

const statusVariants = {
  success: "status-success",
  warning: "status-warning", 
  danger: "status-danger",
  info: "bg-primary/10 text-primary border-primary/20",
  default: "bg-muted text-muted-foreground border-muted"
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline"
      className={cn(statusVariants[status], className)}
    >
      {children}
    </Badge>
  );
}
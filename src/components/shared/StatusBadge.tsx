import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle, Clock, Info, DollarSign } from "lucide-react";

interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info" | "default" | "paid" | "overdue" | "pending";
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  success: {
    variant: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    icon: CheckCircle
  },
  warning: {
    variant: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    icon: AlertCircle
  },
  danger: {
    variant: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: XCircle
  },
  info: {
    variant: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    icon: Info
  },
  default: {
    variant: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
    icon: Info
  },
  paid: {
    variant: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    icon: DollarSign
  },
  overdue: {
    variant: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: AlertCircle
  },
  pending: {
    variant: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    icon: Clock
  }
};

const sizeVariants = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2.5 py-1.5",
  lg: "text-base px-3 py-2"
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4", 
  lg: "h-5 w-5"
};

export function StatusBadge({ 
  status, 
  children, 
  className, 
  showIcon = true, 
  size = "md" 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-colors",
        config.variant,
        sizeVariants[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {children}
    </Badge>
  );
}

// Componentes específicos para diferentes tipos de status
export function PaymentStatusBadge({ status }: { status: "aberto" | "vencido" | "pago" }) {
  const statusMap = {
    aberto: { status: "pending" as const, label: "Em Aberto" },
    vencido: { status: "overdue" as const, label: "Vencido" },
    pago: { status: "paid" as const, label: "Pago" }
  };

  const config = statusMap[status];
  
  return (
    <StatusBadge status={config.status} size="sm">
      {config.label}
    </StatusBadge>
  );
}

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" | "urgent" }) {
  const priorityMap = {
    low: { status: "info" as const, label: "Baixa" },
    medium: { status: "warning" as const, label: "Média" },
    high: { status: "danger" as const, label: "Alta" },
    urgent: { status: "danger" as const, label: "Urgente" }
  };

  const config = priorityMap[priority];
  
  return (
    <StatusBadge status={config.status} size="sm">
      {config.label}
    </StatusBadge>
  );
}
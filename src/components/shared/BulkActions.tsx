import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  CheckSquare, 
  Square, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Download, 
  Mail, 
  DollarSign,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: (selectedIds: string[]) => void;
  disabled?: boolean;
}

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
  position?: "top" | "bottom" | "floating";
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  actions,
  className,
  position = "floating"
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  if (selectedCount === 0) {
    return null;
  }

  const handleActionClick = (action: BulkAction) => {
    action.onClick(selectedItems);
    setIsOpen(false);
  };

  const positionClasses = {
    top: "relative mb-4",
    bottom: "relative mt-4",
    floating: "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg"
  };

  return (
    <Card className={cn(
      "border-primary/20 bg-primary/5",
      positionClasses[position],
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="p-1 h-auto"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : isPartiallySelected ? (
                <div className="h-4 w-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm" />
                </div>
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-muted-foreground">
                de {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            {actions.slice(0, 2).map((action) => (
              <Button
                key={action.key}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className="gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}

            {/* More Actions Dropdown */}
            {actions.length > 2 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      Mais ações
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {actions.slice(2).map((action, index) => (
                      <div key={action.key}>
                        {index > 0 && action.variant === "destructive" && (
                          <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                          onClick={() => handleActionClick(action)}
                          disabled={action.disabled}
                          className={cn(
                            "gap-2",
                            action.variant === "destructive" && "text-destructive focus:text-destructive"
                          )}
                        >
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </DropdownMenuItem>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Ações pré-definidas comuns
export const commonBulkActions = {
  edit: (onClick: (ids: string[]) => void): BulkAction => ({
    key: "edit",
    label: "Editar",
    icon: Edit,
    variant: "outline",
    onClick
  }),
  
  delete: (onClick: (ids: string[]) => void): BulkAction => ({
    key: "delete",
    label: "Excluir",
    icon: Trash2,
    variant: "destructive",
    onClick
  }),
  
  export: (onClick: (ids: string[]) => void): BulkAction => ({
    key: "export",
    label: "Exportar",
    icon: Download,
    variant: "outline",
    onClick
  }),
  
  markAsPaid: (onClick: (ids: string[]) => void): BulkAction => ({
    key: "markAsPaid",
    label: "Marcar como Pago",
    icon: DollarSign,
    variant: "default",
    onClick
  }),
  
  sendEmail: (onClick: (ids: string[]) => void): BulkAction => ({
    key: "sendEmail",
    label: "Enviar Email",
    icon: Mail,
    variant: "outline",
    onClick
  })
};


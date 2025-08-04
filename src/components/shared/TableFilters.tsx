import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange";
  options?: FilterOption[];
  placeholder?: string;
}

interface TableFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  className?: string;
  collapsible?: boolean;
  showActiveCount?: boolean;
}

export function TableFilters({
  filters,
  values,
  onChange,
  onClear,
  className,
  collapsible = true,
  showActiveCount = true
}: TableFiltersProps) {
  const [isOpen, setIsOpen] = useState(!collapsible);

  const activeFiltersCount = Object.values(values).filter(value => 
    value !== "" && value !== null && value !== undefined
  ).length;

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key] || "";

    switch (filter.type) {
      case "text":
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key} className="text-sm font-medium">
              {filter.label}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={filter.key}
                placeholder={filter.placeholder || `Buscar ${filter.label.toLowerCase()}...`}
                value={value}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        );

      case "select":
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Select value={value} onValueChange={(val) => onChange(filter.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || `Selecionar ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div key={filter.key} className="space-y-2">
            <Label htmlFor={filter.key} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Input
              id={filter.key}
              type="date"
              value={value}
              onChange={(e) => onChange(filter.key, e.target.value)}
            />
          </div>
        );

      case "dateRange":
        return (
          <div key={filter.key} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="Data inicial"
                value={values[`${filter.key}_start`] || ""}
                onChange={(e) => onChange(`${filter.key}_start`, e.target.value)}
              />
              <Input
                type="date"
                placeholder="Data final"
                value={values[`${filter.key}_end`] || ""}
                onChange={(e) => onChange(`${filter.key}_end`, e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map(renderFilter)}
      </div>
      
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <Card className={cn("w-full", className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  {showActiveCount && activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount}</Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <FilterContent />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <CardTitle className="text-lg">Filtros</CardTitle>
          {showActiveCount && activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}


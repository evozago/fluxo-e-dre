import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Settings, GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnConfig<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface ModularTableProps<T = any> {
  data: T[];
  columns: ColumnConfig<T>[];
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
}

export function ModularTable<T extends Record<string, any>>({ 
  data, 
  columns: initialColumns, 
  searchPlaceholder = "Buscar...",
  className,
  emptyMessage = "Nenhum registro encontrado"
}: ModularTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnOrder, setColumnOrder] = useState(initialColumns.map(col => col.key));
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Ordenar colunas conforme a ordem definida
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map(key => initialColumns.find(col => col.key === key))
      .filter(Boolean) as ColumnConfig<T>[];
  }, [columnOrder, initialColumns]);

  // Colunas visíveis
  const visibleColumns = useMemo(() => {
    return orderedColumns.filter(col => !hiddenColumns.has(col.key));
  }, [orderedColumns, hiddenColumns]);

  // Filtrar dados baseado na busca
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    const column = initialColumns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderSortIcon = (column: ColumnConfig<T>) => {
    if (!column.sortable) return null;
    
    const isActive = sortConfig?.key === column.key;
    const direction = sortConfig?.direction;

    return (
      <span className="ml-2 inline-flex flex-col">
        <ChevronUp 
          className={cn("h-3 w-3", 
            isActive && direction === 'asc' ? "text-primary" : "text-muted-foreground"
          )} 
        />
        <ChevronDown 
          className={cn("h-3 w-3 -mt-1", 
            isActive && direction === 'desc' ? "text-primary" : "text-muted-foreground"
          )} 
        />
      </span>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controles */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {orderedColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={!hiddenColumns.has(column.key)}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
              >
                {column.title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={cn(
                        "select-none",
                        column.sortable && "cursor-pointer hover:bg-muted/50",
                        column.className
                      )}
                      style={{ width: column.width }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.title}
                        {renderSortIcon(column)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((row, index) => (
                    <TableRow key={index}>
                      {visibleColumns.map((column) => (
                        <TableCell 
                          key={column.key}
                          className={column.className}
                        >
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key]
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={visibleColumns.length} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{sortedData.length} de {data.length} registros</span>
        {hiddenColumns.size > 0 && (
          <span>{hiddenColumns.size} coluna(s) oculta(s)</span>
        )}
      </div>
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, Search } from 'lucide-react';
import { PayableFilters } from '@/hooks/use-payables-data';

interface EnhancedFiltersProps {
  filters: PayableFilters;
  onFiltersChange: (filters: PayableFilters) => void;
  loading?: boolean;
}

export const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false
}) => {
  const [localFilters, setLocalFilters] = useState<PayableFilters>(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = useCallback((key: keyof PayableFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters: PayableFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [onFiltersChange]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(localFilters).filter(value => value && value.trim() !== '').length;
  }, [localFilters]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Filtros Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição ou documento..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          <Select 
            value={localFilters.status || ''} 
            onValueChange={(value) => handleFilterChange('status', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Fornecedor"
            value={localFilters.fornecedor || ''}
            onChange={(e) => handleFilterChange('fornecedor', e.target.value)}
            disabled={loading}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={loading}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Avançado
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros Avançados */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-1 block">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={localFilters.dataInicio || ''}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Data Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={localFilters.dataFim || ''}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Input
                type="text"
                placeholder="Categoria"
                value={localFilters.categoria || ''}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Debug de Filtros (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && activeFiltersCount > 0 && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Debug Filtros:</strong> {JSON.stringify(localFilters, null, 2)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
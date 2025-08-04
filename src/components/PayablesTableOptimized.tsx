import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { 
  Search, 
  Edit, 
  Check, 
  DollarSign, 
  Calendar, 
  Download, 
  Upload, 
  Users, 
  Paperclip, 
  CreditCard, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Repeat, 
  Trash2, 
  RefreshCw,
  X,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UploadReceiptModal } from './UploadReceiptModal';
import { BankStatementImport } from './BankStatementImport';
import { TitleDetailModal } from './TitleDetailModal';
import { formatCurrency, formatDate, formatDateTime, parseCurrency } from '@/lib/brazilian-utils';
import { CancelPaymentModal } from './CancelPaymentModal';
import { PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { RecurrentExpenseModal } from './RecurrentExpenseModal';
import { usePayablesData, PayableInstallment, PayableFilters } from '@/hooks/use-payables-data';
import { EnhancedFilters } from '@/components/shared/EnhancedFilters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PayablesTableProps {
  onDataChange: () => void;
}

export const PayablesTable: React.FC<PayablesTableProps> = ({ onDataChange }) => {
  const { installments, stats, loading, error, loadData, refreshData } = usePayablesData();
  const [filters, setFilters] = useState<PayableFilters>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PayableInstallment; direction: 'asc' | 'desc' } | null>(null);
  
  // Modals state
  const [editingItem, setEditingItem] = useState<PayableInstallment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptInstallmentId, setReceiptInstallmentId] = useState<string>('');
  const [showTitleDetail, setShowTitleDetail] = useState(false);
  const [titleDetailId, setTitleDetailId] = useState<string>('');
  const [showCancelPayment, setShowCancelPayment] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<string>('');
  const [showRecurrentModal, setShowRecurrentModal] = useState(false);
  const [showBankImport, setShowBankImport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const { toast: toastHook } = useToast();

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PayableFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadData(newFilters, 1, itemsPerPage);
  }, [loadData, itemsPerPage]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadData(filters, page, itemsPerPage);
  }, [filters, loadData, itemsPerPage]);

  // Handle sorting
  const handleSort = useCallback((key: keyof PayableInstallment) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    
    // For now, we'll sort client-side. In a production app, you'd want server-side sorting
    const sorted = [...installments].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue === null) return direction === 'asc' ? 1 : -1;
      if (bValue === null) return direction === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue, 'pt-BR')
          : bValue.localeCompare(aValue, 'pt-BR');
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    // This would need to be integrated with the data loading system
    console.log('Sorted data:', sorted);
  }, [installments, sortConfig]);

  // Handle item selection
  const handleItemSelect = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedItems(checked ? installments.map(item => item.id) : []);
  }, [installments]);

  // Mark as paid
  const handleMarkAsPaid = useCallback(async (installmentId: string, amount?: number) => {
    try {
      const item = installments.find(i => i.id === installmentId);
      if (!item) return;

      const paymentAmount = amount || item.valor;
      
      const { error } = await supabase
        .from('ap_installments')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
          data_hora_pagamento: new Date().toISOString(),
          valor: paymentAmount
        })
        .eq('id', installmentId);

      if (error) throw error;

      toast('Parcela marcada como paga!', { 
        description: `${item.descricao} - ${formatCurrency(paymentAmount)}` 
      });
      
      refreshData();
      onDataChange();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toastHook({
        title: 'Erro',
        description: 'Não foi possível marcar a parcela como paga.',
        variant: 'destructive'
      });
    }
  }, [installments, refreshData, onDataChange, toastHook]);

  // Delete installment
  const handleDelete = useCallback(async (installmentId: string) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .delete()
        .eq('id', installmentId);

      if (error) throw error;

      toast('Parcela excluída com sucesso!');
      refreshData();
      onDataChange();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toastHook({
        title: 'Erro',
        description: 'Não foi possível excluir a parcela.',
        variant: 'destructive'
      });
    }
  }, [refreshData, onDataChange, toastHook]);

  // Calculate totals for display
  const totals = useMemo(() => ({
    total: stats.totalAberto + stats.totalVencido + stats.totalPago,
    aberto: stats.totalAberto,
    vencido: stats.totalVencido,
    pago: stats.totalPago,
    count: stats.totalCount
  }), [stats]);

  // Pagination calculations
  const totalPages = Math.ceil(totals.count / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totals.count);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.aberto)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.vencido)}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.pago)}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <EnhancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecurrentModal(true)}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Recorrente
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBankImport(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          {selectedItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkEdit(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar {selectedItems.length} selecionados
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <p className="text-sm text-muted-foreground">
            {startItem}-{endItem} de {totals.count} registros
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Erro: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === installments.length && installments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('descricao')}
                >
                  <div className="flex items-center">
                    Descrição
                    {sortConfig?.key === 'descricao' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('fornecedor')}
                >
                  <div className="flex items-center">
                    Fornecedor
                    {sortConfig?.key === 'fornecedor' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('valor')}
                >
                  <div className="flex items-center">
                    Valor
                    {sortConfig?.key === 'valor' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('data_vencimento')}
                >
                  <div className="flex items-center">
                    Vencimento
                    {sortConfig?.key === 'data_vencimento' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-medium">{item.descricao}</p>
                      {item.numero_documento && (
                        <p className="text-sm text-muted-foreground">{item.numero_documento}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.fornecedor}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(item.valor)}</TableCell>
                  <TableCell>{formatDate(item.data_vencimento)}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={(item.status_calculado || item.status) as "aberto" | "vencido" | "pago"} />
                  </TableCell>
                  <TableCell>{item.entidade_nome || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.status !== 'pago' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsPaid(item.id)}
                          title="Marcar como pago"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTitleDetailId(item.id);
                          setShowTitleDetail(true);
                        }}
                        title="Ver detalhes"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReceiptInstallmentId(item.id);
                          setShowReceiptModal(true);
                        }}
                        title="Upload comprovante"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {installments.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals - TODO: Integrate with existing modal system */}
      {showReceiptModal && (
        <div>Upload Receipt Modal - TODO</div>
      )}

      {showTitleDetail && (
        <div>Title Detail Modal - TODO</div>
      )}

      {showRecurrentModal && (
        <div>Recurrent Expense Modal - TODO</div>
      )}

      {showBankImport && (
        <div>Bank Import Modal - TODO</div>
      )}
    </div>
  );
};
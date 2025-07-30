import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Check, DollarSign, Calendar, Download, Upload, Users, Paperclip, CreditCard, ChevronUp, ChevronDown, FileText, Repeat, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UploadReceiptModal } from "./UploadReceiptModal";
import { BankStatementImport } from "./BankStatementImport";
import { TitleDetailModal } from "./TitleDetailModal";

interface Installment {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  categoria: string;
  observacoes: string | null;
  nfe_id: string | null;
  forma_pagamento: string | null;
  banco: string | null;
  numero_documento: string | null;
  entidade_id: string;
  comprovante_path: string | null;
  numero_parcela: number;
  total_parcelas: number;
  valor_total_titulo: number;
  eh_recorrente: boolean;
  tipo_recorrencia: string | null;
  valor_fixo: boolean;
  entidades?: {
    id: string;
    nome: string;
    tipo: string;
  };
}

interface PayablesTableProps {
  onDataChange: () => void;
}

export const PayablesTable = ({ onDataChange }: PayablesTableProps) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bank, setBank] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);
  const [selectedInstallmentForReceipt, setSelectedInstallmentForReceipt] = useState<string>("");
  const [bulkEditData, setBulkEditData] = useState({
    categoria: "",
    forma_pagamento: "",
    banco: "",
    valor_adjustment: "",
    data_vencimento: "",
    entidade_id: "",
    descricao: "",
    fornecedor: "",
    numero_documento: "",
    eh_recorrente: false,
    tipo_recorrencia: "mensal",
    valor_fixo: false
  });
  const [entidades, setEntidades] = useState<{id: string, nome: string, tipo: string}[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: string, nome: string}[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [titleDetailOpen, setTitleDetailOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<{
    nfe_id?: string | null;
    fornecedor: string;
    descricao: string;
    valor_total_titulo: number;
  } | null>(null);
  const [recurrentExpenseOpen, setRecurrentExpenseOpen] = useState(false);
  const { toast } = useToast();

  const CATEGORIAS = [
    'Contabilidade', 'Aluguel', 'Fornecedores', 'Salários', 'Impostos',
    'Energia', 'Telefone', 'Internet', 'Água', 'Manutenção',
    'Marketing', 'Combustível', 'Outras Despesas', 'Geral'
  ];

  const FORMAS_PAGAMENTO = [
    'Dinheiro', 'PIX', 'Transferência Bancária', 'Boleto Bancário',
    'Cartão de Débito', 'Cartão de Crédito', 'Cheque'
  ];

  const BANCOS = [
    'Banco do Brasil', 'Caixa Econômica Federal', 'Bradesco', 'Itaú',
    'Santander', 'Nubank', 'Inter', 'C6 Bank', 'BTG Pactual',
    'Sicoob', 'Sicredi', 'Banrisul', 'Safra', 'Outro'
  ];

  useEffect(() => {
    loadInstallments();
    loadEntidades();
    loadFornecedores();
  }, []);

  useEffect(() => {
    filterInstallments();
  }, [installments, searchTerm, dateFilter, statusFilter, sortField, sortDirection]);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ap_installments')
        .select(`
          *,
          entidades (id, nome, tipo)
        `)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as parcelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEntidades = async () => {
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('id, nome, tipo')
        .eq('ativo', true);
      
      if (error) throw error;
      setEntidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    }
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores' as any)
        .select('id, nome')
        .eq('ativo', true);
      
      if (error) throw error;
      setFornecedores((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const filterInstallments = () => {
    let filtered = installments;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nfe_id && item.nfe_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.numero_documento && item.numero_documento.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(item => item.data_vencimento === dateFilter);
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Aplicar ordenação se definida
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = a[sortField as keyof Installment];
        let bValue = b[sortField as keyof Installment];
        
        // Tratar valores nulos
        if (aValue === null || aValue === undefined) aValue = "";
        if (bValue === null || bValue === undefined) bValue = "";
        
        // Converter para string para comparação
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    setFilteredInstallments(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleTitleClick = (installment: Installment) => {
    setSelectedTitle({
      nfe_id: installment.nfe_id,
      fornecedor: installment.fornecedor,
      descricao: installment.descricao,
      valor_total_titulo: installment.valor_total_titulo
    });
    setTitleDetailOpen(true);
  };

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um item para editar",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const itemId of selectedItems) {
        const item = installments.find(i => i.id === itemId);
        if (item) {
          const updates: any = {};
          if (bulkEditData.categoria) updates.categoria = bulkEditData.categoria;
          if (bulkEditData.forma_pagamento) updates.forma_pagamento = bulkEditData.forma_pagamento;
          if (bulkEditData.banco) updates.banco = bulkEditData.banco;
          if (bulkEditData.data_vencimento) updates.data_vencimento = bulkEditData.data_vencimento;
          if (bulkEditData.entidade_id) updates.entidade_id = bulkEditData.entidade_id;
          if (bulkEditData.descricao) updates.descricao = bulkEditData.descricao;
          if (bulkEditData.fornecedor) updates.fornecedor = bulkEditData.fornecedor;
          if (bulkEditData.numero_documento) updates.numero_documento = bulkEditData.numero_documento;
          if (bulkEditData.eh_recorrente !== undefined) updates.eh_recorrente = bulkEditData.eh_recorrente;
          if (bulkEditData.tipo_recorrencia && bulkEditData.eh_recorrente) updates.tipo_recorrencia = bulkEditData.tipo_recorrencia;
          if (bulkEditData.valor_fixo !== undefined && bulkEditData.eh_recorrente) updates.valor_fixo = bulkEditData.valor_fixo;
          
          if (bulkEditData.valor_adjustment) {
            const adjustment = bulkEditData.valor_adjustment;
            if (adjustment.includes('%')) {
              const percent = parseFloat(adjustment.replace('%', '')) / 100;
              updates.valor = item.valor * (1 + percent);
            } else {
              const fixedAmount = parseFloat(adjustment);
              updates.valor = item.valor + fixedAmount;
            }
          }

          const { error } = await supabase
            .from('ap_installments')
            .update(updates)
            .eq('id', itemId);

          if (error) throw error;
        }
      }

      toast({
        title: "Edição em Massa Concluída",
        description: `${selectedItems.length} itens foram atualizados com sucesso`
      });

      loadInstallments();
      onDataChange();
      setBulkEditOpen(false);
      setSelectedItems([]);
      setBulkEditData({
        categoria: "",
        forma_pagamento: "",
        banco: "",
        valor_adjustment: "",
        data_vencimento: "",
        entidade_id: "",
        descricao: "",
        fornecedor: "",
        numero_documento: "",
        eh_recorrente: false,
        tipo_recorrencia: "mensal",
        valor_fixo: false
      });
    } catch (error) {
      console.error('Erro na edição em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os itens",
        variant: "destructive"
      });
    }
  };

  const exportData = () => {
    const dataToExport = filteredInstallments.map(item => ({
      Fornecedor: item.fornecedor,
      Descrição: item.descricao,
      Valor: item.valor,
      'Data Vencimento': item.data_vencimento,
      'Data Pagamento': item.data_pagamento || '',
      Status: item.status,
      Categoria: item.categoria,
      'Forma Pagamento': item.forma_pagamento || '',
      Banco: item.banco || '',
      'Número Documento': item.numero_documento || '',
      Observações: item.observacoes || '',
      'NFe ID': item.nfe_id || ''
    }));

    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contas-a-pagar-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação Concluída",
      description: `${dataToExport.length} registros exportados com sucesso`
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const { data: existing } = await supabase
          .from('ap_installments')
          .select('id')
          .eq('fornecedor', row.Fornecedor)
          .eq('descricao', row.Descrição);

        if (existing && existing.length > 0) {
          duplicates++;
          continue;
        }

        const { error } = await supabase
          .from('ap_installments')
          .insert({
            fornecedor: row.Fornecedor,
            descricao: row.Descrição,
            valor: parseFloat(row.Valor) || 0,
            data_vencimento: row['Data Vencimento'],
            categoria: row.Categoria || 'Geral',
            forma_pagamento: row['Forma Pagamento'] || null,
            banco: row.Banco || null,
            numero_documento: row['Número Documento'] || null,
            observacoes: row.Observações || null,
            status: 'aberto',
            entidade_id: (await supabase.from('entidades').select('id').limit(1).single())?.data?.id || ''
          });

        if (error) {
          errors++;
          console.error('Erro ao importar linha:', error);
        } else {
          imported++;
        }
      } catch (error) {
        errors++;
        console.error('Erro no processamento da linha:', error);
      }
    }

    toast({
      title: "Importação Concluída",
      description: `${imported} registros importados, ${duplicates} duplicatas ignoradas, ${errors} erros`
    });

    loadInstallments();
    onDataChange();
    setImportModalOpen(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos uma parcela para excluir",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('ap_installments')
      .delete()
      .in('id', selectedItems);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir as parcelas selecionadas",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Parcelas excluídas",
      description: `${selectedItems.length} parcela(s) excluída(s) com sucesso`
    });

    setSelectedItems([]);
    loadInstallments();
    onDataChange();
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredInstallments.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInstallments.map(item => item.id));
    }
  };

  const toggleSelectItem = (itemId: string, index: number, shiftKey: boolean = false) => {
    if (shiftKey && lastSelectedIndex !== -1) {
      // Seleção com shift - selecionar range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredInstallments.slice(start, end + 1).map(item => item.id);
      
      setSelectedItems(prev => {
        const newSelected = [...new Set([...prev, ...rangeIds])];
        return newSelected;
      });
    } else {
      // Seleção normal
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
      setLastSelectedIndex(index);
    }
  };

  const handlePayment = async (installment: Installment) => {
    try {
      const finalAmount = discount ? 
        parseFloat(paymentAmount) - parseFloat(discount) : 
        parseFloat(paymentAmount);

      const { error } = await supabase
        .from('ap_installments')
        .update({
          data_pagamento: paymentDate,
          status: 'pago',
          valor: finalAmount,
          forma_pagamento: paymentMethod,
          banco: bank,
          numero_documento: documentNumber,
          observacoes: discount ? 
            `${installment.observacoes || ''} | Desconto: R$ ${discount}`.trim() : 
            installment.observacoes
        })
        .eq('id', installment.id);

      if (error) throw error;

      toast({
        title: "Pagamento Registrado",
        description: `Parcela de ${installment.fornecedor} foi marcada como paga`
      });

      loadInstallments();
      onDataChange();
      setEditingInstallment(null);
      setPaymentAmount("");
      setPaymentDate("");
      setDiscount("");
      setPaymentMethod("");
      setBank("");
      setDocumentNumber("");
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (installment: Installment) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({
          descricao: installment.descricao,
          fornecedor: installment.fornecedor,
          valor: installment.valor,
          data_vencimento: installment.data_vencimento,
          categoria: installment.categoria,
          observacoes: installment.observacoes,
          entidade_id: installment.entidade_id
        })
        .eq('id', installment.id);

      if (error) throw error;

      toast({
        title: "Parcela Atualizada",
        description: "As informações da parcela foram atualizadas com sucesso"
      });

      loadInstallments();
      onDataChange();
      setEditingInstallment(null);
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a parcela",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'aberto': 'secondary',
      'vencido': 'destructive',
      'pago': 'default'
    } as const;

    const labels = {
      'aberto': 'Em Aberto',
      'vencido': 'Vencido',
      'pago': 'Pago'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const calculateTotals = () => {
    const aberto = filteredInstallments
      .filter(item => item.status === 'aberto')
      .reduce((sum, item) => sum + Number(item.valor), 0);
    
    const vencido = filteredInstallments
      .filter(item => item.status === 'vencido')
      .reduce((sum, item) => sum + Number(item.valor), 0);
    
    const pago = filteredInstallments
      .filter(item => item.status === 'pago')
      .reduce((sum, item) => sum + Number(item.valor), 0);
    
    const total = filteredInstallments
      .reduce((sum, item) => sum + Number(item.valor), 0);
    
    return { aberto, vencido, pago, total };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando contas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contas a Pagar</CardTitle>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <>
                <Button onClick={() => setBulkEditOpen(true)} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Editar {selectedItems.length} Selecionados
                </Button>
                <Button onClick={handleDeleteSelected} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir {selectedItems.length} Selecionados
                </Button>
              </>
            )}
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setImportModalOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            
            <Button onClick={() => setRecurrentExpenseOpen(true)} variant="outline">
              <Repeat className="mr-2 h-4 w-4" />
              Despesa Recorrente
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Fornecedor, descrição, NFe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="dateFilter">Data Vencimento</Label>
            <Input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="statusFilter">Status</Label>
            <select 
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="aberto">Em Aberto</option>
              <option value="vencido">Vencido</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
                setStatusFilter("todos");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredInstallments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === filteredInstallments.length && filteredInstallments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('fornecedor')}
                  >
                    <div className="flex items-center gap-1">
                      Fornecedor
                      {getSortIcon('fornecedor')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('descricao')}
                  >
                    <div className="flex items-center gap-1">
                      Descrição
                      {getSortIcon('descricao')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('valor')}
                  >
                    <div className="flex items-center gap-1">
                      Valor da Parcela
                      {getSortIcon('valor')}
                    </div>
                  </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50" 
                     onClick={() => handleSort('valor_total_titulo')}
                   >
                     <div className="flex items-center gap-1">
                       Valor Total
                       {getSortIcon('valor_total_titulo')}
                     </div>
                   </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50" 
                     onClick={() => handleSort('numero_parcela')}
                   >
                     <div className="flex items-center gap-1">
                       Parcela
                       {getSortIcon('numero_parcela')}
                     </div>
                   </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50" 
                     onClick={() => handleSort('numero_documento')}
                   >
                     <div className="flex items-center gap-1">
                       Nº Doc/NFe
                       {getSortIcon('numero_documento')}
                     </div>
                   </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('data_vencimento')}
                  >
                    <div className="flex items-center gap-1">
                      Vencimento
                      {getSortIcon('data_vencimento')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleSort('categoria')}
                  >
                    <div className="flex items-center gap-1">
                      Categoria
                      {getSortIcon('categoria')}
                    </div>
                  </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50" 
                     onClick={() => handleSort('entidade_id')}
                   >
                     <div className="flex items-center gap-1">
                       Entidade
                       {getSortIcon('entidade_id')}
                     </div>
                   </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50" 
                     onClick={() => handleSort('forma_pagamento')}
                   >
                     <div className="flex items-center gap-1">
                       Forma Pagto
                       {getSortIcon('forma_pagamento')}
                     </div>
                   </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment, index) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(installment.id)}
                        onCheckedChange={() => toggleSelectItem(installment.id, index)}
                        onClick={(e) => {
                          if (e.shiftKey) {
                            e.preventDefault();
                            toggleSelectItem(installment.id, index, true);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {installment.fornecedor}
                    </TableCell>
                    <TableCell>
                      <button 
                        className="text-left hover:text-primary cursor-pointer underline"
                        onClick={() => handleTitleClick(installment)}
                      >
                        {installment.descricao}
                      </button>
                    </TableCell>
                    <TableCell>{formatCurrency(installment.valor)}</TableCell>
                    <TableCell>
                      {installment.valor_total_titulo ? formatCurrency(installment.valor_total_titulo) : formatCurrency(installment.valor)}
                    </TableCell>
                    <TableCell>
                      {installment.total_parcelas > 1 ? 
                        `${installment.numero_parcela}/${installment.total_parcelas}` : 
                        '1/1'
                      }
                      {installment.eh_recorrente && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Repeat className="h-3 w-3" />
                          Recorrente
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {installment.numero_documento || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(installment.data_vencimento)}</TableCell>
                    <TableCell>{getStatusBadge(installment.status)}</TableCell>
                    <TableCell>{installment.categoria}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {installment.entidades?.nome || 'N/A'}
                        <div className="text-xs text-muted-foreground">
                          {installment.entidades?.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {installment.forma_pagamento || '-'}
                      {installment.banco && (
                        <div className="text-xs text-muted-foreground">{installment.banco}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {installment.status === 'pago' && installment.comprovante_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Visualizar comprovante
                              const { data } = supabase.storage
                                .from('receipts')
                                .getPublicUrl(installment.comprovante_path!);
                              window.open(data.publicUrl, '_blank');
                            }}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {installment.status === 'pago' && !installment.comprovante_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInstallmentForReceipt(installment.id);
                              setReceiptModalOpen(true);
                            }}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBankImportOpen(true)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingInstallment(installment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Parcela</DialogTitle>
                            </DialogHeader>
                            {editingInstallment && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="editFornecedor">Fornecedor</Label>
                                  <Input
                                    id="editFornecedor"
                                    value={editingInstallment.fornecedor}
                                    onChange={(e) => setEditingInstallment({
                                      ...editingInstallment,
                                      fornecedor: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="editDescricao">Descrição</Label>
                                  <Input
                                    id="editDescricao"
                                    value={editingInstallment.descricao}
                                    onChange={(e) => setEditingInstallment({
                                      ...editingInstallment,
                                      descricao: e.target.value
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="editValor">Valor</Label>
                                  <Input
                                    id="editValor"
                                    type="number"
                                    step="0.01"
                                    value={editingInstallment.valor}
                                    onChange={(e) => setEditingInstallment({
                                      ...editingInstallment,
                                      valor: parseFloat(e.target.value)
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="editVencimento">Data Vencimento</Label>
                                  <Input
                                    id="editVencimento"
                                    type="date"
                                    value={editingInstallment.data_vencimento}
                                    onChange={(e) => setEditingInstallment({
                                      ...editingInstallment,
                                      data_vencimento: e.target.value
                                    })}
                                  />
                                 </div>
                                 
                                 <div>
                                   <Label htmlFor="editEntidade">Entidade</Label>
                                   <select
                                     id="editEntidade"
                                     value={editingInstallment.entidade_id}
                                     onChange={(e) => setEditingInstallment({
                                       ...editingInstallment,
                                       entidade_id: e.target.value
                                     })}
                                     className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                   >
                                     {entidades.map(entidade => (
                                       <option key={entidade.id} value={entidade.id}>
                                         {entidade.nome} ({entidade.tipo})
                                       </option>
                                     ))}
                                   </select>
                                 </div>
                                 
                                 <div>
                                   <Label htmlFor="editObservacoes">Observações</Label>
                                   <Input
                                     id="editObservacoes"
                                     value={editingInstallment.observacoes || ""}
                                     onChange={(e) => setEditingInstallment({
                                       ...editingInstallment,
                                       observacoes: e.target.value
                                     })}
                                   />
                                 </div>

                                 <div>
                                   <Label htmlFor="editCategoria">Categoria</Label>
                                   <Input
                                     id="editCategoria"
                                     value={editingInstallment.categoria || ""}
                                     onChange={(e) => setEditingInstallment({
                                       ...editingInstallment,
                                       categoria: e.target.value
                                     })}
                                   />
                                 </div>

                                 <div>
                                   <Label htmlFor="editNumeroDocumento">Número Documento/NFe</Label>
                                   <Input
                                     id="editNumeroDocumento"
                                     value={editingInstallment.numero_documento || ""}
                                     onChange={(e) => setEditingInstallment({
                                       ...editingInstallment,
                                       numero_documento: e.target.value
                                     })}
                                   />
                                 </div>

                                 <div>
                                   <Label htmlFor="editValorTotal">Valor Total do Título</Label>
                                   <Input
                                     id="editValorTotal"
                                     type="number"
                                     step="0.01"
                                     value={editingInstallment.valor_total_titulo || editingInstallment.valor}
                                     onChange={(e) => setEditingInstallment({
                                       ...editingInstallment,
                                       valor_total_titulo: parseFloat(e.target.value)
                                     })}
                                   />
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                   <div>
                                     <Label htmlFor="editNumeroParcela">Parcela Número</Label>
                                     <Input
                                       id="editNumeroParcela"
                                       type="number"
                                       min="1"
                                       value={editingInstallment.numero_parcela || 1}
                                       onChange={(e) => setEditingInstallment({
                                         ...editingInstallment,
                                         numero_parcela: parseInt(e.target.value)
                                       })}
                                     />
                                   </div>
                                   <div>
                                     <Label htmlFor="editTotalParcelas">Total de Parcelas</Label>
                                     <Input
                                       id="editTotalParcelas"
                                       type="number"
                                       min="1"
                                       value={editingInstallment.total_parcelas || 1}
                                       onChange={(e) => setEditingInstallment({
                                         ...editingInstallment,
                                         total_parcelas: parseInt(e.target.value)
                                       })}
                                     />
                                   </div>
                                 </div>

                                 <div className="flex items-center space-x-2">
                                   <Checkbox
                                     id="editRecorrente"
                                     checked={editingInstallment.eh_recorrente || false}
                                     onCheckedChange={(checked) => setEditingInstallment({
                                       ...editingInstallment,
                                       eh_recorrente: checked as boolean
                                     })}
                                   />
                                   <Label htmlFor="editRecorrente">Despesa Recorrente</Label>
                                 </div>

                                 {editingInstallment.eh_recorrente && (
                                   <>
                                     <div>
                                       <Label htmlFor="editTipoRecorrencia">Tipo de Recorrência</Label>
                                       <select
                                         id="editTipoRecorrencia"
                                         value={editingInstallment.tipo_recorrencia || "mensal"}
                                         onChange={(e) => setEditingInstallment({
                                           ...editingInstallment,
                                           tipo_recorrencia: e.target.value
                                         })}
                                         className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                       >
                                         <option value="mensal">Mensal</option>
                                         <option value="bimestral">Bimestral</option>
                                         <option value="trimestral">Trimestral</option>
                                         <option value="semestral">Semestral</option>
                                         <option value="anual">Anual</option>
                                       </select>
                                     </div>

                                     <div className="flex items-center space-x-2">
                                       <Checkbox
                                         id="editValorFixo"
                                         checked={editingInstallment.valor_fixo || false}
                                         onCheckedChange={(checked) => setEditingInstallment({
                                           ...editingInstallment,
                                           valor_fixo: checked as boolean
                                         })}
                                       />
                                       <Label htmlFor="editValorFixo">Valor Fixo</Label>
                                     </div>
                                   </>
                                 )}
                                 
                                 <Button onClick={() => handleEdit(editingInstallment)}>
                                   Salvar Alterações
                                 </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {installment.status !== 'pago' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingInstallment(installment);
                                  setPaymentAmount(installment.valor.toString());
                                  setPaymentDate(new Date().toISOString().split('T')[0]);
                                  setDiscount("");
                                  setPaymentMethod("");
                                  setBank("");
                                  setDocumentNumber("");
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Pagamento</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="paymentDate">Data do Pagamento</Label>
                                  <Input
                                    id="paymentDate"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="paymentAmount">Valor Original</Label>
                                  <Input
                                    id="paymentAmount"
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="discount">Desconto (R$)</Label>
                                  <Input
                                    id="discount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                                  <select
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                  >
                                    <option value="">Selecione...</option>
                                    {FORMAS_PAGAMENTO.map(forma => (
                                      <option key={forma} value={forma}>{forma}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="bank">Banco</Label>
                                  <select
                                    id="bank"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                  >
                                    <option value="">Selecione...</option>
                                    {BANCOS.map(banco => (
                                      <option key={banco} value={banco}>{banco}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="documentNumber">Número do Documento</Label>
                                  <Input
                                    id="documentNumber"
                                    placeholder="Nº do cheque, comprovante, etc."
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                  />
                                </div>
                                
                                {discount && (
                                  <div className="bg-muted p-3 rounded-md">
                                    <p className="text-sm">
                                      <strong>Valor Final:</strong> {formatCurrency(
                                        parseFloat(paymentAmount) - parseFloat(discount || "0")
                                      )}
                                    </p>
                                  </div>
                                )}
                                
                                <Button 
                                  onClick={() => handlePayment(installment)}
                                  className="w-full"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Confirmar Pagamento
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Totalizador */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-orange-700">Em Aberto</div>
                <div className="text-lg font-bold text-orange-800">
                  {formatCurrency(totals.aberto)}
                </div>
                <div className="text-xs text-orange-600">
                  {filteredInstallments.filter(i => i.status === 'aberto').length} parcelas
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-red-700">Vencido</div>
                <div className="text-lg font-bold text-red-800">
                  {formatCurrency(totals.vencido)}
                </div>
                <div className="text-xs text-red-600">
                  {filteredInstallments.filter(i => i.status === 'vencido').length} parcelas
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-green-700">Pago</div>
                <div className="text-lg font-bold text-green-800">
                  {formatCurrency(totals.pago)}
                </div>
                <div className="text-xs text-green-600">
                  {filteredInstallments.filter(i => i.status === 'pago').length} parcelas
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-blue-700">Total Geral</div>
                <div className="text-lg font-bold text-blue-800">
                  {formatCurrency(totals.total)}
                </div>
                <div className="text-xs text-blue-600">
                  {filteredInstallments.length} parcelas
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Modal de Edição em Massa */}
        <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar {selectedItems.length} Itens Selecionados</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkEntidade">Entidade</Label>
                <select
                  id="bulkEntidade"
                  value={bulkEditData.entidade_id}
                  onChange={(e) => setBulkEditData({...bulkEditData, entidade_id: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="">Não alterar</option>
                  {entidades.map(entidade => (
                    <option key={entidade.id} value={entidade.id}>
                      {entidade.nome} ({entidade.tipo})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="bulkFornecedor">Fornecedor</Label>
                <Input
                  id="bulkFornecedor"
                  placeholder="Nome do fornecedor"
                  value={bulkEditData.fornecedor}
                  onChange={(e) => setBulkEditData({...bulkEditData, fornecedor: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="bulkDescricao">Descrição</Label>
                <Input
                  id="bulkDescricao"
                  placeholder="Nova descrição"
                  value={bulkEditData.descricao}
                  onChange={(e) => setBulkEditData({...bulkEditData, descricao: e.target.value})}
                />
              </div>
              
               <div>
                <Label htmlFor="bulkCategoria">Categoria</Label>
                <select
                  id="bulkCategoria"
                  value={bulkEditData.categoria}
                  onChange={(e) => setBulkEditData({...bulkEditData, categoria: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="">Não alterar</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="bulkFormaPagamento">Forma de Pagamento</Label>
                <select
                  id="bulkFormaPagamento"
                  value={bulkEditData.forma_pagamento}
                  onChange={(e) => setBulkEditData({...bulkEditData, forma_pagamento: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="">Não alterar</option>
                  {FORMAS_PAGAMENTO.map(forma => (
                    <option key={forma} value={forma}>{forma}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="bulkBanco">Banco</Label>
                <select
                  id="bulkBanco"
                  value={bulkEditData.banco}
                  onChange={(e) => setBulkEditData({...bulkEditData, banco: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="">Não alterar</option>
                  {BANCOS.map(banco => (
                    <option key={banco} value={banco}>{banco}</option>
                  ))}
                </select>
              </div>
              
               <div>
                 <Label htmlFor="bulkNumeroDocumento">Número Documento/NFe</Label>
                 <Input
                   id="bulkNumeroDocumento"
                   placeholder="Número do documento"
                   value={bulkEditData.numero_documento || ''}
                   onChange={(e) => setBulkEditData({...bulkEditData, numero_documento: e.target.value})}
                 />
               </div>

               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="bulkRecorrente"
                   checked={bulkEditData.eh_recorrente || false}
                   onCheckedChange={(checked) => setBulkEditData({...bulkEditData, eh_recorrente: checked as boolean})}
                 />
                 <Label htmlFor="bulkRecorrente">Marcar como Despesa Recorrente</Label>
               </div>

               {bulkEditData.eh_recorrente && (
                 <>
                   <div>
                     <Label htmlFor="bulkTipoRecorrencia">Tipo de Recorrência</Label>
                     <select
                       id="bulkTipoRecorrencia"
                       value={bulkEditData.tipo_recorrencia || "mensal"}
                       onChange={(e) => setBulkEditData({...bulkEditData, tipo_recorrencia: e.target.value})}
                       className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                     >
                       <option value="mensal">Mensal</option>
                       <option value="bimestral">Bimestral</option>
                       <option value="trimestral">Trimestral</option>
                       <option value="semestral">Semestral</option>
                       <option value="anual">Anual</option>
                     </select>
                   </div>

                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="bulkValorFixo"
                       checked={bulkEditData.valor_fixo || false}
                       onCheckedChange={(checked) => setBulkEditData({...bulkEditData, valor_fixo: checked as boolean})}
                     />
                     <Label htmlFor="bulkValorFixo">Valor Fixo</Label>
                   </div>
                 </>
               )}

               <div>
                <Label htmlFor="bulkDataVencimento">Data de Vencimento</Label>
                <Input
                  id="bulkDataVencimento"
                  type="date"
                  value={bulkEditData.data_vencimento}
                  onChange={(e) => setBulkEditData({...bulkEditData, data_vencimento: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="bulkValorAjuste">Ajuste de Valor</Label>
                <Input
                  id="bulkValorAjuste"
                  placeholder="Ex: +10%, -5%, +100, -50"
                  value={bulkEditData.valor_adjustment}
                  onChange={(e) => setBulkEditData({...bulkEditData, valor_adjustment: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use +10% ou -5% para percentual, +100 ou -50 para valor fixo
                </p>
              </div>
              
              <Button onClick={handleBulkEdit} className="w-full">
                Aplicar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Importação */}
        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Dados</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="importFile">Arquivo CSV</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O arquivo deve ter as colunas: Fornecedor, Descrição, Valor, Data Vencimento, Categoria
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium mb-2">Formato esperado:</h4>
                <pre className="text-xs">
                  Fornecedor,Descrição,Valor,Data Vencimento,Categoria{'\n'}
                  "Empresa XYZ","Serviços de TI",1500.00,2024-02-15,Fornecedores
                </pre>
              </div>
              
              <p className="text-sm text-yellow-600">
                ⚠️ Duplicatas baseadas em Fornecedor + Descrição não serão importadas
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Anexo de Comprovante */}
        <UploadReceiptModal
          isOpen={receiptModalOpen}
          onOpenChange={setReceiptModalOpen}
          installmentId={selectedInstallmentForReceipt}
          onSuccess={() => {
            loadInstallments();
            onDataChange();
          }}
        />

        {/* Modal de Importação de Extrato Bancário */}
        <BankStatementImport
          isOpen={bankImportOpen}
          onOpenChange={setBankImportOpen}
          onSuccess={() => {
            loadInstallments();
            onDataChange();
          }}
        />

        {/* Modal de Detalhamento do Título */}
        <TitleDetailModal
          isOpen={titleDetailOpen}
          onClose={() => setTitleDetailOpen(false)}
          titleInfo={selectedTitle}
          onDataChange={() => {
            loadInstallments();
            onDataChange();
          }}
        />

        {/* Modal de Despesa Recorrente */}
        <Dialog open={recurrentExpenseOpen} onOpenChange={setRecurrentExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Despesa Recorrente</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrent-fornecedor">Fornecedor</Label>
                  <Input
                    id="recurrent-fornecedor"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <Label htmlFor="recurrent-descricao">Descrição</Label>
                  <Input
                    id="recurrent-descricao"
                    placeholder="Ex: Aluguel, Energia elétrica"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrent-categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recurrent-entidade">Entidade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {entidades.map((entidade) => (
                        <SelectItem key={entidade.id} value={entidade.id}>
                          {entidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrent-valor-tipo">Tipo de Valor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Fixo ou Variável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixo">Valor Fixo</SelectItem>
                      <SelectItem value="variavel">Valor Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recurrent-valor">Valor (se fixo)</Label>
                  <Input
                    id="recurrent-valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrent-vencimento">Dia do Vencimento</Label>
                  <Input
                    id="recurrent-vencimento"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="recurrent-inicio">Data de Início</Label>
                  <Input
                    id="recurrent-inicio"
                    type="date"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRecurrentExpenseOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Criar Despesa Recorrente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Edit, Check, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    loadInstallments();
  }, []);

  useEffect(() => {
    filterInstallments();
  }, [installments, searchTerm, dateFilter, statusFilter]);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ap_installments')
        .select('*')
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

  const filterInstallments = () => {
    let filtered = installments;

    // Filtro por texto (descricao, fornecedor, numero NFe)
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nfe_id && item.nfe_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por data
    if (dateFilter) {
      filtered = filtered.filter(item => 
        item.data_vencimento === dateFilter
      );
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredInstallments(filtered);
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
          observacoes: installment.observacoes
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

  const CATEGORIAS = [
    'Contabilidade',
    'Aluguel',
    'Fornecedores',
    'Salários',
    'Impostos',
    'Energia',
    'Telefone',
    'Internet',
    'Água',
    'Manutenção',
    'Marketing',
    'Combustível',
    'Outras Despesas',
    'Geral'
  ];

  const FORMAS_PAGAMENTO = [
    'Dinheiro',
    'PIX',
    'Transferência Bancária',
    'Boleto Bancário',
    'Cartão de Débito',
    'Cartão de Crédito',
    'Cheque'
  ];

  const BANCOS = [
    'Banco do Brasil',
    'Caixa Econômica Federal',
    'Bradesco',
    'Itaú',
    'Santander',
    'Nubank',
    'Inter',
    'C6 Bank',
    'BTG Pactual',
    'Sicoob',
    'Sicredi',
    'Banrisul',
    'Safra',
    'Outro'
  ];

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
        <CardTitle>Contas a Pagar</CardTitle>
        
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma Pagto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell className="font-medium">
                      {installment.fornecedor}
                    </TableCell>
                    <TableCell>{installment.descricao}</TableCell>
                    <TableCell>{formatCurrency(installment.valor)}</TableCell>
                    <TableCell>{formatDate(installment.data_vencimento)}</TableCell>
                    <TableCell>{getStatusBadge(installment.status)}</TableCell>
                    <TableCell>{installment.categoria}</TableCell>
                    <TableCell>
                      {installment.forma_pagamento || '-'}
                      {installment.banco && (
                        <div className="text-xs text-muted-foreground">{installment.banco}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                                  <Label htmlFor="editCategoria">Categoria</Label>
                                  <select
                                    id="editCategoria"
                                    value={editingInstallment.categoria}
                                    onChange={(e) => setEditingInstallment({
                                      ...editingInstallment,
                                      categoria: e.target.value
                                    })}
                                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                  >
                                    {CATEGORIAS.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
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
      </CardContent>
    </Card>
  );
};
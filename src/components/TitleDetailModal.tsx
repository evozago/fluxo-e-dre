import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Save, X } from "lucide-react";
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
  forma_pagamento: string | null;
  dados_pagamento: string | null;
  numero_parcela: number;
  total_parcelas: number;
  valor_total_titulo: number;
  eh_recorrente: boolean;
  tipo_recorrencia: string | null;
  valor_fixo: boolean;
}

interface TitleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleInfo: {
    nfe_id?: string | null;
    fornecedor: string;
    descricao: string;
    valor_total_titulo: number;
  } | null;
  onDataChange: () => void;
}

export const TitleDetailModal = ({ isOpen, onClose, titleInfo, onDataChange }: TitleDetailModalProps) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingObservation, setEditingObservation] = useState<string>("");
  const [editingInstallmentId, setEditingInstallmentId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && titleInfo) {
      loadTitleInstallments();
    }
  }, [isOpen, titleInfo]);

  const loadTitleInstallments = async () => {
    if (!titleInfo) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('ap_installments')
        .select('*')
        .eq('fornecedor', titleInfo.fornecedor)
        .eq('descricao', titleInfo.descricao);

      if (titleInfo.nfe_id) {
        query = query.eq('nfe_id', titleInfo.nfe_id);
      }

      const { data, error } = await query.order('numero_parcela', { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error) {
      console.error('Erro ao carregar parcelas do título:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as parcelas do título",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const handleSaveObservation = async (installmentId: string) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({ observacoes: editingObservation })
        .eq('id', installmentId);

      if (error) throw error;

      toast({
        title: "Observação Salva",
        description: "A observação foi atualizada com sucesso"
      });

      loadTitleInstallments();
      onDataChange();
      setEditingInstallmentId("");
      setEditingObservation("");
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a observação",
        variant: "destructive"
      });
    }
  };

  const startEditingObservation = (installment: Installment) => {
    setEditingInstallmentId(installment.id);
    setEditingObservation(installment.observacoes || "");
  };

  const cancelEditingObservation = () => {
    setEditingInstallmentId("");
    setEditingObservation("");
  };

  if (!titleInfo) return null;

  const totalPago = installments.filter(i => i.status === 'pago').reduce((sum, i) => sum + i.valor, 0);
  const totalAberto = installments.filter(i => i.status !== 'pago').reduce((sum, i) => sum + i.valor, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento do Título</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Título */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <strong>Fornecedor:</strong> {titleInfo.fornecedor}
              </div>
              <div>
                <strong>Descrição:</strong> {titleInfo.descricao}
              </div>
              <div>
                <strong>Valor Total:</strong> {formatCurrency(titleInfo.valor_total_titulo)}
              </div>
              <div>
                <strong>Total de Parcelas:</strong> {installments.length}
              </div>
              <div>
                <strong>Valor Pago:</strong> <span className="text-green-600">{formatCurrency(totalPago)}</span>
              </div>
              <div>
                <strong>Valor em Aberto:</strong> <span className="text-red-600">{formatCurrency(totalAberto)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Parcelas */}
          <Card>
            <CardHeader>
              <CardTitle>Parcelas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Forma Pgto</TableHead>
                        <TableHead>Dados Pgto</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>
                          {installment.eh_recorrente ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-blue-600 font-medium">Recorrente</span>
                              <span className="text-xs text-muted-foreground">({installment.tipo_recorrencia})</span>
                            </div>
                          ) : (
                            `${installment.numero_parcela}/${installment.total_parcelas}`
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(installment.valor)}</TableCell>
                        <TableCell>{formatDate(installment.data_vencimento)}</TableCell>
                        <TableCell>
                          {installment.data_pagamento ? formatDate(installment.data_pagamento) : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {installment.forma_pagamento || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {installment.dados_pagamento || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingInstallmentId === installment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingObservation}
                                onChange={(e) => setEditingObservation(e.target.value)}
                                placeholder="Digite a observação..."
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveObservation(installment.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={cancelEditingObservation}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="flex-1">
                                {installment.observacoes || "Sem observações"}
                              </span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => startEditingObservation(installment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Aqui podem ser adicionadas outras ações como marcar como pago */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
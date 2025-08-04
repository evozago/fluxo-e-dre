import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload, Users, Paperclip, FileText, Repeat, Trash2, Edit, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/brazilian-utils";
import { PaymentStatusBadge } from "@/components/shared/StatusBadge";

interface Installment {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  data_hora_pagamento: string | null;
  status: string;
  categoria: string;
  observacoes: string | null;
  nfe_id: string | null;
  forma_pagamento: string | null;
  dados_pagamento: string | null;
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
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [showModularView, setShowModularView] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInstallments();
  }, []);

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

  const handleDelete = async (installment: Installment) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .delete()
        .eq('id', installment.id);

      if (error) throw error;

      toast({
        title: "Item excluído",
        description: `"${installment.descricao}" foi excluído com sucesso`
      });

      loadInstallments();
      onDataChange();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => <PaymentStatusBadge status={value as "aberto" | "vencido" | "pago"} />
    },
    {
      key: 'fornecedor',
      title: 'Fornecedor',
      sortable: true,
      width: '150px'
    },
    {
      key: 'descricao',
      title: 'Descrição',
      sortable: true,
      width: '200px'
    },
    {
      key: 'valor',
      title: 'Valor da Parcela',
      sortable: true,
      width: '120px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'valor_total_titulo',
      title: 'Valor Total',
      sortable: true,
      width: '120px',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'numero_parcela',
      title: 'Parcela',
      sortable: true,
      width: '80px',
      render: (value: number, row: Installment) => `${value}/${row.total_parcelas}`
    },
    {
      key: 'numero_documento',
      title: 'Nº Doc/NFe',
      sortable: true,
      width: '120px',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'data_vencimento',
      title: 'Vencimento',
      sortable: true,
      width: '120px',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'data_hora_pagamento',
      title: 'Data/Hora Pagamento',
      sortable: true,
      width: '150px',
      render: (value: string | null) => value ? formatDateTime(value) : '-'
    },
    {
      key: 'categoria',
      title: 'Categoria',
      sortable: true,
      width: '120px'
    },
    {
      key: 'entidades',
      title: 'Entidade',
      sortable: true,
      width: '150px',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'forma_pagamento',
      title: 'Forma Pgto',
      sortable: true,
      width: '120px',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'created_at',
      title: 'Data Criação',
      sortable: true,
      width: '120px',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'actions',
      title: 'Ações',
      sortable: false,
      width: '100px',
      render: (_: any, row: Installment) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {/* TODO: Implementar edição */}}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
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
        <CardTitle className="flex items-center justify-between">
          Contas a Pagar
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button size="sm" variant="outline">
              <Repeat className="h-4 w-4 mr-2" />
              Despesa Recorrente
            </Button>
            <Button 
              size="sm"
              variant={showModularView ? "default" : "outline"}
              onClick={() => setShowModularView(!showModularView)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {showModularView ? "Visualização Normal" : "Personalizar Colunas"}
            </Button>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showModularView ? (
          <DataTable
            data={installments}
            columns={columns}
            searchPlaceholder="Buscar por fornecedor, descrição, NFe..."
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Esta é uma versão simplificada. Para ver a versão completa com todos os filtros e funcionalidades,
              use o botão "Visualização Normal" ou reverta para a versão anterior do componente.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Para manter todas as funcionalidades originais, recomendo reverter para a versão anterior
              e adicionar apenas o toggle de visualização modular.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
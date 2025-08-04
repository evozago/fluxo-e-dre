import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/brazilian-utils";

interface RecurrentExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedores: { id: string; nome: string }[];
  entidades: { id: string; nome: string; tipo: string }[];
  onSuccess: () => void;
}

export const RecurrentExpenseModal = ({ 
  open, 
  onOpenChange, 
  fornecedores, 
  entidades, 
  onSuccess 
}: RecurrentExpenseModalProps) => {
  const [formData, setFormData] = useState({
    fornecedor: "",
    descricao: "",
    categoria: "",
    entidadeId: "",
    tipoValor: "",
    valor: "",
    diaVencimento: "",
    dataInicio: "",
    dataFinal: ""
  });
  const { toast } = useToast();

  const CATEGORIAS = [
    'Contabilidade', 'Aluguel', 'Fornecedores', 'Salários', 'Impostos',
    'Energia', 'Telefone', 'Internet', 'Água', 'Manutenção',
    'Marketing', 'Combustível', 'Outras Despesas', 'Geral'
  ];

  const handleSubmit = async () => {
    if (!formData.fornecedor || !formData.descricao || !formData.entidadeId || !formData.dataInicio) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.tipoValor === "fixo" && (!formData.valor || parseFloat(formData.valor) <= 0)) {
      toast({
        title: "Erro",
        description: "Para valor fixo, informe um valor válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const dataInicial = new Date(formData.dataInicio);
      const dataFinal = formData.dataFinal ? new Date(formData.dataFinal) : null;
      
      // Gerar até a data final ou 120 meses (10 anos) se não especificada
      let numMeses = 120;
      
      if (dataFinal) {
        const diffTime = dataFinal.getTime() - dataInicial.getTime();
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        numMeses = Math.max(1, diffMonths + 1);
      }

      const installments = [];
      const baseData = {
        descricao: formData.descricao,
        fornecedor: formData.fornecedor,
        categoria: formData.categoria || 'Geral',
        entidade_id: formData.entidadeId,
        status: 'aberto',
        eh_recorrente: true,
        tipo_recorrencia: 'mensal',
        valor_fixo: formData.tipoValor === 'fixo'
      };

      for (let i = 0; i < numMeses; i++) {
        let dataVencimento = new Date(dataInicial);
        
        if (formData.diaVencimento) {
          // Se especificou dia de vencimento, usar esse dia
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          dataVencimento.setDate(parseInt(formData.diaVencimento));
        } else {
          // Senão, usar a data inicial como base
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
        }
        
        // Para despesas recorrentes, só gerar até a data final se especificada
        if (dataFinal && dataVencimento > dataFinal) break;
        
        const valorParcela = formData.tipoValor === 'fixo' ? parseFloat(formData.valor) : 0;
        
        // Gerar numero_documento para despesas recorrentes
        const dataDocumento = dataVencimento.toISOString().split('T')[0].replace(/-/g, '');
        const numeroDocumento = `REC-${dataDocumento}-${String(i + 1).padStart(3, '0')}`;
        
        installments.push({
          ...baseData,
          valor: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          numero_documento: numeroDocumento,
          eh_recorrente: true,
          tipo_recorrencia: 'mensal',
          valor_fixo: formData.tipoValor === 'fixo',
          valor_total_titulo: valorParcela || null
        });
      }

      const { error } = await supabase
        .from('ap_installments')
        .insert(installments);

      if (error) throw error;

      toast({
        title: "Despesa recorrente criada com sucesso",
        description: `${installments.length} parcelas mensais de ${formData.descricao} cadastradas`
      });

      setFormData({
        fornecedor: "",
        descricao: "",
        categoria: "",
        entidadeId: "",
        tipoValor: "",
        valor: "",
        diaVencimento: "",
        dataInicio: "",
        dataFinal: ""
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar despesa recorrente:', error);
      toast({
        title: "Erro ao criar despesa recorrente",
        description: "Não foi possível cadastrar a despesa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Despesa Recorrente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recurrent-fornecedor">Fornecedor *</Label>
              <Select onValueChange={(value) => {
                const fornecedor = fornecedores.find(f => f.id === value);
                setFormData(prev => ({ ...prev, fornecedor: fornecedor?.nome || value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                placeholder="Ou digite o nome do fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="recurrent-descricao">Descrição *</Label>
              <Input
                id="recurrent-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Aluguel, Energia elétrica"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recurrent-categoria">Categoria</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
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
              <Label htmlFor="recurrent-entidade">Entidade *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, entidadeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a entidade" />
                </SelectTrigger>
                <SelectContent>
                  {entidades.map((entidade) => (
                    <SelectItem key={entidade.id} value={entidade.id}>
                      {entidade.nome} ({entidade.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recurrent-valor-tipo">Tipo de Valor *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, tipoValor: value }))}>
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
              <Label htmlFor="recurrent-valor">
                Valor {formData.tipoValor === 'fixo' ? '*' : '(opcional)'}
              </Label>
              <Input
                id="recurrent-valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0,00"
                disabled={formData.tipoValor === 'variavel'}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="recurrent-vencimento">Dia do Vencimento</Label>
              <Input
                id="recurrent-vencimento"
                type="number"
                min="1"
                max="31"
                value={formData.diaVencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, diaVencimento: e.target.value }))}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe vazio para usar o mesmo dia da data inicial
              </p>
            </div>
            <div>
              <Label htmlFor="recurrent-inicio">Data de Início *</Label>
              <Input
                id="recurrent-inicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="recurrent-final">Data Final (opcional)</Label>
              <Input
                id="recurrent-final"
                type="date"
                value={formData.dataFinal}
                onChange={(e) => setFormData(prev => ({ ...prev, dataFinal: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe vazio para recorrência infinita
              </p>
            </div>
          </div>
          
          {formData.valor && formData.tipoValor === 'fixo' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm">
                <strong>Valor da despesa:</strong> {formatCurrency(parseFloat(formData.valor))} mensais
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Criar Despesa Recorrente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
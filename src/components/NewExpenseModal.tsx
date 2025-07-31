import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NewExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewExpenseModal = ({ open, onOpenChange }: NewExpenseModalProps) => {
  const [formData, setFormData] = useState({
    description: "",
    supplier: "",
    value: "",
    dueDate: "",
    dataInicial: "",
    dataFinal: "",
    category: "",
    recurring: false,
    isInstallment: false,
    numeroParcelasField: "1",
    entidadeId: "",
    formaPagamento: "",
    dadosPagamento: "",
    tipoPix: ""
  });
  const [entidades, setEntidades] = useState<{id: string, nome: string, tipo: string}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadEntidades = async () => {
      const { data } = await supabase
        .from('entidades')
        .select('id, nome, tipo')
        .eq('ativo', true);
      setEntidades(data || []);
    };
    if (open) loadEntidades();
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.description || !formData.supplier || !formData.value || !formData.entidadeId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!formData.recurring && !formData.isInstallment && !formData.dueDate) {
      toast({
        title: "Erro",
        description: "Para despesas simples, a data de vencimento é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (formData.recurring && !formData.dataInicial) {
      toast({
        title: "Erro",
        description: "Para despesas recorrentes, a data inicial é obrigatória",
        variant: "destructive"
      });
      return;
    }

    try {
      const baseData = {
        descricao: formData.description,
        fornecedor: formData.supplier,
        valor: parseFloat(formData.value),
        categoria: formData.category || 'Geral',
        entidade_id: formData.entidadeId,
        forma_pagamento: formData.formaPagamento || null,
        dados_pagamento: formData.formaPagamento === 'PIX' && formData.tipoPix ? 
          `${formData.dadosPagamento} (${formData.tipoPix})` : 
          formData.dadosPagamento || null,
        status: 'aberto'
      };

      if (formData.recurring) {
        // Despesa recorrente
        const installmentData = {
          ...baseData,
          data_vencimento: formData.dataInicial,
          eh_recorrente: true,
          tipo_recorrencia: 'mensal',
          valor_fixo: true
        };

        const { error } = await supabase
          .from('ap_installments')
          .insert(installmentData);

        if (error) throw error;

        toast({
          title: "Despesa recorrente criada com sucesso",
          description: `Despesa recorrente de ${formData.description} no valor de R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cadastrada`
        });
      } else if (formData.isInstallment) {
        // Despesa parcelada
        const numParcelas = parseInt(formData.numeroParcelasField);
        const valorParcela = parseFloat(formData.value) / numParcelas;
        const dataInicial = new Date(formData.dataInicial);

        const installments = [];
        for (let i = 0; i < numParcelas; i++) {
          const dataVencimento = new Date(dataInicial);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          installments.push({
            ...baseData,
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            numero_parcela: i + 1,
            total_parcelas: numParcelas,
            valor_total_titulo: parseFloat(formData.value),
            eh_recorrente: false
          });
        }

        const { error } = await supabase
          .from('ap_installments')
          .insert(installments);

        if (error) throw error;

        toast({
          title: "Despesa parcelada criada com sucesso",
          description: `${numParcelas} parcelas de R$ ${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cadastradas`
        });
      } else {
        // Despesa simples
        const installmentData = {
          ...baseData,
          data_vencimento: formData.dueDate,
          eh_recorrente: false
        };

        const { error } = await supabase
          .from('ap_installments')
          .insert(installmentData);

        if (error) throw error;

        toast({
          title: "Despesa criada com sucesso",
          description: `Despesa de ${formData.description} no valor de R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cadastrada`
        });
      }
      
      setFormData({
        description: "",
        supplier: "",
        value: "",
        dueDate: "",
        dataInicial: "",
        dataFinal: "",
        category: "",
        recurring: false,
        isInstallment: false,
        numeroParcelasField: "1",
        entidadeId: "",
        formaPagamento: "",
        dadosPagamento: "",
        tipoPix: ""
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro ao criar despesa",
        description: "Não foi possível cadastrar a despesa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Despesa Manual</DialogTitle>
          <DialogDescription>
            Cadastre uma nova despesa manualmente
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Aluguel, Água, Energia..."
            />
          </div>

          <div>
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div>
            <Label htmlFor="value">Valor *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="0,00"
            />
          </div>

          {/* Data de Vencimento para despesas simples */}
          {!formData.recurring && !formData.isInstallment && (
            <div>
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          )}

          {/* Data Inicial para despesas recorrentes ou parceladas */}
          {(formData.recurring || formData.isInstallment) && (
            <div>
              <Label htmlFor="dataInicial">
                {formData.recurring ? 'Data Inicial *' : 'Data da Primeira Parcela *'}
              </Label>
              <Input
                id="dataInicial"
                type="date"
                value={formData.dataInicial}
                onChange={(e) => setFormData(prev => ({ ...prev, dataInicial: e.target.value }))}
              />
            </div>
          )}

          {/* Data Final (opcional) para despesas recorrentes */}
          {formData.recurring && (
            <div>
              <Label htmlFor="dataFinal">Data Final (opcional)</Label>
              <Input
                id="dataFinal"
                type="date"
                value={formData.dataFinal}
                onChange={(e) => setFormData(prev => ({ ...prev, dataFinal: e.target.value }))}
              />
            </div>
          )}

          {/* Número de Parcelas para despesas parceladas */}
          {formData.isInstallment && (
            <div>
              <Label htmlFor="numeroParcelas">Número de Parcelas *</Label>
              <Input
                id="numeroParcelas"
                type="number"
                min="1"
                max="120"
                value={formData.numeroParcelasField}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroParcelasField: e.target.value }))}
                placeholder="1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="entidade">Entidade *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, entidadeId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a entidade" />
              </SelectTrigger>
              <SelectContent>
                {entidades.map(entidade => (
                  <SelectItem key={entidade.id} value={entidade.id}>
                    {entidade.nome} ({entidade.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
                <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                <SelectItem value="Salários">Salários</SelectItem>
                <SelectItem value="Impostos">Impostos</SelectItem>
                <SelectItem value="Energia">Energia</SelectItem>
                <SelectItem value="Telefone">Telefone</SelectItem>
                <SelectItem value="Internet">Internet</SelectItem>
                <SelectItem value="Água">Água</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Combustível">Combustível</SelectItem>
                <SelectItem value="Outras Despesas">Outras Despesas</SelectItem>
                <SelectItem value="Geral">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Débito Automático">Débito Automático</SelectItem>
                <SelectItem value="Outras">Outras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de PIX quando PIX for selecionado */}
          {formData.formaPagamento === 'PIX' && (
            <div>
              <Label htmlFor="tipoPix">Tipo de Chave PIX</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, tipoPix: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de chave PIX" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="Email">E-mail</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                  <SelectItem value="Chave Aleatória">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="dadosPagamento">Dados do Pagamento</Label>
            <Input
              id="dadosPagamento"
              value={formData.dadosPagamento}
              onChange={(e) => setFormData(prev => ({ ...prev, dadosPagamento: e.target.value }))}
              placeholder={
                formData.formaPagamento === 'PIX' ? 'Informe a chave PIX' :
                formData.formaPagamento === 'Boleto' ? 'Código de barras ou linha digitável' :
                formData.formaPagamento === 'Transferência' ? 'Banco, agência e conta' :
                formData.formaPagamento === 'Cartão de Débito' || formData.formaPagamento === 'Cartão de Crédito' ? 'Últimos 4 dígitos do cartão' :
                'Informações adicionais sobre o pagamento'
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.recurring}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  recurring: checked,
                  isInstallment: checked ? false : prev.isInstallment 
                }))}
              />
              <Label htmlFor="recurring">Despesa recorrente (mensal)</Label>
            </div>

            {!formData.recurring && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isInstallment"
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isInstallment: checked }))}
                />
                <Label htmlFor="isInstallment">Despesa parcelada</Label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Cadastrar Despesa
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
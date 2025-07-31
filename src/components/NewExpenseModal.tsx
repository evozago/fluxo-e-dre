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
    category: "",
    recurring: false,
    entidadeId: ""
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
    if (!formData.description || !formData.supplier || !formData.value || !formData.dueDate || !formData.entidadeId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const installmentData = {
        descricao: formData.description,
        fornecedor: formData.supplier,
        valor: parseFloat(formData.value),
        data_vencimento: formData.dueDate,
        categoria: formData.category || 'Geral',
        entidade_id: formData.entidadeId,
        eh_recorrente: formData.recurring,
        tipo_recorrencia: formData.recurring ? 'mensal' : null,
        status: 'aberto'
      };

      const { error } = await supabase
        .from('ap_installments')
        .insert(installmentData);

      if (error) throw error;

      toast({
        title: "Despesa criada com sucesso",
        description: `${formData.recurring ? 'Despesa recorrente' : 'Despesa'} de ${formData.description} no valor de R$ ${parseFloat(formData.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cadastrada`
      });
      
      setFormData({
        description: "",
        supplier: "",
        value: "",
        dueDate: "",
        category: "",
        recurring: false,
        entidadeId: ""
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

          <div>
            <Label htmlFor="dueDate">Data de Vencimento *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

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

          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={formData.recurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
            />
            <Label htmlFor="recurring">Despesa recorrente</Label>
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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FornecedorQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFornecedorAdded: (fornecedor: {id: string, nome: string}) => void;
}

export const FornecedorQuickAdd = ({ open, onOpenChange, onFornecedorAdded }: FornecedorQuickAddProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj_cpf: "",
    email: "",
    telefone: "",
    endereco: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do fornecedor é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({
          nome: formData.nome.trim(),
          cnpj_cpf: formData.cnpj_cpf.trim() || null,
          email: formData.email.trim() || null,
          telefone: formData.telefone.trim() || null,
          endereco: formData.endereco.trim() || null,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Fornecedor criado",
        description: `${formData.nome} foi cadastrado com sucesso`
      });

      onFornecedorAdded({ id: data.id, nome: data.nome });
      
      // Reset form
      setFormData({
        nome: "",
        cnpj_cpf: "",
        email: "",
        telefone: "",
        endereco: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o fornecedor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Cadastrar Novo Fornecedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome/Razão Social *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Empresa LTDA, João Silva..."
            />
          </div>

          <div>
            <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
            <Input
              id="cnpj_cpf"
              value={formData.cnpj_cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contato@fornecedor.com"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Rua, número, bairro, cidade..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Cadastrando..." : "Cadastrar Fornecedor"}
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
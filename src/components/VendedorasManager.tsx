import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, Users, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VendedorasManagerProps {
  onVendedoraChange?: () => void;
}

interface Vendedora {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  meta_mensal: number;
  comissao_padrao: number;
  comissao_supermeta: number;
  ativo: boolean;
  created_at: string;
}

export const VendedorasManager = ({ onVendedoraChange }: VendedorasManagerProps) => {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendedora, setEditingVendedora] = useState<Vendedora | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    meta_mensal: "",
    comissao_padrao: "3.0",
    comissao_supermeta: "5.0"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadVendedoras();
  }, []);

  const loadVendedoras = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('vendedoras')
        .select('*')
        .order('nome');

      if (error) throw error;
      setVendedoras(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendedoras:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendedoras",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da vendedora é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      const vendedoraData = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        meta_mensal: parseFloat(formData.meta_mensal) || 0,
        comissao_padrao: parseFloat(formData.comissao_padrao) || 3.0,
        comissao_supermeta: parseFloat(formData.comissao_supermeta) || 5.0,
        ativo: true
      };

      if (editingVendedora) {
        // Atualizar vendedora existente
        const { error } = await supabase
          .from('vendedoras')
          .update(vendedoraData)
          .eq('id', editingVendedora.id);

        if (error) throw error;

        toast({
          title: "Vendedora atualizada",
          description: "Dados da vendedora foram atualizados com sucesso"
        });
      } else {
        // Criar nova vendedora
        const { error } = await supabase
          .from('vendedoras')
          .insert(vendedoraData);

        if (error) throw error;

        toast({
          title: "Vendedora criada",
          description: "Nova vendedora foi criada com sucesso"
        });
      }

      loadVendedoras();
      onVendedoraChange?.();
      setModalOpen(false);
      setEditingVendedora(null);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        meta_mensal: "",
        comissao_padrao: "3.0",
        comissao_supermeta: "5.0"
      });
    } catch (error: any) {
      console.error('Erro ao salvar vendedora:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a vendedora",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (vendedora: Vendedora) => {
    setEditingVendedora(vendedora);
    setFormData({
      nome: vendedora.nome,
      email: vendedora.email || "",
      telefone: vendedora.telefone || "",
      meta_mensal: vendedora.meta_mensal.toString(),
      comissao_padrao: vendedora.comissao_padrao.toString(),
      comissao_supermeta: vendedora.comissao_supermeta.toString()
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (vendedora: Vendedora) => {
    try {
      const { error } = await supabase
        .from('vendedoras')
        .update({ ativo: !vendedora.ativo })
        .eq('id', vendedora.id);

      if (error) throw error;

      toast({
        title: vendedora.ativo ? "Vendedora desativada" : "Vendedora ativada",
        description: `${vendedora.nome} foi ${vendedora.ativo ? 'desativada' : 'ativada'} com sucesso`
      });

      loadVendedoras();
      onVendedoraChange?.();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da vendedora",
        variant: "destructive"
      });
    }
  };

  const openNewModal = () => {
    setEditingVendedora(null);
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      meta_mensal: "",
      comissao_padrao: "3.0",
      comissao_supermeta: "5.0"
    });
    setModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando vendedoras...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Vendedoras
          </CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Vendedora
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {vendedoras.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma vendedora cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Meta Mensal</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedoras.map((vendedora) => (
                  <TableRow key={vendedora.id}>
                    <TableCell className="font-medium">{vendedora.nome}</TableCell>
                    <TableCell>
                      {vendedora.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {vendedora.email}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {vendedora.telefone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {vendedora.telefone}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {vendedora.meta_mensal > 0 ? formatCurrency(vendedora.meta_mensal) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Padrão: {vendedora.comissao_padrao}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Super: {vendedora.comissao_supermeta}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendedora.ativo ? "default" : "secondary"}>
                        {vendedora.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(vendedora)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(vendedora)}
                        >
                          {vendedora.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal para Criar/Editar Vendedora */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVendedora ? 'Editar Vendedora' : 'Nova Vendedora'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome da vendedora"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="meta_mensal">Meta Mensal (R$)</Label>
                  <Input
                    id="meta_mensal"
                    type="number"
                    step="0.01"
                    value={formData.meta_mensal}
                    onChange={(e) => setFormData({...formData, meta_mensal: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="comissao_padrao">Comissão Padrão (%)</Label>
                  <Input
                    id="comissao_padrao"
                    type="number"
                    step="0.1"
                    value={formData.comissao_padrao}
                    onChange={(e) => setFormData({...formData, comissao_padrao: e.target.value})}
                    placeholder="3.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="comissao_supermeta">Comissão Supermeta (%)</Label>
                  <Input
                    id="comissao_supermeta"
                    type="number"
                    step="0.1"
                    value={formData.comissao_supermeta}
                    onChange={(e) => setFormData({...formData, comissao_supermeta: e.target.value})}
                    placeholder="5.0"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingVendedora ? 'Atualizar' : 'Criar'} Vendedora
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
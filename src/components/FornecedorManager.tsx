import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface FornecedorManagerProps {
  onFornecedorChange?: () => void;
}

export const FornecedorManager = ({ onFornecedorChange }: FornecedorManagerProps) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj_cpf: "",
    email: "",
    telefone: "",
    endereco: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFornecedores();
  }, []);

  useEffect(() => {
    filterFornecedores();
  }, [fornecedores, searchTerm]);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFornecedores = () => {
    let filtered = fornecedores.filter(f => f.ativo);

    if (searchTerm) {
      filtered = filtered.filter(fornecedor => 
        fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fornecedor.cnpj_cpf && fornecedor.cnpj_cpf.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredFornecedores(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do fornecedor é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingFornecedor) {
        // Atualizar fornecedor existente
        const { error } = await supabase
          .from('fornecedores')
          .update({
            nome: formData.nome,
            cnpj_cpf: formData.cnpj_cpf || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFornecedor.id);

        if (error) throw error;

        toast({
          title: "Fornecedor atualizado",
          description: "Dados do fornecedor foram atualizados com sucesso"
        });
      } else {
        // Criar novo fornecedor
        const { error } = await supabase
          .from('fornecedores')
          .insert({
            nome: formData.nome,
            cnpj_cpf: formData.cnpj_cpf || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
            ativo: true
          });

        if (error) throw error;

        toast({
          title: "Fornecedor criado",
          description: "Novo fornecedor foi criado com sucesso"
        });
      }

      loadFornecedores();
      onFornecedorChange?.();
      setIsModalOpen(false);
      setEditingFornecedor(null);
      setFormData({
        nome: "",
        cnpj_cpf: "",
        email: "",
        telefone: "",
        endereco: ""
      });
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o fornecedor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      cnpj_cpf: fornecedor.cnpj_cpf || "",
      email: fornecedor.email || "",
      telefone: fornecedor.telefone || "",
      endereco: fornecedor.endereco || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este fornecedor?")) return;

    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Fornecedor desativado",
        description: "O fornecedor foi desativado com sucesso"
      });

      loadFornecedores();
      onFornecedorChange?.();
    } catch (error: any) {
      console.error('Erro ao desativar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o fornecedor",
        variant: "destructive"
      });
    }
  };

  const openNewModal = () => {
    setEditingFornecedor(null);
    setFormData({
      nome: "",
      cnpj_cpf: "",
      email: "",
      telefone: "",
      endereco: ""
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando fornecedores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fornecedores</CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome ou CNPJ/CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredFornecedores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                    <TableCell>{fornecedor.cnpj_cpf || '-'}</TableCell>
                    <TableCell>{fornecedor.email || '-'}</TableCell>
                    <TableCell>{fornecedor.telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fornecedor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal para Criar/Editar Fornecedor */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome do fornecedor"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
                <Input
                  id="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({...formData, cnpj_cpf: e.target.value})}
                  placeholder="00.000.000/0001-00 ou 000.000.000-00"
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
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingFornecedor ? 'Atualizar' : 'Criar'} Fornecedor
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
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
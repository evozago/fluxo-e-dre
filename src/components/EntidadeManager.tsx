import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, Building, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Entidade {
  id: string;
  nome: string;
  tipo: 'PJ' | 'PF';
  cnpj_cpf: string | null;
  razao_social: string | null;
  ativo: boolean;
}

interface EntidadeManagerProps {
  onEntidadeChange?: () => void;
}

export const EntidadeManager = ({ onEntidadeChange }: EntidadeManagerProps) => {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null);
  const [sortField, setSortField] = useState<string>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filteredEntidades, setFilteredEntidades] = useState<Entidade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "PJ" as 'PJ' | 'PF',
    cnpj_cpf: "",
    razao_social: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEntidades();
  }, []);

  useEffect(() => {
    filterEntidades();
  }, [entidades, searchTerm, sortField, sortDirection]);

  const loadEntidades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEntidades((data || []) as Entidade[]);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as entidades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEntidades = () => {
    let filtered = [...entidades];

    if (searchTerm) {
      filtered = filtered.filter(entidade => 
        entidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entidade.cnpj_cpf && entidade.cnpj_cpf.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      switch (sortField) {
        case 'nome':
          aValue = a.nome || '';
          bValue = b.nome || '';
          break;
        case 'tipo':
          aValue = a.tipo || '';
          bValue = b.tipo || '';
          break;
        case 'cnpj_cpf':
          aValue = a.cnpj_cpf || '';
          bValue = b.cnpj_cpf || '';
          break;
        default:
          aValue = a.nome || '';
          bValue = b.nome || '';
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredEntidades(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingEntidade) {
        // Atualizar entidade existente
        const { error } = await supabase
          .from('entidades')
          .update({
            nome: formData.nome,
            tipo: formData.tipo,
            cnpj_cpf: formData.cnpj_cpf || null,
            razao_social: formData.razao_social || null
          })
          .eq('id', editingEntidade.id);

        if (error) throw error;

        toast({
          title: "Entidade Atualizada",
          description: "A entidade foi atualizada com sucesso"
        });
      } else {
        // Criar nova entidade
        const { error } = await supabase
          .from('entidades')
          .insert({
            nome: formData.nome,
            tipo: formData.tipo,
            cnpj_cpf: formData.cnpj_cpf || null,
            razao_social: formData.razao_social || null,
            ativo: true
          });

        if (error) throw error;

        toast({
          title: "Entidade Criada",
          description: "A nova entidade foi criada com sucesso"
        });
      }

      loadEntidades();
      onEntidadeChange?.();
      setModalOpen(false);
      setEditingEntidade(null);
      setFormData({
        nome: "",
        tipo: "PJ",
        cnpj_cpf: "",
        razao_social: ""
      });
    } catch (error) {
      console.error('Erro ao salvar entidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a entidade",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (entidade: Entidade) => {
    setEditingEntidade(entidade);
    setFormData({
      nome: entidade.nome,
      tipo: entidade.tipo,
      cnpj_cpf: entidade.cnpj_cpf || "",
      razao_social: entidade.razao_social || ""
    });
    setModalOpen(true);
  };

  const handleDelete = async (entidade: Entidade) => {
    if (!confirm(`Tem certeza que deseja excluir a entidade "${entidade.nome}"?`)) {
      return;
    }

    try {
      // Verificar se há parcelas vinculadas a esta entidade
      const { data: parcelas } = await supabase
        .from('ap_installments')
        .select('id')
        .eq('entidade_id', entidade.id)
        .limit(1);

      if (parcelas && parcelas.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir esta entidade pois há parcelas vinculadas a ela",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('entidades')
        .delete()
        .eq('id', entidade.id);

      if (error) throw error;

      toast({
        title: "Entidade Excluída",
        description: "A entidade foi excluída com sucesso"
      });

      loadEntidades();
      onEntidadeChange?.();
    } catch (error) {
      console.error('Erro ao excluir entidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a entidade",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (entidade: Entidade) => {
    try {
      const { error } = await supabase
        .from('entidades')
        .update({ ativo: !entidade.ativo })
        .eq('id', entidade.id);

      if (error) throw error;

      toast({
        title: entidade.ativo ? "Entidade Desativada" : "Entidade Ativada",
        description: `A entidade foi ${entidade.ativo ? 'desativada' : 'ativada'} com sucesso`
      });

      loadEntidades();
      onEntidadeChange?.();
    } catch (error) {
      console.error('Erro ao alterar status da entidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da entidade",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando entidades...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Entidades</CardTitle>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEntidade(null);
                setFormData({
                  nome: "",
                  tipo: "PJ",
                  cnpj_cpf: "",
                  razao_social: ""
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEntidade ? 'Editar Entidade' : 'Nova Entidade'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome da entidade"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'PJ' | 'PF' })}
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  >
                    <option value="PJ">Pessoa Jurídica</option>
                    <option value="PF">Pessoa Física</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="cnpj_cpf">
                    {formData.tipo === 'PJ' ? 'CNPJ' : 'CPF'}
                  </Label>
                  <Input
                    id="cnpj_cpf"
                    value={formData.cnpj_cpf}
                    onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                    placeholder={formData.tipo === 'PJ' ? 'XX.XXX.XXX/XXXX-XX' : 'XXX.XXX.XXX-XX'}
                  />
                </div>

                {formData.tipo === 'PJ' && (
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={formData.razao_social}
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                      placeholder="Razão social da empresa"
                    />
                  </div>
                )}

                <Button onClick={handleSubmit} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {editingEntidade ? 'Atualizar' : 'Criar'} Entidade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Label htmlFor="search">Pesquisar</Label>
            <Input
              id="search"
              placeholder="Nome ou CNPJ/CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredEntidades.map((entidade) => (
            <div
              key={entidade.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  {entidade.tipo === 'PJ' ? (
                    <Building className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{entidade.nome}</h3>
                    <Badge variant={entidade.ativo ? "default" : "secondary"}>
                      {entidade.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {entidade.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </Badge>
                  </div>
                  {entidade.cnpj_cpf && (
                    <p className="text-sm text-muted-foreground">
                      {entidade.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {entidade.cnpj_cpf}
                    </p>
                  )}
                  {entidade.razao_social && (
                    <p className="text-sm text-muted-foreground">
                      Razão Social: {entidade.razao_social}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(entidade)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(entidade)}
                >
                  {entidade.ativo ? 'Desativar' : 'Ativar'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(entidade)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {filteredEntidades.length === 0 && entidades.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma entidade cadastrada
            </div>
          )}
          
          {filteredEntidades.length === 0 && entidades.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma entidade encontrada com os filtros aplicados
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
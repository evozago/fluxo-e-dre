import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Tag, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpreadsheetImport, ImportConfig } from "@/components/shared/SpreadsheetImport";

interface Marca {
  id: string;
  nome: string;
  fornecedor_id: string;
  ativo: boolean;
  created_at: string;
  fornecedores?: {
    nome: string;
  };
}

interface Fornecedor {
  id: string;
  nome: string;
}

export const MarcasManager = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [newMarca, setNewMarca] = useState({
    nome: "",
    fornecedor_id: ""
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const importConfig: ImportConfig = {
    tableName: 'marcas',
    displayName: 'Marcas',
    columns: [
      { key: 'nome', label: 'Nome da Marca', required: true, type: 'text' },
      { key: 'fornecedor_nome', label: 'Fornecedor', required: false, type: 'text' }
    ],
    onImport: async (data) => {
      for (const row of data) {
        let fornecedor_id = null;
        
        if (row.fornecedor_nome) {
          const { data: fornecedorData, error: fornecedorError } = await supabase
            .from('fornecedores')
            .select('id')
            .eq('nome', row.fornecedor_nome)
            .single();
            
          if (fornecedorError && fornecedorError.code === 'PGRST116') {
            const { data: newFornecedor, error: createError } = await supabase
              .from('fornecedores')
              .insert({ nome: row.fornecedor_nome })
              .select('id')
              .single();
              
            if (createError) throw createError;
            fornecedor_id = newFornecedor.id;
          } else if (fornecedorError) {
            throw fornecedorError;
          } else {
            fornecedor_id = fornecedorData.id;
          }
        }
        
        const { error } = await supabase
          .from('marcas')
          .insert({
            nome: row.nome,
            fornecedor_id
          });
          
        if (error) throw error;
      }
      
      loadMarcas();
    },
    templateData: [
      { nome: 'Nike', fornecedor_nome: 'Fornecedor Esportivo' },
      { nome: 'Adidas', fornecedor_nome: 'Distribuidora Roupas' }
    ]
  };

  useEffect(() => {
    loadMarcas();
    loadFornecedores();
  }, []);

  const loadMarcas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marcas')
        .select(`
          *,
          fornecedores (nome)
        `)
        .order('nome');

      if (error) throw error;
      setMarcas(data || []);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as marcas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMarca.nome || !newMarca.fornecedor_id) {
      toast({
        title: "Erro",
        description: "Nome da marca e fornecedor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingMarca) {
        const { error } = await supabase
          .from('marcas')
          .update({
            nome: newMarca.nome,
            fornecedor_id: newMarca.fornecedor_id
          })
          .eq('id', editingMarca.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Marca atualizada com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('marcas')
          .insert([{
            nome: newMarca.nome,
            fornecedor_id: newMarca.fornecedor_id
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Marca criada com sucesso"
        });
      }

      setNewMarca({ nome: "", fornecedor_id: "" });
      setEditingMarca(null);
      setDialogOpen(false);
      loadMarcas();
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a marca",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (marca: Marca) => {
    setEditingMarca(marca);
    setNewMarca({
      nome: marca.nome,
      fornecedor_id: marca.fornecedor_id
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (marca: Marca) => {
    try {
      const { error } = await supabase
        .from('marcas')
        .update({ ativo: !marca.ativo })
        .eq('id', marca.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Marca ${!marca.ativo ? 'ativada' : 'desativada'} com sucesso`
      });

      loadMarcas();
    } catch (error) {
      console.error('Erro ao alterar status da marca:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da marca",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewMarca({ nome: "", fornecedor_id: "" });
    setEditingMarca(null);
  };

  if (loading) {
    return <div className="text-center p-4">Carregando marcas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Marcas
          </CardTitle>
          <div className="flex gap-2">
            <SpreadsheetImport 
              config={importConfig}
              trigger={
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Planilha
                </Button>
              }
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Marca
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMarca ? "Editar Marca" : "Nova Marca"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Marca</Label>
                  <Input
                    id="nome"
                    value={newMarca.nome}
                    onChange={(e) => setNewMarca({ ...newMarca, nome: e.target.value })}
                    placeholder="Ex: Pula-Bula"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Select
                    value={newMarca.fornecedor_id}
                    onValueChange={(value) => setNewMarca({ ...newMarca, fornecedor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMarca ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <DataTable
          data={marcas}
          columns={[
            {
              key: 'nome',
              title: 'Nome da Marca',
              sortable: true,
              render: (value) => <span className="font-medium">{value}</span>
            },
            {
              key: 'fornecedores',
              title: 'Fornecedor',
              sortable: true,
              render: (value) => value?.nome || "N/A"
            },
            {
              key: 'ativo',
              title: 'Status',
              sortable: true,
              render: (value, marca) => (
                <Badge 
                  variant={value ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleToggleStatus(marca)}
                >
                  {value ? "Ativo" : "Inativo"}
                </Badge>
              )
            },
            {
              key: 'created_at',
              title: 'Data Criação',
              sortable: true,
              render: (value) => new Date(value).toLocaleDateString('pt-BR')
            },
            {
              key: 'actions',
              title: 'Ações',
              sortable: false,
              render: (_, marca) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(marca)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ] as ColumnDef<any>[]}
          searchPlaceholder="Buscar marca..."
          emptyMessage="Nenhuma marca cadastrada"
        />
      </CardContent>
    </Card>
  );
};
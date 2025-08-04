import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Calendar, DollarSign, ShoppingCart, Target, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VendasDashboardProps {
  onDataChange?: () => void;
}

interface Venda {
  id: string;
  vendedora_id: string;
  data_venda: string;
  valor_venda: number;
  forma_pagamento?: string;
  cliente_nome?: string;
  observacoes?: string;
  vendedora_nome?: string;
}

export const VendasDashboard = ({ onDataChange }: VendasDashboardProps) => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendedoras, setVendedoras] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [workingDaysLeft, setWorkingDaysLeft] = useState(0);
  const [formData, setFormData] = useState({
    vendedora_id: "",
    valor_venda: "",
    observacoes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadVendas();
    loadVendedoras();
    calculateWorkingDaysLeft();
  }, []);

  const calculateWorkingDaysLeft = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let workingDays = 0;
    for (let day = today.getDate(); day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      // Contar como dia útil se não for domingo (0)
      if (dayOfWeek !== 0) {
        workingDays++;
      }
    }
    
    setWorkingDaysLeft(workingDays);
  };

  const loadVendas = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          vendedoras (nome)
        `)
        .gte('data_venda', startOfMonth.toISOString().split('T')[0])
        .order('data_venda', { ascending: false });

      if (error) throw error;
      
      const vendasWithNames = (data || []).map(venda => ({
        ...venda,
        vendedora_nome: venda.vendedoras?.nome || 'Vendedora não encontrada'
      }));
      
      setVendas(vendasWithNames);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendedoras = async () => {
    try {
      const { data, error } = await supabase
        .from('vendedoras')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setVendedoras(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendedoras:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendedora_id || !formData.valor_venda) {
      toast({
        title: "Erro",
        description: "Vendedora e valor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const vendaData = {
        vendedora_id: formData.vendedora_id,
        data_venda: new Date().toISOString().split('T')[0], // Data atual
        valor_venda: parseFloat(formData.valor_venda.replace(',', '.')),
        observacoes: formData.observacoes || null
      };

      const { error } = await supabase
        .from('vendas')
        .insert(vendaData);

      if (error) throw error;

      toast({
        title: "Venda registrada",
        description: "O valor mensal foi registrado com sucesso"
      });

      loadVendas();
      onDataChange?.();
      setModalOpen(false);
      setFormData({
        vendedora_id: "",
        valor_venda: "",
        observacoes: ""
      });
    } catch (error: any) {
      console.error('Erro ao registrar venda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar o valor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (venda: Venda) => {
    if (!formData.vendedora_id || !formData.valor_venda) {
      toast({
        title: "Erro",
        description: "Vendedora e valor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vendas')
        .update({
          vendedora_id: formData.vendedora_id,
          valor_venda: parseFloat(formData.valor_venda.replace(',', '.')),
          observacoes: formData.observacoes || null
        })
        .eq('id', venda.id);

      if (error) throw error;

      toast({
        title: "Venda atualizada",
        description: "O valor foi atualizado com sucesso"
      });

      loadVendas();
      onDataChange?.();
      setEditModalOpen(false);
      setEditingVenda(null);
      setFormData({
        vendedora_id: "",
        valor_venda: "",
        observacoes: ""
      });
    } catch (error: any) {
      console.error('Erro ao atualizar venda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o valor",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId);

      if (error) throw error;

      toast({
        title: "Venda excluída",
        description: "O registro foi excluído com sucesso"
      });

      loadVendas();
      onDataChange?.();
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o registro",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (venda: Venda) => {
    setEditingVenda(venda);
    setFormData({
      vendedora_id: venda.vendedora_id,
      valor_venda: venda.valor_venda.toString(),
      observacoes: venda.observacoes || ""
    });
    setEditModalOpen(true);
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

  const getTodaySales = () => {
    const today = new Date().toISOString().split('T')[0];
    return vendas
      .filter(v => v.data_venda === today)
      .reduce((sum, v) => sum + Number(v.valor_venda), 0);
  };

  const getMonthSales = () => {
    return vendas.reduce((sum, v) => sum + Number(v.valor_venda), 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando vendas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês até Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getMonthSales())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {vendas.length}
            </div>
            <p className="text-xs text-muted-foreground">transações este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Úteis Restantes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {workingDaysLeft}
            </div>
            <p className="text-xs text-muted-foreground">dias no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Registro de Vendas
            </CardTitle>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vendas.slice(0, 10)}
            columns={[
              {
                key: 'data_venda',
                title: 'Data Atualização',
                sortable: true,
                render: (value) => formatDate(value)
              },
              {
                key: 'vendedora_nome',
                title: 'Vendedora',
                sortable: true,
                render: (value) => <span className="font-medium">{value}</span>
              },
              {
                key: 'valor_venda',
                title: 'Valor Vendido',
                sortable: true,
                render: (value) => (
                  <span className="font-bold text-green-600">
                    {formatCurrency(value)}
                  </span>
                )
              },
              {
                key: 'observacoes',
                title: 'Observações',
                sortable: true,
                render: (value) => value || '-'
              },
              {
                key: 'actions',
                title: 'Ações',
                sortable: false,
                render: (_, venda) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(venda)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(venda.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }
            ] as ColumnDef<any>[]}
            searchPlaceholder="Buscar venda..."
            emptyMessage="Nenhuma venda registrada este mês"
          />
          
          {vendas.length > 10 && (
            <div className="text-center mt-4">
              <Badge variant="secondary">
                Mostrando 10 de {vendas.length} vendas
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Venda */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nova Venda</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="vendedora">Vendedora *</Label>
                <select
                  id="vendedora"
                  value={formData.vendedora_id}
                  onChange={(e) => setFormData({...formData, vendedora_id: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  required
                >
                  <option value="">Selecione uma vendedora</option>
                  {vendedoras.map(vendedora => (
                    <option key={vendedora.id} value={vendedora.id}>
                      {vendedora.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="valor_venda">Valor Vendido no Mês *</Label>
                <Input
                  id="valor_venda"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor_venda}
                  onChange={(e) => setFormData({...formData, valor_venda: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Observações sobre o valor mensal (opcional)"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Registrar Venda
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

      {/* Modal Editar Venda */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingVenda) handleEdit(editingVenda);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-vendedora">Vendedora *</Label>
                <select
                  id="edit-vendedora"
                  value={formData.vendedora_id}
                  onChange={(e) => setFormData({...formData, vendedora_id: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  required
                >
                  <option value="">Selecione uma vendedora</option>
                  {vendedoras.map(vendedora => (
                    <option key={vendedora.id} value={vendedora.id}>
                      {vendedora.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="edit-valor_venda">Valor Vendido no Mês *</Label>
                <Input
                  id="edit-valor_venda"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor_venda}
                  onChange={(e) => setFormData({...formData, valor_venda: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Input
                id="edit-observacoes"
                placeholder="Observações sobre o valor mensal (opcional)"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Atualizar Venda
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingVenda(null);
                  setFormData({
                    vendedora_id: "",
                    valor_venda: "",
                    observacoes: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
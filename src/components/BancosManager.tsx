import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrency } from "@/lib/brazilian-utils";

interface ContaBancaria {
  id: string;
  nome_banco: string;
  agencia?: string;
  conta?: string;
  tipo_conta: 'corrente' | 'poupanca' | 'investimento';
  saldo_atual: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function BancosManager() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome_banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    saldo_atual: '',
    ativo: true,
    observacoes: ''
  });

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_bancarias' as any)
        .select('*')
        .order('nome_banco');

      if (error) throw error;
      setContas((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas bancárias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contaData = {
        nome_banco: formData.nome_banco,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        tipo_conta: formData.tipo_conta,
        saldo_atual: parseCurrency(formData.saldo_atual),
        ativo: formData.ativo,
        observacoes: formData.observacoes || null
      };

      if (editingConta) {
        const { error } = await supabase
          .from('contas_bancarias' as any)
          .update(contaData)
          .eq('id', editingConta.id);

        if (error) throw error;

        toast({
          title: "Conta bancária atualizada",
          description: "Dados da conta foram atualizados com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('contas_bancarias' as any)
          .insert(contaData);

        if (error) throw error;

        toast({
          title: "Conta bancária criada",
          description: "Nova conta bancária foi adicionada com sucesso"
        });
      }

      handleCloseDialog();
      fetchContas();
    } catch (error) {
      console.error('Erro ao salvar conta bancária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a conta bancária",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conta: ContaBancaria) => {
    setEditingConta(conta);
    setFormData({
      nome_banco: conta.nome_banco,
      agencia: conta.agencia || '',
      conta: conta.conta || '',
      tipo_conta: conta.tipo_conta,
      saldo_atual: formatCurrency(conta.saldo_atual),
      ativo: conta.ativo,
      observacoes: conta.observacoes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta bancária?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contas_bancarias' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Conta bancária excluída",
        description: "Conta bancária foi removida com sucesso"
      });

      fetchContas();
    } catch (error) {
      console.error('Erro ao excluir conta bancária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta bancária",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingConta(null);
    setFormData({
      nome_banco: '',
      agencia: '',
      conta: '',
      tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
      saldo_atual: '',
      ativo: true,
      observacoes: ''
    });
  };

  const getTipoContaLabel = (tipo: string) => {
    const tipos = {
      corrente: 'Corrente',
      poupanca: 'Poupança',
      investimento: 'Investimento'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciamento de Contas Bancárias</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingConta(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conta Bancária
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingConta ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome_banco">Nome do Banco*</Label>
                    <Input
                      id="nome_banco"
                      value={formData.nome_banco}
                      onChange={(e) => setFormData({ ...formData, nome_banco: e.target.value })}
                      required
                      placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="agencia">Agência</Label>
                      <Input
                        id="agencia"
                        value={formData.agencia}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        placeholder="0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conta">Conta</Label>
                      <Input
                        id="conta"
                        value={formData.conta}
                        onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                        placeholder="00000-0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo_conta">Tipo de Conta*</Label>
                    <Select
                      value={formData.tipo_conta}
                      onValueChange={(value: 'corrente' | 'poupanca' | 'investimento') =>
                        setFormData({ ...formData, tipo_conta: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="saldo_atual">Saldo Atual*</Label>
                    <Input
                      id="saldo_atual"
                      value={formData.saldo_atual}
                      onChange={(e) => setFormData({ ...formData, saldo_atual: e.target.value })}
                      required
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Informações adicionais sobre a conta..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo">Conta ativa</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Agência/Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="font-medium">{conta.nome_banco}</TableCell>
                  <TableCell>
                    {conta.agencia && conta.conta ? `${conta.agencia} / ${conta.conta}` : '-'}
                  </TableCell>
                  <TableCell>{getTipoContaLabel(conta.tipo_conta)}</TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(conta.saldo_atual)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.ativo ? "default" : "secondary"}>
                      {conta.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(conta)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(conta.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhuma conta bancária encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
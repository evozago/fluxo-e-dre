import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Funcionario {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  salario: number;
  dias_uteis_mes: number;
  valor_transporte_dia: number;
  valor_transporte_total: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface FuncionariosManagerProps {
  onFuncionarioChange?: () => void;
}

export const FuncionariosManager = ({ onFuncionarioChange }: FuncionariosManagerProps) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    endereco: "",
    salario: "",
    dias_uteis_mes: "22"
  });
  const { toast } = useToast();

  const valorTransporteDia = 8.6; // Valor fixo de duas passagens

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setFuncionarios((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.salario) {
      toast({
        title: "Erro",
        description: "Nome e salário são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const diasUteis = parseInt(formData.dias_uteis_mes) || 22;
    const valorTransporteTotal = diasUteis * valorTransporteDia;

    try {
      const funcionarioData = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim() || null,
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        endereco: formData.endereco.trim() || null,
        salario: parseFloat(formData.salario),
        dias_uteis_mes: diasUteis,
        valor_transporte_dia: valorTransporteDia,
        valor_transporte_total: valorTransporteTotal,
        ativo: true
      };

      if (editingFuncionario) {
        // Atualizar funcionário existente
        const { error } = await supabase
          .from('funcionarios')
          .update(funcionarioData)
          .eq('id', editingFuncionario.id);

        if (error) throw error;

        toast({
          title: "Funcionário atualizado",
          description: "Dados do funcionário foram atualizados com sucesso"
        });
      } else {
        // Criar novo funcionário
        const { data: newFuncionario, error } = await supabase
          .from('funcionarios')
          .insert(funcionarioData)
          .select('id')
          .single();

        if (error) throw error;

        // Criar contas a pagar recorrentes para salário e transporte
        const today = new Date();
        const mesAtual = today.getMonth() + 1;
        const anoAtual = today.getFullYear();

        const contasRecorrentes = [
          {
            descricao: `Salário - ${formData.nome}`,
            fornecedor: formData.nome,
            valor: parseFloat(formData.salario),
            data_vencimento: `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-05`, // Todo dia 5
            status: 'aberto',
            categoria: 'Salários',
            eh_recorrente: true,
            tipo_recorrencia: 'mensal',
            valor_fixo: true,
            funcionario_id: (newFuncionario as any)?.id,
            entidade_id: (newFuncionario as any)?.id
          },
          {
            descricao: `Vale Transporte - ${formData.nome}`,
            fornecedor: formData.nome,
            valor: valorTransporteTotal,
            data_vencimento: `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-05`, // Todo dia 5
            status: 'aberto',
            categoria: 'Transportes',
            eh_recorrente: true,
            tipo_recorrencia: 'mensal',
            valor_fixo: false, // Pode variar pelos dias úteis
            funcionario_id: (newFuncionario as any)?.id,
            entidade_id: (newFuncionario as any)?.id
          }
        ];

        const { error: contasError } = await supabase
          .from('ap_installments')
          .insert(contasRecorrentes);

        if (contasError) {
          console.error('Erro ao criar contas recorrentes:', contasError);
        }

        toast({
          title: "Funcionário criado",
          description: "Novo funcionário foi criado com contas recorrentes"
        });
      }

      loadFuncionarios();
      onFuncionarioChange?.();
      setIsModalOpen(false);
      setEditingFuncionario(null);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o funcionário",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: "",
      salario: "",
      dias_uteis_mes: "22"
    });
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      cpf: funcionario.cpf || "",
      email: funcionario.email || "",
      telefone: funcionario.telefone || "",
      endereco: funcionario.endereco || "",
      salario: funcionario.salario.toString(),
      dias_uteis_mes: funcionario.dias_uteis_mes.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este funcionário?")) return;

    try {
      const { error } = await supabase
        .from('funcionarios')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Funcionário desativado",
        description: "O funcionário foi desativado com sucesso"
      });

      loadFuncionarios();
      onFuncionarioChange?.();
    } catch (error: any) {
      console.error('Erro ao desativar funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o funcionário",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const openNewModal = () => {
    setEditingFuncionario(null);
    resetForm();
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando funcionários...</p>
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
            <User className="h-5 w-5" />
            Funcionários
          </CardTitle>
          <Button onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {funcionarios.filter(f => f.ativo).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum funcionário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Vale Transporte</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.filter(f => f.ativo).map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.cpf || '-'}</TableCell>
                    <TableCell>{funcionario.email || '-'}</TableCell>
                    <TableCell>{funcionario.telefone || '-'}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(funcionario.salario)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatCurrency(funcionario.valor_transporte_total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(funcionario)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(funcionario.id)}
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

        {/* Modal para Criar/Editar Funcionário */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome completo do funcionário"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="funcionario@email.com"
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
                
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="salario">Salário *</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dias_uteis">Dias Úteis/Mês</Label>
                  <Input
                    id="dias_uteis"
                    type="number"
                    value={formData.dias_uteis_mes}
                    onChange={(e) => setFormData({...formData, dias_uteis_mes: e.target.value})}
                    placeholder="22"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Vale transporte: {parseInt(formData.dias_uteis_mes) || 22} dias × R$ {valorTransporteDia.toFixed(2)} = R$ {((parseInt(formData.dias_uteis_mes) || 22) * valorTransporteDia).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {editingFuncionario ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
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
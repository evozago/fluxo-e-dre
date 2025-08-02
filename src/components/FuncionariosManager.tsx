import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, User, DollarSign, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, formatCPF, formatPhone, getWorkingDaysInMonth, parseCurrency } from "@/lib/brazilian-utils";

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
  chave_pix?: string;
  tipo_chave_pix?: string;
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
    chave_pix: "",
    tipo_chave_pix: ""
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
        .from('funcionarios' as any)
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

    const hoje = new Date();
    const diasUteis = getWorkingDaysInMonth(hoje.getFullYear(), hoje.getMonth() + 1);
    const valorTransporteTotal = diasUteis * valorTransporteDia;

    try {
      const funcionarioData = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim() || null,
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        endereco: formData.endereco.trim() || null,
        salario: parseCurrency(formData.salario),
        dias_uteis_mes: diasUteis,
        valor_transporte_dia: valorTransporteDia,
        valor_transporte_total: valorTransporteTotal,
        chave_pix: formData.chave_pix.trim() || null,
        tipo_chave_pix: formData.tipo_chave_pix || null,
        ativo: true
      };

      if (editingFuncionario) {
        // Atualizar funcionário existente
        const { error } = await supabase
          .from('funcionarios' as any)
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
          .from('funcionarios' as any)
          .insert(funcionarioData)
          .select('id')
          .single();

        if (error) throw error;

        // Criar funcionário como fornecedor
        const { data: newFornecedor, error: fornecedorError } = await supabase
          .from('fornecedores')
          .insert({
            nome: formData.nome,
            cnpj_cpf: formData.cpf || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
            ativo: true
          })
          .select('id')
          .single();

        if (fornecedorError) {
          console.error('Erro ao criar fornecedor:', fornecedorError);
          throw fornecedorError;
        }

        // Criar funcionário como entidade
        const { data: newEntidade, error: entidadeError } = await supabase
          .from('entidades')
          .insert({
            nome: formData.nome,
            cnpj_cpf: formData.cpf || null,
            tipo: 'funcionario',
            ativo: true
          })
          .select('id')
          .single();

        if (entidadeError) {
          console.error('Erro ao criar entidade:', entidadeError);
          throw entidadeError;
        }

        // Gerar próximos 36 meses de contas recorrentes
        const contasRecorrentes = [];
        const hoje = new Date();
        
        for (let i = 0; i < 36; i++) {
          const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
          const diasUteisDoMes = getWorkingDaysInMonth(mesAtual.getFullYear(), mesAtual.getMonth() + 1);
          const valorTransporteMes = diasUteisDoMes * valorTransporteDia;
          
          // Data de vencimento no dia 5 de cada mês
          const dataVencimento = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 5);
          
          contasRecorrentes.push(
            {
              descricao: `Salário - ${formData.nome}`,
              fornecedor: formData.nome,
              valor: parseCurrency(formData.salario),
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              status: 'aberto',
              categoria: 'Salários',
              eh_recorrente: true,
              tipo_recorrencia: 'mensal',
              valor_fixo: true,
              funcionario_id: (newFuncionario as any)?.id,
              entidade_id: (newEntidade as any)?.id,
              forma_pagamento: formData.tipo_chave_pix ? 'PIX' : null,
              dados_pagamento: formData.chave_pix && formData.tipo_chave_pix ? 
                `${formData.chave_pix} (${formData.tipo_chave_pix})` : null
            },
            {
              descricao: `Vale Transporte - ${formData.nome} (${diasUteisDoMes} dias úteis)`,
              fornecedor: formData.nome,
              valor: valorTransporteMes,
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              status: 'aberto',
              categoria: 'Transportes',
              eh_recorrente: true,
              tipo_recorrencia: 'mensal',
              valor_fixo: false,
              funcionario_id: (newFuncionario as any)?.id,
              entidade_id: (newEntidade as any)?.id,
              forma_pagamento: formData.tipo_chave_pix ? 'PIX' : null,
              dados_pagamento: formData.chave_pix && formData.tipo_chave_pix ? 
                `${formData.chave_pix} (${formData.tipo_chave_pix})` : null
            }
          );
        }

        const { error: contasError } = await supabase
          .from('ap_installments')
          .insert(contasRecorrentes);

        if (contasError) {
          console.error('Erro ao criar contas recorrentes:', contasError);
        }

        toast({
          title: "Funcionário criado",
          description: `Funcionário ${formData.nome} criado com 36 meses de contas recorrentes`
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
      chave_pix: "",
      tipo_chave_pix: ""
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
      salario: formatCurrency(funcionario.salario),
      chave_pix: funcionario.chave_pix || "",
      tipo_chave_pix: funcionario.tipo_chave_pix || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este funcionário?")) return;

    try {
      const { error } = await supabase
        .from('funcionarios' as any)
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
                  <TableHead>PIX</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.filter(f => f.ativo).map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.cpf ? formatCPF(funcionario.cpf) : '-'}</TableCell>
                    <TableCell>{funcionario.email || '-'}</TableCell>
                    <TableCell>{funcionario.telefone ? formatPhone(funcionario.telefone) : '-'}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(funcionario.salario)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatCurrency(funcionario.valor_transporte_total)}
                    </TableCell>
                    <TableCell>{funcionario.chave_pix || '-'}</TableCell>
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
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="chave_pix">Chave PIX</Label>
                  <Input
                    id="chave_pix"
                    value={formData.chave_pix}
                    onChange={(e) => setFormData({...formData, chave_pix: e.target.value})}
                    placeholder="Chave PIX para pagamentos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo_chave_pix">Tipo da Chave PIX</Label>
                  <Select onValueChange={(value) => setFormData({...formData, tipo_chave_pix: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="Email">E-mail</SelectItem>
                      <SelectItem value="Telefone">Telefone</SelectItem>
                      <SelectItem value="Chave Aleatória">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informações do Vale Transporte
                </h4>
                <p className="text-sm text-blue-700">
                  O vale transporte será calculado automaticamente baseado nos dias úteis de cada mês (Segunda a Sábado).
                  Valor por dia: {formatCurrency(valorTransporteDia)} (2 passagens)
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Este mês: {getWorkingDaysInMonth(new Date().getFullYear(), new Date().getMonth() + 1)} dias úteis = {formatCurrency(getWorkingDaysInMonth(new Date().getFullYear(), new Date().getMonth() + 1) * valorTransporteDia)}
                </p>
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
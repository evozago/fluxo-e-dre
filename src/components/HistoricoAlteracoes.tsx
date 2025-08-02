import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoricoAlteracao {
  id: string;
  tabela: string;
  registro_id: string;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
  usuario?: string;
  motivo?: string;
  data_alteracao: string;
}

export function HistoricoAlteracoes() {
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    tabela: '',
    campo: '',
    usuario: '',
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('historico_alteracoes' as any)
        .select('*')
        .order('data_alteracao', { ascending: false })
        .limit(500);

      // Aplicar filtros
      if (filtros.tabela) {
        query = query.eq('tabela', filtros.tabela);
      }
      if (filtros.campo) {
        query = query.ilike('campo_alterado', `%${filtros.campo}%`);
      }
      if (filtros.usuario) {
        query = query.ilike('usuario', `%${filtros.usuario}%`);
      }
      if (filtros.dataInicio) {
        query = query.gte('data_alteracao', filtros.dataInicio.toISOString());
      }
      if (filtros.dataFim) {
        const dataFimFinal = new Date(filtros.dataFim);
        dataFimFinal.setHours(23, 59, 59, 999);
        query = query.lte('data_alteracao', dataFimFinal.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistorico((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de alterações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      tabela: '',
      campo: '',
      usuario: '',
      dataInicio: undefined,
      dataFim: undefined
    });
  };

  const formatarDataHora = (dataStr: string) => {
    return format(new Date(dataStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getTabelaLabel = (tabela: string) => {
    const labels: Record<string, string> = {
      'funcionarios': 'Funcionários',
      'fornecedores': 'Fornecedores',
      'entidades': 'Entidades',
      'ap_installments': 'Contas a Pagar',
      'contas_bancarias': 'Contas Bancárias',
      'produtos': 'Produtos',
      'vendas': 'Vendas',
      'vendedoras': 'Vendedoras',
      'metas_mensais': 'Metas Mensais'
    };
    return labels[tabela] || tabela;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="tabela">Tabela</Label>
              <Select
                value={filtros.tabela}
                onValueChange={(value) => setFiltros({ ...filtros, tabela: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as tabelas</SelectItem>
                  <SelectItem value="funcionarios">Funcionários</SelectItem>
                  <SelectItem value="fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="ap_installments">Contas a Pagar</SelectItem>
                  <SelectItem value="contas_bancarias">Contas Bancárias</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campo">Campo</Label>
              <Input
                id="campo"
                value={filtros.campo}
                onChange={(e) => setFiltros({ ...filtros, campo: e.target.value })}
                placeholder="Nome do campo..."
              />
            </div>

            <div>
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                value={filtros.usuario}
                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
                placeholder="Nome do usuário..."
              />
            </div>

            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataInicio ? format(filtros.dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtros.dataInicio}
                    onSelect={(date) => setFiltros({ ...filtros, dataInicio: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataFim ? format(filtros.dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtros.dataFim}
                    onSelect={(date) => setFiltros({ ...filtros, dataFim: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={fetchHistorico} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                <Filter className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Tabela de histórico */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Valor Anterior</TableHead>
                <TableHead>Valor Novo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {formatarDataHora(item.data_alteracao)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTabelaLabel(item.tabela)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.campo_alterado}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.valor_anterior || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.valor_novo || '-'}
                  </TableCell>
                  <TableCell>{item.usuario || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.motivo || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {historico.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {loading ? 'Carregando...' : 'Nenhum registro encontrado'}
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
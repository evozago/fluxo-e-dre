import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp, Download, FileText, Filter } from "lucide-react";
import { SpreadsheetTemplates } from "./SpreadsheetTemplates";
import { formatCurrency, formatDate } from "@/lib/brazilian-utils";

interface ReportsProps {
  onDataChange?: () => void;
}

interface ReportData {
  categoria?: string;
  fornecedor?: string;
  entidade?: string;
  valor?: number;
  total?: number;
  count?: number;
  status?: string;
  mes?: string;
}

export const Reports = ({ onDataChange }: ReportsProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedEntidades, setSelectedEntidades] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFormasPagamento, setSelectedFormasPagamento] = useState<string[]>([]);
  const [dateFilterType, setDateFilterType] = useState("custom");
  const [reportType, setReportType] = useState("categoria");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [entidades, setEntidades] = useState<{id: string, nome: string}[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const { toast } = useToast();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87d068', '#ffa726'];

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      // Carregar categorias únicas
      const { data: categoriasData } = await supabase
        .from('ap_installments')
        .select('categoria')
        .not('categoria', 'is', null);
      
      const uniqueCategorias = [...new Set(categoriasData?.map(item => item.categoria) || [])];
      setCategorias(uniqueCategorias);

      // Carregar fornecedores únicos
      const { data: fornecedoresData } = await supabase
        .from('ap_installments')
        .select('fornecedor')
        .not('fornecedor', 'is', null);
      
      const uniqueFornecedores = [...new Set(fornecedoresData?.map(item => item.fornecedor) || [])];
      setFornecedores(uniqueFornecedores);

      // Carregar entidades
      const { data: entidadesData } = await supabase
        .from('entidades')
        .select('id, nome')
        .eq('ativo', true);
      
      setEntidades(entidadesData || []);

      // Carregar formas de pagamento únicas
      const { data: formasPagamentoData } = await supabase
        .from('ap_installments')
        .select('forma_pagamento')
        .not('forma_pagamento', 'is', null);
      
      const uniqueFormasPagamento = [...new Set(formasPagamentoData?.map(item => item.forma_pagamento) || [])];
      setFormasPagamento(uniqueFormasPagamento);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    }
  };

  const setDateFilterQuick = (type: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    switch (type) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'thisMonth':
        setStartDate(new Date(year, month, 1).toISOString().split('T')[0]);
        setEndDate(new Date(year, month + 1, 0).toISOString().split('T')[0]);
        break;
      case 'thisYear':
        setStartDate(new Date(year, 0, 1).toISOString().split('T')[0]);
        setEndDate(new Date(year, 11, 31).toISOString().split('T')[0]);
        break;
      case 'lastMonth':
        setStartDate(new Date(year, month - 1, 1).toISOString().split('T')[0]);
        setEndDate(new Date(year, month, 0).toISOString().split('T')[0]);
        break;
      case 'lastYear':
        setStartDate(new Date(year - 1, 0, 1).toISOString().split('T')[0]);
        setEndDate(new Date(year - 1, 11, 31).toISOString().split('T')[0]);
        break;
    }
    setDateFilterType(type);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Selecione as datas de início e fim",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('ap_installments')
        .select(`
          *,
          entidades (id, nome, tipo)
        `);

      // Aplicar filtros de data
      if (startDate) query = query.gte('data_vencimento', startDate);
      if (endDate) query = query.lte('data_vencimento', endDate);

      // Aplicar filtros de categoria
      if (selectedCategories.length > 0) {
        query = query.in('categoria', selectedCategories);
      }

      // Aplicar filtros de fornecedor
      if (selectedFornecedores.length > 0) {
        query = query.in('fornecedor', selectedFornecedores);
      }

      // Aplicar filtros de entidade
      if (selectedEntidades.length > 0) {
        query = query.in('entidade_id', selectedEntidades);
      }

      // Aplicar filtros de status
      if (selectedStatus.length > 0) {
        query = query.in('status', selectedStatus);
      }

      // Aplicar filtros de forma de pagamento
      if (selectedFormasPagamento.length > 0) {
        query = query.in('forma_pagamento', selectedFormasPagamento);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Processar dados baseado no tipo de relatório
      let processedData: ReportData[] = [];

      switch (reportType) {
        case 'categoria':
          const categoriaMap = new Map();
          data?.forEach(item => {
            const key = item.categoria || 'Sem Categoria';
            if (!categoriaMap.has(key)) {
              categoriaMap.set(key, { categoria: key, total: 0, count: 0 });
            }
            const existing = categoriaMap.get(key);
            existing.total += Number(item.valor);
            existing.count += 1;
          });
          processedData = Array.from(categoriaMap.values());
          break;

        case 'fornecedor':
          const fornecedorMap = new Map();
          data?.forEach(item => {
            const key = item.fornecedor || 'Sem Fornecedor';
            if (!fornecedorMap.has(key)) {
              fornecedorMap.set(key, { fornecedor: key, total: 0, count: 0 });
            }
            const existing = fornecedorMap.get(key);
            existing.total += Number(item.valor);
            existing.count += 1;
          });
          processedData = Array.from(fornecedorMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10); // Top 10 fornecedores
          break;

        case 'entidade':
          const entidadeMap = new Map();
          data?.forEach(item => {
            const key = item.entidades?.nome || 'Sem Entidade';
            if (!entidadeMap.has(key)) {
              entidadeMap.set(key, { entidade: key, total: 0, count: 0 });
            }
            const existing = entidadeMap.get(key);
            existing.total += Number(item.valor);
            existing.count += 1;
          });
          processedData = Array.from(entidadeMap.values());
          break;

        case 'status':
          const statusMap = new Map();
          data?.forEach(item => {
            const key = item.status || 'Sem Status';
            if (!statusMap.has(key)) {
              statusMap.set(key, { status: key, total: 0, count: 0 });
            }
            const existing = statusMap.get(key);
            existing.total += Number(item.valor);
            existing.count += 1;
          });
          processedData = Array.from(statusMap.values());
          break;

        case 'mensal':
          const mesMap = new Map();
          data?.forEach(item => {
            const date = new Date(item.data_vencimento + 'T00:00:00');
            const mesAno = formatDate(date).substring(3); // Pega MM/YYYY
            const mesNome = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
            const key = mesAno;
            if (!mesMap.has(key)) {
              mesMap.set(key, { mes: mesNome, total: 0, count: 0 });
            }
            const existing = mesMap.get(key);
            existing.total += Number(item.valor);
            existing.count += 1;
          });
          processedData = Array.from(mesMap.values())
            .sort((a, b) => a.mes.localeCompare(b.mes));
          break;
      }

      setReportData(processedData);
      toast({
        title: "Relatório Gerado",
        description: `${processedData.length} registros processados`
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (!reportData.length) {
      toast({
        title: "Erro",
        description: "Gere um relatório primeiro",
        variant: "destructive"
      });
      return;
    }

    if (format === 'csv') {
      const csvData = reportData.map(item => {
        const obj: any = {};
        Object.keys(item).forEach(key => {
          if (key === 'total') {
            obj['Valor Total'] = formatCurrency(item[key] || 0);
          } else if (key === 'count') {
            obj['Quantidade'] = item[key];
          } else {
            obj[key] = item[key];
          }
        });
        return obj;
      });

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Relatório Exportado",
        description: `Relatório exportado em CSV com sucesso`
      });
    } else {
      toast({
        title: "Em Desenvolvimento",
        description: `Exportação em ${format.toUpperCase()} será implementada em breve`,
        variant: "destructive"
      });
    }
  };


  const renderChart = () => {
    if (!reportData.length) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Gere um relatório para visualizar os gráficos
        </div>
      );
    }

    switch (reportType) {
      case 'categoria':
      case 'status':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={reportData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="total"
                nameKey={reportType === 'categoria' ? 'categoria' : 'status'}
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'fornecedor':
      case 'entidade':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={reportType === 'fornecedor' ? 'fornecedor' : 'entidade'}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'mensal':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Tipo de relatório não suportado</div>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios e Análises Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Filtro de Período Rápido */}
            <div>
              <Label htmlFor="quickDate">Período</Label>
              <Select value={dateFilterType} onValueChange={setDateFilterQuick}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="thisMonth">Este Mês</SelectItem>
                  <SelectItem value="lastMonth">Mês Anterior</SelectItem>
                  <SelectItem value="thisYear">Este Ano</SelectItem>
                  <SelectItem value="lastYear">Ano Anterior</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtros de Data Personalizados */}
            {dateFilterType === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Tipo de Relatório */}
            <div>
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="categoria">Por Categoria</SelectItem>
                  <SelectItem value="fornecedor">Por Fornecedor</SelectItem>
                  <SelectItem value="entidade">Por Entidade</SelectItem>
                  <SelectItem value="status">Por Status</SelectItem>
                  <SelectItem value="mensal">Evolução Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Categorias */}
            <div>
              <Label htmlFor="categoriaFilter">Filtrar Categorias</Label>
              <Select 
                value={selectedCategories.length > 0 ? selectedCategories.join(',') : 'all'} 
                onValueChange={(value) => setSelectedCategories(value === 'all' ? [] : value.split(','))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.filter(categoria => categoria && categoria.trim() !== '').map(categoria => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Entidades */}
            <div>
              <Label htmlFor="entidadeFilter">Filtrar Entidades</Label>
              <Select 
                value={selectedEntidades.length > 0 ? selectedEntidades.join(',') : 'all'} 
                onValueChange={(value) => setSelectedEntidades(value === 'all' ? [] : value.split(','))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {entidades.filter(entidade => entidade.id && entidade.id.trim() !== '').map(entidade => (
                    <SelectItem key={entidade.id} value={entidade.id}>{entidade.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status */}
            <div>
              <Label htmlFor="statusFilter">Filtrar Status</Label>
              <Select 
                value={selectedStatus.length > 0 ? selectedStatus.join(',') : 'all'} 
                onValueChange={(value) => setSelectedStatus(value === 'all' ? [] : value.split(','))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberto">Em Aberto</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Forma de Pagamento */}
            <div>
              <Label htmlFor="formaPagamentoFilter">Forma de Pagamento</Label>
              <Select 
                value={selectedFormasPagamento.length > 0 ? selectedFormasPagamento.join(',') : 'all'} 
                onValueChange={(value) => setSelectedFormasPagamento(value === 'all' ? [] : value.split(','))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as formas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {formasPagamento.filter(forma => forma && forma.trim() !== '').map(forma => (
                    <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão Gerar Relatório */}
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visualização dos Dados</CardTitle>
            {reportData.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={() => exportReport('csv')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={() => exportReport('xlsx')} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={() => exportReport('pdf')} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Resumo Numérico */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {reportData.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {reportData.reduce((sum, item) => sum + (item.count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total de Títulos</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {reportData.length}
                </div>
                <div className="text-sm text-muted-foreground">Categorias/Grupos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modelos de Planilha */}
      <SpreadsheetTemplates />
    </div>
  );
};
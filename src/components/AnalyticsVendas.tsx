import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsVendasProps {
  onDataChange?: () => void;
}

export const AnalyticsVendas = ({ onDataChange }: AnalyticsVendasProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonYear, setComparisonYear] = useState(new Date().getFullYear() - 1);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [vendedorasData, setVendedorasData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedYear, comparisonYear]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMonthlyData(),
        loadVendedorasData(),
        loadGrowthData()
      ]);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados analíticos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    const { data, error } = await supabase
      .from('vendas')
      .select('data_venda, valor_venda')
      .gte('data_venda', `${selectedYear}-01-01`)
      .lt('data_venda', `${selectedYear + 1}-01-01`);

    if (error) throw error;

    // Agrupar por mês
    const monthlyMap = new Map();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    // Inicializar todos os meses com 0
    months.forEach((month, index) => {
      monthlyMap.set(index + 1, {
        month,
        vendas: 0,
        count: 0
      });
    });

    // Somar vendas por mês
    data?.forEach(venda => {
      const date = new Date(venda.data_venda + 'T00:00:00');
      const month = date.getMonth() + 1;
      const existing = monthlyMap.get(month);
      if (existing) {
        existing.vendas += Number(venda.valor_venda);
        existing.count += 1;
      }
    });

    setMonthlyData(Array.from(monthlyMap.values()));
  };

  const loadVendedorasData = async () => {
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        valor_venda,
        vendedoras (nome)
      `)
      .gte('data_venda', `${selectedYear}-01-01`)
      .lt('data_venda', `${selectedYear + 1}-01-01`);

    if (error) throw error;

    // Agrupar por vendedora
    const vendedorasMap = new Map();
    
    data?.forEach(venda => {
      const nome = venda.vendedoras?.nome || 'Sem vendedora';
      if (!vendedorasMap.has(nome)) {
        vendedorasMap.set(nome, {
          name: nome,
          vendas: 0,
          count: 0
        });
      }
      
      const existing = vendedorasMap.get(nome);
      existing.vendas += Number(venda.valor_venda);
      existing.count += 1;
    });

    setVendedorasData(Array.from(vendedorasMap.values()));
  };

  const loadGrowthData = async () => {
    // Carregar dados do ano atual
    const { data: currentYearData, error: currentError } = await supabase
      .from('vendas')
      .select('data_venda, valor_venda')
      .gte('data_venda', `${selectedYear}-01-01`)
      .lt('data_venda', `${selectedYear + 1}-01-01`);

    if (currentError) throw currentError;

    // Carregar dados do ano de comparação
    const { data: comparisonYearData, error: comparisonError } = await supabase
      .from('vendas')
      .select('data_venda, valor_venda')
      .gte('data_venda', `${comparisonYear}-01-01`)
      .lt('data_venda', `${comparisonYear + 1}-01-01`);

    if (comparisonError) throw comparisonError;

    // Processar dados de crescimento
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const growthMap = new Map();
    
    // Inicializar meses
    months.forEach((month, index) => {
      growthMap.set(index + 1, {
        month,
        anoAtual: 0,
        anoAnterior: 0,
        crescimento: 0
      });
    });

    // Somar vendas do ano atual
    currentYearData?.forEach(venda => {
      const date = new Date(venda.data_venda + 'T00:00:00');
      const month = date.getMonth() + 1;
      const existing = growthMap.get(month);
      if (existing) {
        existing.anoAtual += Number(venda.valor_venda);
      }
    });

    // Somar vendas do ano de comparação
    comparisonYearData?.forEach(venda => {
      const date = new Date(venda.data_venda + 'T00:00:00');
      const month = date.getMonth() + 1;
      const existing = growthMap.get(month);
      if (existing) {
        existing.anoAnterior += Number(venda.valor_venda);
      }
    });

    // Calcular crescimento
    const growth = Array.from(growthMap.values()).map(item => ({
      ...item,
      crescimento: item.anoAnterior > 0 ? 
        ((item.anoAtual - item.anoAnterior) / item.anoAnterior) * 100 : 
        item.anoAtual > 0 ? 100 : 0
    }));

    setGrowthData(growth);
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
            <p className="mt-2 text-muted-foreground">Carregando analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Ano Principal</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comparar com</label>
              <Select value={comparisonYear.toString()} onValueChange={(value) => setComparisonYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendas Mensais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolução Mensal {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="vendas" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparativo de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Crescimento: {selectedYear} vs {comparisonYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'crescimento') {
                    return [`${Number(value).toFixed(1)}%`, 'Crescimento'];
                  }
                  return [formatCurrency(Number(value)), name === 'anoAtual' ? selectedYear : comparisonYear];
                }}
                labelFormatter={(label) => `Mês ${label}`}
              />
              <Line type="monotone" dataKey="anoAtual" stroke="#8884d8" name={selectedYear.toString()} />
              <Line type="monotone" dataKey="anoAnterior" stroke="#82ca9d" name={comparisonYear.toString()} />
              <Line type="monotone" dataKey="crescimento" stroke="#ff7c7c" name="crescimento" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance por Vendedora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance por Vendedora {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vendedorasData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="vendas"
                >
                  {vendedorasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              <h4 className="font-medium">Ranking de Vendas</h4>
              {vendedorasData
                .sort((a, b) => b.vendas - a.vendas)
                .map((vendedora, index) => (
                  <div key={vendedora.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{vendedora.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(vendedora.vendas)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vendedora.count} vendas
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
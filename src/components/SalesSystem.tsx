import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Target, TrendingUp, Users, ShoppingCart, Calculator, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VendasDashboard } from "./VendasDashboard";
import { VendedorasManager } from "./VendedorasManager";
import { MetasManager } from "./MetasManager";
import { AnalyticsVendas } from "./AnalyticsVendas";

interface SalesSystemProps {
  onDataChange?: () => void;
}

interface SalesStats {
  vendaHoje: number;
  vendaSemana: number;
  vendaMes: number;
  vendaAno: number;
  metaMes: number;
  diasUteisRestantes: number;
  diasUteisMes: number;
  crescimentoMensal: number;
}

export const SalesSystem = ({ onDataChange }: SalesSystemProps) => {
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    vendaHoje: 0,
    vendaSemana: 0,
    vendaMes: 0,
    vendaAno: 0,
    metaMes: 0,
    diasUteisRestantes: 0,
    diasUteisMes: 0,
    crescimentoMensal: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSalesStats();
  }, []);

  const loadSalesStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      const startOfYear = new Date(year, 0, 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Vendas de hoje
      const { data: vendasHoje } = await supabase
        .from('vendas')
        .select('valor_venda')
        .eq('data_venda', today.toISOString().split('T')[0]);

      const vendaHoje = vendasHoje?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;

      // Vendas da semana
      const { data: vendasSemana } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', startOfWeek.toISOString().split('T')[0])
        .lte('data_venda', today.toISOString().split('T')[0]);

      const vendaSemana = vendasSemana?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;

      // Vendas do mês
      const { data: vendasMes } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', startOfMonth.toISOString().split('T')[0])
        .lte('data_venda', endOfMonth.toISOString().split('T')[0]);

      const vendaMes = vendasMes?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;

      // Vendas do ano
      const { data: vendasAno } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', startOfYear.toISOString().split('T')[0]);

      const vendaAno = vendasAno?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;

      // Meta do mês
      const { data: configVendas } = await supabase
        .from('config_vendas')
        .select('meta_loja_mensal')
        .single();

      const metaMes = configVendas?.meta_loja_mensal || 400000;

      // Calcular dias úteis
      const diasUteis = calculateBusinessDays();
      
      // Crescimento mensal (comparar com mês anterior)
      const lastMonth = new Date(year, month - 1, 1);
      const lastMonthEnd = new Date(year, month, 0);
      
      const { data: vendasMesAnterior } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', lastMonth.toISOString().split('T')[0])
        .lte('data_venda', lastMonthEnd.toISOString().split('T')[0]);

      const vendaMesAnterior = vendasMesAnterior?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;
      const crescimentoMensal = vendaMesAnterior > 0 ? ((vendaMes - vendaMesAnterior) / vendaMesAnterior) * 100 : 0;

      setSalesStats({
        vendaHoje,
        vendaSemana,
        vendaMes,
        vendaAno,
        metaMes,
        diasUteisRestantes: diasUteis.remaining,
        diasUteisMes: diasUteis.total,
        crescimentoMensal
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas de vendas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de vendas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBusinessDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let businessDaysTotal = 0;
    let businessDaysRemaining = 0;
    
    // Dias úteis: segunda a sábado (0 = domingo, 6 = sábado)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      // Se não é domingo (0), conta como dia útil
      if (dayOfWeek !== 0) {
        businessDaysTotal++;
        
        // Se a data é hoje ou futura, conta nos dias restantes
        if (date >= today) {
          businessDaysRemaining++;
        }
      }
    }
    
    return {
      total: businessDaysTotal,
      remaining: businessDaysRemaining
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMetaProgress = () => {
    return salesStats.metaMes > 0 ? (salesStats.vendaMes / salesStats.metaMes) * 100 : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando sistema de vendas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(salesStats.vendaHoje)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(salesStats.vendaMes)}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={getMetaProgress() >= 100 ? "default" : "secondary"}>
                {getMetaProgress().toFixed(1)}% da meta
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta do Mês</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(salesStats.metaMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faltam {formatCurrency(Math.max(0, salesStats.metaMes - salesStats.vendaMes))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Úteis</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {salesStats.diasUteisRestantes}
            </div>
            <p className="text-xs text-muted-foreground">
              de {salesStats.diasUteisMes} no mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas do Sistema de Vendas */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="vendedoras" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendedoras
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <VendasDashboard onDataChange={loadSalesStats} />
        </TabsContent>

        <TabsContent value="vendedoras" className="space-y-4">
          <VendedorasManager onVendedoraChange={loadSalesStats} />
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <MetasManager onMetaChange={loadSalesStats} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsVendas />
        </TabsContent>
      </Tabs>
    </div>
  );
};
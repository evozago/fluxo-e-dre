import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { PayablesTable } from "@/components/PayablesTable";
import { FornecedorManager } from "@/components/FornecedorManager";
import { Reports } from "@/components/Reports";
import { EntidadeManager } from "@/components/EntidadeManager";
import { ConfigurationSettings } from "@/components/ConfigurationSettings";
import { SalesSystem } from "@/components/SalesSystem";
import { MarcasManager } from "@/components/MarcasManager";
import { ProdutosManager } from "@/components/ProdutosManager";
import { FuncionariosManager } from "@/components/FuncionariosManager";
import { SystemStructure } from "@/components/SystemStructure";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalAberto: number;
  vencendoHoje: number;
  vencidos: number;
  pagosMesAtual: number;
}

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [stats, setStats] = useState<DashboardStats>({
    totalAberto: 0,
    vencendoHoje: 0,
    vencidos: 0,
    pagosMesAtual: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get current date in Brazil timezone
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7);
      
      // Query for open amounts
      const { data: openData, error: openError } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('status', 'aberto');
      
      if (openError) throw openError;
      
      // Query for due today
      const { data: dueTodayData, error: dueTodayError } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('data_vencimento', today)
        .eq('status', 'aberto');
      
      if (dueTodayError) throw dueTodayError;
      
      // Query for overdue
      const { data: overdueData, error: overdueError } = await supabase
        .from('ap_installments')
        .select('valor')
        .lt('data_vencimento', today)
        .eq('status', 'aberto');
      
      if (overdueError) throw overdueError;
      
      // Query for paid this month
      const { data: paidData, error: paidError } = await supabase
        .from('ap_installments')
        .select('valor')
        .gte('data_pagamento', currentMonth + '-01')
        .eq('status', 'pago');
      
      if (paidError) throw paidError;
      
      setStats({
        totalAberto: openData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        vencendoHoje: dueTodayData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        vencidos: overdueData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        pagosMesAtual: paidData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0
      });
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "payables":
        return <PayablesTable onDataChange={loadDashboardStats} />;
      case "suppliers":
        return <FornecedorManager onFornecedorChange={loadDashboardStats} />;
      case "brands":
        return <MarcasManager />;
      case "products":
        return <ProdutosManager />;
      case "reports":
        return <Reports />;
      case "entities":
        return <EntidadeManager onEntidadeChange={loadDashboardStats} />;
      case "sales":
        return <SalesSystem />;
      case "employees":
        return <FuncionariosManager onFuncionarioChange={loadDashboardStats} />;
      case "structure":
        return <SystemStructure />;
      case "settings":
        return <ConfigurationSettings />;
      default:
        return (
          <DashboardOverview 
            stats={stats} 
            loading={loading} 
            onRefresh={loadDashboardStats}
          />
        );
    }
  };

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { PayablesTable } from "@/components/PayablesTable";
import { FornecedorManager } from "@/components/FornecedorManager";
import { FuncionariosManager } from "@/components/FuncionariosManager";
import { Reports } from "@/components/Reports";
import { EntidadeManager } from "@/components/EntidadeManager";
import { ConfigurationSettings } from "@/components/ConfigurationSettings";
import { SalesSystem } from "@/components/SalesSystem";
import { MarcasManager } from "@/components/MarcasManager";
import { ProdutosManager } from "@/components/ProdutosManager";
import { SystemStructure } from "@/components/SystemStructure";
import { SystemOrganogram } from "@/components/SystemOrganogram";
import { SystemOrganogramEditable } from "@/components/SystemOrganogramEditable";
import { BancosManager } from "@/components/BancosManager";
import { HistoricoAlteracoes } from "@/components/HistoricoAlteracoes";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const { stats, loading, refreshStats } = useDashboardStats();

  const renderContent = () => {
    switch (activeTab) {
        case "payables":
          return <PayablesTable onDataChange={refreshStats} />;
      case "suppliers":
        return <FornecedorManager onFornecedorChange={refreshStats} />;
      case "brands":
        return <MarcasManager />;
      case "products":
        return <ProdutosManager />;
      case "reports":
        return <Reports />;
      case "entities":
        return <EntidadeManager onEntidadeChange={refreshStats} />;
      case "sales":
        return <SalesSystem />;
      case "employees":
        return <FuncionariosManager onFuncionarioChange={refreshStats} />;
      case "banks":
        return <BancosManager />;
      case "history":
        return <HistoricoAlteracoes />;
      case "structure":
        return <SystemStructure />;
      case "organogram":
        return <SystemOrganogramEditable />;
      case "settings":
        return <ConfigurationSettings />;
      default:
        return (
          <DashboardOverview 
            stats={stats} 
            loading={loading} 
            onRefresh={refreshStats}
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
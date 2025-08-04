import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Plus } from "lucide-react";
import { UploadNFeModal } from "@/components/UploadNFeModal";
import { NewExpenseModal } from "@/components/NewExpenseModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface DashboardStats {
  totalAberto: number;
  vencendoHoje: number;
  vencidos: number;
  pagosMesAtual: number;
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardOverview({ stats, loading, onRefresh }: DashboardOverviewProps) {
  const [nfeModalOpen, setNfeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statsCards = [
    {
      title: "Total em Aberto",
      value: stats.totalAberto,
      icon: FileText,
      status: "info" as const,
      description: "Contas pendentes"
    },
    {
      title: "Vencendo Hoje",
      value: stats.vencendoHoje,
      icon: AlertCircle,
      status: "warning" as const,
      description: "Requer atenção"
    },
    {
      title: "Vencidos",
      value: stats.vencidos,
      icon: AlertCircle,
      status: "danger" as const,
      description: "Pagamentos atrasados"
    },
    {
      title: "Pagos no Mês",
      value: stats.pagosMesAtual,
      icon: CheckCircle,
      status: "success" as const,
      description: "Pagamentos realizados"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-lg">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do sistema financeiro</p>
          </div>
          <LoadingSpinner size="lg" />
        </div>
        
        <div className="grid-responsive">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-8 w-32" />
              </CardHeader>
              <CardContent>
                <div className="skeleton h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema financeiro</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Button 
            size="sm"
            onClick={() => setExpenseModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive">
        {statsCards.map((card, index) => (
          <Card key={index} className="card-elevated card-interactive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(card.value)}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={card.status} className="text-xs">
                  {card.description}
                </StatusBadge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Operações mais utilizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="text-xs sm:text-sm">
                Upload NFe
              </TabsTrigger>
              <TabsTrigger value="expense" className="text-xs sm:text-sm">
                Nova Despesa
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium mb-2">Upload de NFe XML</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça upload de arquivos XML para gerar contas a pagar automaticamente
                  </p>
                  <Button onClick={() => setNfeModalOpen(true)}>
                    Fazer Upload
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            
            <TabsContent value="expense" className="mt-4">
              <div className="text-center space-y-4">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium mb-2">Nova Despesa Manual</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione uma nova despesa manualmente ao sistema
                  </p>
                  <Button onClick={() => setExpenseModalOpen(true)}>
                    Adicionar Despesa
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <UploadNFeModal 
        open={nfeModalOpen} 
        onOpenChange={setNfeModalOpen}
        onSuccess={onRefresh}
      />
      
      {/* Note: UploadReceiptModal requires installmentId, not used in overview */}
      
      <NewExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={setExpenseModalOpen}
        onSuccess={onRefresh}
      />
    </div>
  );
}
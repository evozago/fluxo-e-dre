import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Receipt, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UploadNFeModal } from "@/components/UploadNFeModal";
import { UploadReceiptModal } from "@/components/UploadReceiptModal";
import { NewExpenseModal } from "@/components/NewExpenseModal";
import { PayablesTable } from "@/components/PayablesTable";
import { FornecedorManager } from "@/components/FornecedorManager";
import { Reports } from "@/components/Reports";
import { EntidadeManager } from "@/components/EntidadeManager";
import { ConfigurationSettings } from "@/components/ConfigurationSettings";
import { SalesSystem } from "@/components/SalesSystem";
import { MarcasManager } from "@/components/MarcasManager";
import { ProdutosManager } from "@/components/ProdutosManager";

interface DashboardStats {
  totalAberto: number;
  vencendoHoje: number;
  vencidos: number;
  pagosMesAtual: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAberto: 0,
    vencendoHoje: 0,
    vencidos: 0,
    pagosMesAtual: 0
  });
  const [loading, setLoading] = useState(true);
  const [nfeModalOpen, setNfeModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [companyConfig, setCompanyConfig] = useState({
    cnpj: "",
    razaoSocial: "Lui Bambini Ltda"
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      // Total em aberto
      const { data: totalAberto } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('status', 'aberto');

      // Vencendo hoje
      const { data: vencendoHoje } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('status', 'aberto')
        .eq('data_vencimento', today);

      // Vencidos
      const { data: vencidos } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('status', 'vencido');

      // Pagos no mês atual
      const { data: pagosMes } = await supabase
        .from('ap_installments')
        .select('valor')
        .eq('status', 'pago')
        .gte('data_pagamento', firstDayOfMonth)
        .lte('data_pagamento', lastDayOfMonth);

      setStats({
        totalAberto: totalAberto?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        vencendoHoje: vencendoHoje?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        vencidos: vencidos?.reduce((sum, item) => sum + Number(item.valor), 0) || 0,
        pagosMesAtual: pagosMes?.reduce((sum, item) => sum + Number(item.valor), 0) || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lui Bambini - Contas a Pagar</h1>
            <p className="text-muted-foreground">Sistema de gestão financeira e DRE</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setNfeModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload NFe
            </Button>
            <Button variant="outline" onClick={() => setReceiptModalOpen(true)}>
              <Receipt className="w-4 h-4 mr-2" />
              Comprovante
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalAberto)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencendo Hoje</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.vencendoHoje)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.vencidos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos este Mês</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.pagosMesAtual)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contas" className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="contas">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="marcas">Marcas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="entidades">Entidades</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
          </TabsList>

          <TabsContent value="contas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contas a Pagar</CardTitle>
                <CardDescription>
                  Gerencie suas contas a pagar, faça upload de NFe e comprove pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button className="flex-1" onClick={() => setNfeModalOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload NFe XML
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setExpenseModalOpen(true)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Nova Despesa Manual
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setReceiptModalOpen(true)}>
                      <Receipt className="w-4 h-4 mr-2" />
                      Upload Comprovante
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <PayablesTable onDataChange={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-4">
            <FornecedorManager onFornecedorChange={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="marcas" className="space-y-4">
            <MarcasManager />
          </TabsContent>

          <TabsContent value="produtos" className="space-y-4">
            <ProdutosManager />
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Reports onDataChange={loadDashboardStats} />
          </TabsContent>
          
          <TabsContent value="entidades" className="space-y-4">
            <EntidadeManager onEntidadeChange={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="dre" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
                <CardDescription>
                  Visualize a DRE consolidada por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Período de</Label>
                      <Input 
                        id="startDate"
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Período até</Label>
                      <Input 
                        id="endDate"
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={() => {
                    if (!startDate || !endDate) {
                      toast({ title: "Erro", description: "Selecione ambas as datas", variant: "destructive" });
                      return;
                    }
                    toast({ title: "DRE Gerada", description: `Período: ${startDate} a ${endDate}` });
                  }}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Gerar DRE
                  </Button>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-center text-muted-foreground">
                      Selecione um período para gerar a DRE
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configure parâmetros do sistema e dados da empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                    <Input 
                      id="cnpj"
                      type="text" 
                      placeholder="00.000.000/0001-00"
                      value={companyConfig.cnpj}
                      onChange={(e) => setCompanyConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input 
                      id="razaoSocial"
                      type="text" 
                      placeholder="Lui Bambini Ltda"
                      value={companyConfig.razaoSocial}
                      onChange={(e) => setCompanyConfig(prev => ({ ...prev, razaoSocial: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={() => {
                    toast({ 
                      title: "Configurações Salvas", 
                      description: `CNPJ: ${companyConfig.cnpj} | Razão Social: ${companyConfig.razaoSocial}` 
                    });
                  }}>Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendas" className="space-y-4">
            <SalesSystem onDataChange={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="parametros" className="space-y-4">
            <ConfigurationSettings onConfigChange={loadDashboardStats} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <UploadNFeModal open={nfeModalOpen} onOpenChange={setNfeModalOpen} onSuccess={loadDashboardStats} />
        <UploadReceiptModal 
          isOpen={receiptModalOpen} 
          onOpenChange={setReceiptModalOpen}
          installmentId=""
          onSuccess={() => {}}
        />
        <NewExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
      </div>
    </div>
  );
};

export default Dashboard;
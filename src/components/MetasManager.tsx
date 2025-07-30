import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Calculator, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MetasManagerProps {
  onMetaChange?: () => void;
}

interface MetaMensal {
  id: string;
  vendedora_id: string;
  ano: number;
  mes: number;
  meta_valor: number;
  supermeta_valor?: number;
  vendas_realizadas: number;
  comissao_calculada: number;
  vendedora_nome?: string;
}

interface Vendedora {
  id: string;
  nome: string;
  comissao_padrao: number;
  comissao_supermeta: number;
}

export const MetasManager = ({ onMetaChange }: MetasManagerProps) => {
  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [metaLoja, setMetaLoja] = useState("");
  const { toast } = useToast();

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" }
  ];

  useEffect(() => {
    loadMetas();
    loadVendedoras();
    loadConfigVendas();
  }, [selectedYear, selectedMonth]);

  const loadMetas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('metas_mensais')
        .select(`
          *,
          vendedoras (nome, comissao_padrao, comissao_supermeta)
        `)
        .eq('ano', selectedYear)
        .eq('mes', selectedMonth);

      if (error) throw error;
      
      const metasWithNames = (data || []).map(meta => ({
        ...meta,
        vendedora_nome: meta.vendedoras?.nome || 'Vendedora não encontrada'
      }));
      
      setMetas(metasWithNames);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendedoras = async () => {
    try {
      const { data, error } = await supabase
        .from('vendedoras')
        .select('id, nome, comissao_padrao, comissao_supermeta')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setVendedoras(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendedoras:', error);
    }
  };

  const loadConfigVendas = async () => {
    try {
      const { data, error } = await supabase
        .from('config_vendas')
        .select('meta_loja_mensal')
        .single();

      if (error) throw error;
      setMetaLoja(data?.meta_loja_mensal?.toString() || "400000");
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const generateMetasAutomaticas = async () => {
    if (!metaLoja || !vendedoras.length) {
      toast({
        title: "Erro",
        description: "Configure a meta da loja e cadastre vendedoras primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      const metaLojaValue = parseFloat(metaLoja);
      const metaPorVendedora = metaLojaValue / vendedoras.length;

      const metasToInsert = vendedoras.map(vendedora => ({
        vendedora_id: vendedora.id,
        ano: selectedYear,
        mes: selectedMonth,
        meta_valor: metaPorVendedora,
        supermeta_valor: metaPorVendedora * 1.5, // 50% acima da meta
        vendas_realizadas: 0,
        comissao_calculada: 0
      }));

      // Remover metas existentes do período
      await supabase
        .from('metas_mensais')
        .delete()
        .eq('ano', selectedYear)
        .eq('mes', selectedMonth);

      // Inserir novas metas
      const { error } = await supabase
        .from('metas_mensais')
        .insert(metasToInsert);

      if (error) throw error;

      toast({
        title: "Metas geradas",
        description: `Metas automáticas criadas para ${months.find(m => m.value === selectedMonth)?.label}/${selectedYear}`
      });

      loadMetas();
      onMetaChange?.();
    } catch (error: any) {
      console.error('Erro ao gerar metas:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar as metas",
        variant: "destructive"
      });
    }
  };

  const updateMetaLoja = async () => {
    if (!metaLoja) return;

    try {
      const { error } = await supabase
        .from('config_vendas')
        .update({ meta_loja_mensal: parseFloat(metaLoja) })
        .eq('id', (await supabase.from('config_vendas').select('id').single()).data?.id);

      if (error) throw error;

      toast({
        title: "Meta da loja atualizada",
        description: `Nova meta: ${formatCurrency(parseFloat(metaLoja))}`
      });

      onMetaChange?.();
    } catch (error: any) {
      console.error('Erro ao atualizar meta da loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta da loja",
        variant: "destructive"
      });
    }
  };

  const calcularComissao = async (meta: MetaMensal) => {
    try {
      // Buscar vendas da vendedora no período
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('valor_venda')
        .eq('vendedora_id', meta.vendedora_id)
        .gte('data_venda', `${meta.ano}-${meta.mes.toString().padStart(2, '0')}-01`)
        .lt('data_venda', `${meta.ano}-${(meta.mes + 1).toString().padStart(2, '0')}-01`);

      if (error) throw error;

      const vendasRealizadas = vendas?.reduce((sum, v) => sum + Number(v.valor_venda), 0) || 0;
      
      // Buscar dados da vendedora
      const vendedora = vendedoras.find(v => v.id === meta.vendedora_id);
      if (!vendedora) return;

      let comissaoCalculada = 0;
      
      if (vendasRealizadas <= meta.meta_valor) {
        // Comissão padrão sobre o valor vendido
        comissaoCalculada = vendasRealizadas * (vendedora.comissao_padrao / 100);
      } else {
        // Comissão padrão sobre a meta + comissão supermeta sobre o excedente
        comissaoCalculada = meta.meta_valor * (vendedora.comissao_padrao / 100);
        const excedente = vendasRealizadas - meta.meta_valor;
        comissaoCalculada += excedente * (vendedora.comissao_supermeta / 100);
      }

      // Atualizar na base de dados
      const { error: updateError } = await supabase
        .from('metas_mensais')
        .update({
          vendas_realizadas: vendasRealizadas,
          comissao_calculada: comissaoCalculada
        })
        .eq('id', meta.id);

      if (updateError) throw updateError;

      toast({
        title: "Comissão calculada",
        description: `${meta.vendedora_nome}: ${formatCurrency(comissaoCalculada)}`
      });

      loadMetas();
    } catch (error: any) {
      console.error('Erro ao calcular comissão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular a comissão",
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

  const getProgressPercent = (vendas: number, meta: number) => {
    return meta > 0 ? (vendas / meta) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configuração de Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="metaLoja">Meta da Loja (R$)</Label>
              <Input
                id="metaLoja"
                type="number"
                step="0.01"
                value={metaLoja}
                onChange={(e) => setMetaLoja(e.target.value)}
                placeholder="400000.00"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={updateMetaLoja} variant="outline" className="w-full">
                Atualizar Meta
              </Button>
            </div>

            <div className="flex items-end">
              <Button onClick={generateMetasAutomaticas} className="w-full">
                Gerar Metas Auto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Metas de {months.find(m => m.value === selectedMonth)?.label}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando metas...</p>
            </div>
          ) : metas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma meta configurada para este período.
                <br />
                Use o botão "Gerar Metas Auto" para criar automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {metas.map((meta) => (
                <Card key={meta.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold">{meta.vendedora_nome}</h3>
                        <p className="text-sm text-muted-foreground">Vendedora</p>
                      </div>

                      <div>
                        <p className="font-bold text-blue-600">{formatCurrency(meta.meta_valor)}</p>
                        <p className="text-sm text-muted-foreground">Meta</p>
                      </div>

                      <div>
                        <p className="font-bold text-green-600">{formatCurrency(meta.vendas_realizadas)}</p>
                        <p className="text-sm text-muted-foreground">Vendas</p>
                        <Badge 
                          variant={getProgressPercent(meta.vendas_realizadas, meta.meta_valor) >= 100 ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {getProgressPercent(meta.vendas_realizadas, meta.meta_valor).toFixed(1)}%
                        </Badge>
                      </div>

                      <div>
                        <p className="font-bold text-purple-600">{formatCurrency(meta.supermeta_valor || 0)}</p>
                        <p className="text-sm text-muted-foreground">Supermeta</p>
                      </div>

                      <div>
                        <p className="font-bold text-orange-600">{formatCurrency(meta.comissao_calculada)}</p>
                        <p className="text-sm text-muted-foreground">Comissão</p>
                      </div>

                      <div>
                        <Button onClick={() => calcularComissao(meta)} size="sm" className="w-full">
                          <Calculator className="h-4 w-4 mr-2" />
                          Calcular
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
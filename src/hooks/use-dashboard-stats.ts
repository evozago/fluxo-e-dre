import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalAberto: number;
  vencendoHoje: number;
  vencidos: number;
  pagosMesAtual: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando estatísticas do dashboard...');
      
      // Usar a nova função otimizada do banco
      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats');

      if (rpcError) {
        console.error('❌ Erro ao carregar estatísticas:', rpcError);
        throw rpcError;
      }

      if (data && data.length > 0) {
        const result = data[0];
        const dashboardStats: DashboardStats = {
          totalAberto: Number(result.total_aberto),
          vencendoHoje: Number(result.vencendo_hoje),
          vencidos: Number(result.vencidos),
          pagosMesAtual: Number(result.pagos_mes_atual)
        };

        console.log('✅ Estatísticas carregadas:', dashboardStats);
        setStats(dashboardStats);
      } else {
        setStats({
          totalAberto: 0,
          vencendoHoje: 0,
          vencidos: 0,
          pagosMesAtual: 0
        });
      }
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Carregar estatísticas iniciais
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PayableInstallment {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  categoria?: string;
  numero_documento?: string;
  numero_parcela?: number;
  total_parcelas?: number;
  observacoes?: string;
  banco?: string;
  forma_pagamento?: string;
  entidade_id?: string;
  entidade_nome?: string;
  entidade_tipo?: string;
  funcionario_id?: string;
  funcionario_nome?: string;
  conta_bancaria_id?: string;
  conta_banco_nome?: string;
  eh_recorrente?: boolean;
  valor_fixo?: boolean;
  tipo_recorrencia?: string;
  comprovante_path?: string;
  dados_pagamento?: string;
  data_hora_pagamento?: string;
  valor_total_titulo?: number;
  nfe_id?: string;
  created_at: string;
  updated_at: string;
  status_calculado: string;
}

export interface PayableFilters {
  status?: string;
  fornecedor?: string;
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  searchTerm?: string;
}

export interface PayableStats {
  totalCount: number;
  totalAberto: number;
  totalVencido: number;
  totalPago: number;
}

interface UsePayablesDataReturn {
  installments: PayableInstallment[];
  stats: PayableStats;
  loading: boolean;
  error: string | null;
  loadData: (filters?: PayableFilters, page?: number, limit?: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const usePayablesData = (): UsePayablesDataReturn => {
  const [installments, setInstallments] = useState<PayableInstallment[]>([]);
  const [stats, setStats] = useState<PayableStats>({
    totalCount: 0,
    totalAberto: 0,
    totalVencido: 0,
    totalPago: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PayableFilters>({});

  const loadData = useCallback(async (
    filters: PayableFilters = {},
    page = 1,
    limit = 50
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Carregando dados com filtros:', filters);
      
      const offset = (page - 1) * limit;
      
      // Usar a nova função otimizada do banco
      const { data, error: rpcError } = await supabase.rpc('search_ap_installments', {
        p_limit: limit,
        p_offset: offset,
        p_status: filters.status || null,
        p_fornecedor: filters.fornecedor || null,
        p_data_inicio: filters.dataInicio || null,
        p_data_fim: filters.dataFim || null,
        p_categoria: filters.categoria || null,
        p_search_term: filters.searchTerm || null
      });

      if (rpcError) {
        console.error('❌ Erro na busca RPC:', rpcError);
        throw rpcError;
      }

      if (data && data.length > 0) {
        const result = data[0];
        const installmentsData = Array.isArray(result.data) ? result.data as unknown as PayableInstallment[] : [];
        
        console.log('✅ Dados carregados:', {
          installments: installmentsData.length,
          totalCount: result.total_count,
          totalAberto: result.total_aberto,
          totalVencido: result.total_vencido,
          totalPago: result.total_pago
        });

        setInstallments(installmentsData);
        setStats({
          totalCount: Number(result.total_count),
          totalAberto: Number(result.total_aberto),
          totalVencido: Number(result.total_vencido),
          totalPago: Number(result.total_pago)
        });
      } else {
        setInstallments([]);
        setStats({
          totalCount: 0,
          totalAberto: 0,
          totalVencido: 0,
          totalPago: 0
        });
      }

      setCurrentFilters(filters);
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadData(currentFilters);
  }, [currentFilters, loadData]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    installments,
    stats,
    loading,
    error,
    loadData,
    refreshData
  };
};
-- Fase 1: Reestruturação do Sistema - Índices, Views e Funções

-- 1. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ap_installments_status ON ap_installments(status);
CREATE INDEX IF NOT EXISTS idx_ap_installments_data_vencimento ON ap_installments(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_ap_installments_fornecedor ON ap_installments(fornecedor);
CREATE INDEX IF NOT EXISTS idx_ap_installments_entidade ON ap_installments(entidade_id);
CREATE INDEX IF NOT EXISTS idx_ap_installments_recorrente ON ap_installments(eh_recorrente);
CREATE INDEX IF NOT EXISTS idx_ap_installments_composto ON ap_installments(status, data_vencimento, eh_recorrente);

-- 2. CRIAR VIEW CONSOLIDADA PARA DADOS COMPLETOS
CREATE OR REPLACE VIEW v_ap_installments_complete AS
SELECT 
  ai.*,
  e.nome as entidade_nome,
  e.tipo as entidade_tipo,
  f.nome as funcionario_nome,
  cb.nome_banco as conta_banco_nome,
  CASE 
    WHEN ai.data_vencimento < CURRENT_DATE AND ai.status = 'aberto' THEN 'vencido'
    WHEN ai.data_vencimento = CURRENT_DATE AND ai.status = 'aberto' THEN 'vencendo_hoje'
    ELSE ai.status
  END as status_calculado
FROM ap_installments ai
LEFT JOIN entidades e ON ai.entidade_id = e.id
LEFT JOIN funcionarios f ON ai.funcionario_id = f.id
LEFT JOIN contas_bancarias cb ON ai.conta_bancaria_id = cb.id;

-- 3. FUNÇÃO PARA BUSCA OTIMIZADA COM FILTROS
CREATE OR REPLACE FUNCTION search_ap_installments(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_fornecedor TEXT DEFAULT NULL,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  data JSONB,
  total_count BIGINT,
  total_aberto NUMERIC,
  total_vencido NUMERIC,
  total_pago NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
  where_clause TEXT := 'WHERE 1=1';
  count_query TEXT;
  main_query TEXT;
BEGIN
  -- Construir cláusula WHERE dinamicamente
  IF p_status IS NOT NULL THEN
    where_clause := where_clause || ' AND status = ''' || p_status || '''';
  END IF;
  
  IF p_fornecedor IS NOT NULL THEN
    where_clause := where_clause || ' AND fornecedor ILIKE ''%' || p_fornecedor || '%''';
  END IF;
  
  IF p_data_inicio IS NOT NULL THEN
    where_clause := where_clause || ' AND data_vencimento >= ''' || p_data_inicio || '''';
  END IF;
  
  IF p_data_fim IS NOT NULL THEN
    where_clause := where_clause || ' AND data_vencimento <= ''' || p_data_fim || '''';
  END IF;
  
  IF p_categoria IS NOT NULL THEN
    where_clause := where_clause || ' AND categoria ILIKE ''%' || p_categoria || '%''';
  END IF;
  
  IF p_search_term IS NOT NULL THEN
    where_clause := where_clause || ' AND (descricao ILIKE ''%' || p_search_term || '%'' OR numero_documento ILIKE ''%' || p_search_term || '%'')';
  END IF;

  -- Query principal
  main_query := 'SELECT jsonb_agg(row_to_json(sub.*)) as data FROM (
    SELECT * FROM v_ap_installments_complete ' || where_clause || '
    ORDER BY data_vencimento DESC, created_at DESC
    LIMIT ' || p_limit || ' OFFSET ' || p_offset || '
  ) sub';

  -- Executar e retornar resultados
  RETURN QUERY EXECUTE 'WITH main_data AS (' || main_query || '),
    totals AS (
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = ''aberto'' THEN valor ELSE 0 END), 0) as total_aberto,
        COALESCE(SUM(CASE WHEN status = ''vencido'' THEN valor ELSE 0 END), 0) as total_vencido,
        COALESCE(SUM(CASE WHEN status = ''pago'' THEN valor ELSE 0 END), 0) as total_pago
      FROM ap_installments ' || where_clause || '
    )
    SELECT 
      COALESCE(main_data.data, ''[]''::jsonb) as data,
      totals.total_count,
      totals.total_aberto,
      totals.total_vencido,
      totals.total_pago
    FROM main_data, totals';
END;
$$;

-- 4. CRIAR TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS ap_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  record_id UUID
);

-- 5. TRIGGER PARA AUDITORIA AUTOMÁTICA
CREATE OR REPLACE FUNCTION audit_ap_installments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO ap_audit_log (table_name, operation, old_data, record_id)
    VALUES ('ap_installments', 'DELETE', row_to_json(OLD)::jsonb, OLD.id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO ap_audit_log (table_name, operation, old_data, new_data, record_id)
    VALUES ('ap_installments', 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO ap_audit_log (table_name, operation, new_data, record_id)
    VALUES ('ap_installments', 'INSERT', row_to_json(NEW)::jsonb, NEW.id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_audit_ap_installments ON ap_installments;
CREATE TRIGGER trigger_audit_ap_installments
  AFTER INSERT OR UPDATE OR DELETE ON ap_installments
  FOR EACH ROW EXECUTE FUNCTION audit_ap_installments();

-- 6. FUNÇÃO PARA ESTATÍSTICAS DO DASHBOARD
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_aberto NUMERIC,
  vencendo_hoje NUMERIC,
  vencidos NUMERIC,
  pagos_mes_atual NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'aberto' THEN valor ELSE 0 END), 0) as total_aberto,
    COALESCE(SUM(CASE WHEN status = 'aberto' AND data_vencimento = CURRENT_DATE THEN valor ELSE 0 END), 0) as vencendo_hoje,
    COALESCE(SUM(CASE WHEN status = 'aberto' AND data_vencimento < CURRENT_DATE THEN valor ELSE 0 END), 0) as vencidos,
    COALESCE(SUM(CASE WHEN status = 'pago' AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE) THEN valor ELSE 0 END), 0) as pagos_mes_atual
  FROM ap_installments;
END;
$$;

-- 7. ATUALIZAR DESPESAS RECORRENTES PARA GARANTIR NÚMERO DE DOCUMENTO
UPDATE ap_installments 
SET numero_documento = (
  'REC-' || TO_CHAR(data_vencimento, 'DDMMYYYY') || '-' || 
  LPAD((
    SELECT COUNT(*)::text 
    FROM ap_installments ai2 
    WHERE ai2.fornecedor = ap_installments.fornecedor 
      AND ai2.descricao = ap_installments.descricao 
      AND ai2.data_vencimento <= ap_installments.data_vencimento
      AND ai2.eh_recorrente = true
  ), 3, '0')
)
WHERE eh_recorrente = true AND numero_documento IS NULL;

-- 8. HABILITAR RLS NA TABELA DE AUDITORIA
ALTER TABLE ap_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ap_audit_log" 
ON ap_audit_log 
FOR ALL 
USING (true)
WITH CHECK (true);
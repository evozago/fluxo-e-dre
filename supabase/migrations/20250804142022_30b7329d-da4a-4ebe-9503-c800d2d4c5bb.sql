-- Corrigir problemas de segurança detectados pela migração

-- 1. Corrigir função search_ap_installments com search_path seguro
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
SECURITY DEFINER
SET search_path = public
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

-- 2. Corrigir função audit_ap_installments com search_path seguro
CREATE OR REPLACE FUNCTION audit_ap_installments()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 3. Corrigir função get_dashboard_stats com search_path seguro
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_aberto NUMERIC,
  vencendo_hoje NUMERIC,
  vencidos NUMERIC,
  pagos_mes_atual NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 4. Corrigir funções existentes do sistema
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_installment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_pagamento IS NOT NULL THEN
    NEW.status = 'pago';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencido';
  ELSE
    NEW.status = 'aberto';
  END IF;
  RETURN NEW;
END;
$$;
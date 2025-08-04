-- Phase 1: Critical Security Fixes

-- First, drop all the dangerous "Allow all operations" policies
DROP POLICY IF EXISTS "Allow all operations on ap_audit_log" ON public.ap_audit_log;
DROP POLICY IF EXISTS "Allow all operations on ap_installments" ON public.ap_installments;
DROP POLICY IF EXISTS "Allow all operations on categorias_produtos" ON public.categorias_produtos;
DROP POLICY IF EXISTS "Allow all operations on config_vendas" ON public.config_vendas;
DROP POLICY IF EXISTS "Allow all operations on contas_bancarias" ON public.contas_bancarias;
DROP POLICY IF EXISTS "Allow all operations on detalhes_produtos" ON public.detalhes_produtos;
DROP POLICY IF EXISTS "Allow all operations on entidades" ON public.entidades;
DROP POLICY IF EXISTS "Allow all operations on fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Allow all operations on funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow all operations on marcas" ON public.marcas;
DROP POLICY IF EXISTS "Allow all operations on meios_pagamento_vendas" ON public.meios_pagamento_vendas;
DROP POLICY IF EXISTS "Allow all operations on metas_mensais" ON public.metas_mensais;
DROP POLICY IF EXISTS "Allow all operations on nfe_data" ON public.nfe_data;
DROP POLICY IF EXISTS "Allow all operations on pedidos_produtos" ON public.pedidos_produtos;
DROP POLICY IF EXISTS "Allow all operations on produto_variacoes" ON public.produto_variacoes;
DROP POLICY IF EXISTS "Allow all operations on produtos" ON public.produtos;
DROP POLICY IF EXISTS "Allow all operations on representantes_contatos" ON public.representantes_contatos;
DROP POLICY IF EXISTS "Allow all operations on system_configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "Allow all operations on tipos_manga" ON public.tipos_manga;
DROP POLICY IF EXISTS "Allow all operations on vendas" ON public.vendas;
DROP POLICY IF EXISTS "Allow all operations on vendedoras" ON public.vendedoras;

-- Create user profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Secure RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Secure RLS Policies for ap_installments (financial data - requires authentication)
CREATE POLICY "Authenticated users can view installments" ON public.ap_installments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert installments" ON public.ap_installments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update installments" ON public.ap_installments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete installments" ON public.ap_installments
  FOR DELETE TO authenticated USING (public.is_admin());

-- Secure RLS Policies for audit log (admin only)
CREATE POLICY "Only admins can view audit log" ON public.ap_audit_log
  FOR SELECT TO authenticated USING (public.is_admin());

-- Secure RLS Policies for fornecedores
CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert fornecedores" ON public.fornecedores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update fornecedores" ON public.fornecedores
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete fornecedores" ON public.fornecedores
  FOR DELETE TO authenticated USING (public.is_admin());

-- Secure RLS Policies for funcionarios (sensitive PII data)
CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify funcionarios" ON public.funcionarios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update funcionarios" ON public.funcionarios
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Only admins can delete funcionarios" ON public.funcionarios
  FOR DELETE TO authenticated USING (public.is_admin());

-- Secure RLS Policies for other tables (authenticated users only)
CREATE POLICY "Authenticated users can access categorias_produtos" ON public.categorias_produtos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access config_vendas" ON public.config_vendas
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access contas_bancarias" ON public.contas_bancarias
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access detalhes_produtos" ON public.detalhes_produtos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access entidades" ON public.entidades
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access marcas" ON public.marcas
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access meios_pagamento_vendas" ON public.meios_pagamento_vendas
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access metas_mensais" ON public.metas_mensais
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access nfe_data" ON public.nfe_data
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access pedidos_produtos" ON public.pedidos_produtos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access produto_variacoes" ON public.produto_variacoes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access produtos" ON public.produtos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access representantes_contatos" ON public.representantes_contatos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Only admins can access system_configurations" ON public.system_configurations
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Authenticated users can access tipos_manga" ON public.tipos_manga
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access vendas" ON public.vendas
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access vendedoras" ON public.vendedoras
  FOR ALL TO authenticated USING (true);

-- Update the view to be security definer to prevent RLS issues
DROP VIEW IF EXISTS public.v_ap_installments_complete;
CREATE OR REPLACE FUNCTION public.get_ap_installments_complete()
RETURNS TABLE(
  id uuid,
  descricao text,
  fornecedor text,
  categoria text,
  valor numeric,
  data_vencimento date,
  data_pagamento date,
  status text,
  status_calculado text,
  numero_documento text,
  banco text,
  forma_pagamento text,
  observacoes text,
  comprovante_path text,
  numero_parcela integer,
  total_parcelas integer,
  valor_total_titulo numeric,
  eh_recorrente boolean,
  tipo_recorrencia text,
  dados_pagamento text,
  data_hora_pagamento timestamp with time zone,
  funcionario_id uuid,
  funcionario_nome text,
  conta_bancaria_id uuid,
  conta_banco_nome text,
  entidade_id uuid,
  entidade_nome text,
  entidade_tipo text,
  nfe_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  valor_fixo boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.descricao,
    ap.fornecedor,
    ap.categoria,
    ap.valor,
    ap.data_vencimento,
    ap.data_pagamento,
    ap.status,
    CASE 
      WHEN ap.data_pagamento IS NOT NULL THEN 'pago'::text
      WHEN ap.data_vencimento < CURRENT_DATE THEN 'vencido'::text
      ELSE 'aberto'::text
    END as status_calculado,
    ap.numero_documento,
    ap.banco,
    ap.forma_pagamento,
    ap.observacoes,
    ap.comprovante_path,
    ap.numero_parcela,
    ap.total_parcelas,
    ap.valor_total_titulo,
    ap.eh_recorrente,
    ap.tipo_recorrencia,
    ap.dados_pagamento,
    ap.data_hora_pagamento,
    ap.funcionario_id,
    f.nome as funcionario_nome,
    ap.conta_bancaria_id,
    cb.nome_banco as conta_banco_nome,
    ap.entidade_id,
    e.nome as entidade_nome,
    e.tipo as entidade_tipo,
    ap.nfe_id,
    ap.created_at,
    ap.updated_at,
    ap.valor_fixo
  FROM ap_installments ap
  LEFT JOIN funcionarios f ON ap.funcionario_id = f.id
  LEFT JOIN contas_bancarias cb ON ap.conta_bancaria_id = cb.id
  LEFT JOIN entidades e ON ap.entidade_id = e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_ap_installments_complete() TO authenticated;
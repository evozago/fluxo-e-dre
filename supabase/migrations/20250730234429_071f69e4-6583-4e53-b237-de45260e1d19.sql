-- Criar tabela para vendedoras/funcionários
CREATE TABLE IF NOT EXISTS public.vendedoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  meta_mensal NUMERIC DEFAULT 0,
  comissao_padrao NUMERIC DEFAULT 3.0,
  comissao_supermeta NUMERIC DEFAULT 5.0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para metas mensais individualizadas
CREATE TABLE IF NOT EXISTS public.metas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedora_id UUID NOT NULL REFERENCES public.vendedoras(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  meta_valor NUMERIC NOT NULL,
  supermeta_valor NUMERIC,
  vendas_realizadas NUMERIC DEFAULT 0,
  comissao_calculada NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendedora_id, ano, mes)
);

-- Criar tabela para vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedora_id UUID NOT NULL REFERENCES public.vendedoras(id) ON DELETE CASCADE,
  data_venda DATE NOT NULL,
  valor_venda NUMERIC NOT NULL,
  forma_pagamento TEXT,
  cliente_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para meios de pagamento das vendas
CREATE TABLE IF NOT EXISTS public.meios_pagamento_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações gerais do sistema de vendas
CREATE TABLE IF NOT EXISTS public.config_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_loja_mensal NUMERIC DEFAULT 0,
  dias_uteis_considerados TEXT DEFAULT 'segunda,terca,quarta,quinta,sexta,sabado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.vendedoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meios_pagamento_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para todas as tabelas
CREATE POLICY "Allow all operations on vendedoras" 
ON public.vendedoras 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on metas_mensais" 
ON public.metas_mensais 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on vendas" 
ON public.vendas 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on meios_pagamento_vendas" 
ON public.meios_pagamento_vendas 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on config_vendas" 
ON public.config_vendas 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar triggers para updated_at
CREATE TRIGGER update_vendedoras_updated_at
BEFORE UPDATE ON public.vendedoras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_mensais_updated_at
BEFORE UPDATE ON public.metas_mensais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at
BEFORE UPDATE ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_vendas_updated_at
BEFORE UPDATE ON public.config_vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir meios de pagamento padrão
INSERT INTO public.meios_pagamento_vendas (nome) VALUES 
('Dinheiro'),
('PIX'),
('Cartão de Débito'),
('Cartão de Crédito'),
('Transferência Bancária'),
('Cheque')
ON CONFLICT (nome) DO NOTHING;

-- Inserir configuração inicial
INSERT INTO public.config_vendas (meta_loja_mensal) VALUES (400000.00)
ON CONFLICT DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metas_mensais_vendedora_ano_mes ON public.metas_mensais(vendedora_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedora_data ON public.vendas(vendedora_id, data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas(data_venda);
-- Criar tabela para configurações do sistema
CREATE TABLE public.system_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type text NOT NULL,
  config_data jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Allow all operations on system_configurations" 
ON public.system_configurations 
FOR ALL 
USING (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON public.system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO public.system_configurations (config_type, config_data) 
VALUES 
  ('categorias', '["Contabilidade", "Aluguel", "Fornecedores", "Salários", "Impostos", "Energia", "Telefone", "Internet", "Água", "Manutenção", "Marketing", "Combustível", "Outras Despesas", "Geral"]'),
  ('formas_pagamento', '["Dinheiro", "PIX", "Transferência Bancária", "Boleto Bancário", "Cartão de Débito", "Cartão de Crédito", "Cheque"]'),
  ('bancos', '["Banco do Brasil", "Caixa Econômica Federal", "Bradesco", "Itaú", "Santander", "Nubank", "Inter", "C6 Bank", "BTG Pactual", "Sicoob", "Sicredi", "Banrisul", "Safra", "Outro"]');
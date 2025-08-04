-- Criar tabela para armazenar dados das NFe
CREATE TABLE public.nfe_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nfe TEXT NOT NULL,
  serie TEXT NOT NULL,
  chave_acesso TEXT NOT NULL UNIQUE,
  cnpj_emitente TEXT NOT NULL,
  nome_emitente TEXT NOT NULL,
  cnpj_destinatario TEXT,
  nome_destinatario TEXT,
  data_emissao DATE NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL,
  valor_icms DECIMAL(15,2) DEFAULT 0,
  valor_ipi DECIMAL(15,2) DEFAULT 0,
  valor_pis DECIMAL(15,2) DEFAULT 0,
  valor_cofins DECIMAL(15,2) DEFAULT 0,
  xml_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para contas a pagar
CREATE TABLE public.ap_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nfe_id UUID REFERENCES public.nfe_data(id),
  descricao TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  categoria TEXT DEFAULT 'Geral',
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'pago', 'vencido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.nfe_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_installments ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (dados públicos para simplicidade inicial)
CREATE POLICY "Allow all operations on nfe_data" ON public.nfe_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ap_installments" ON public.ap_installments FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_nfe_data_updated_at
  BEFORE UPDATE ON public.nfe_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ap_installments_updated_at
  BEFORE UPDATE ON public.ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar status automaticamente
CREATE OR REPLACE FUNCTION public.update_installment_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger para atualização automática de status
CREATE TRIGGER update_installment_status_trigger
  BEFORE INSERT OR UPDATE ON public.ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installment_status();

-- Índices para melhor performance
CREATE INDEX idx_nfe_data_chave_acesso ON public.nfe_data(chave_acesso);
CREATE INDEX idx_nfe_data_cnpj_emitente ON public.nfe_data(cnpj_emitente);
CREATE INDEX idx_ap_installments_status ON public.ap_installments(status);
CREATE INDEX idx_ap_installments_data_vencimento ON public.ap_installments(data_vencimento);
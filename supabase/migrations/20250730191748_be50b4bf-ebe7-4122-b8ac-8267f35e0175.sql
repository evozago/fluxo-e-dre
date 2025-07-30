-- Criar tabela de entidades (empresas e pessoa física)
CREATE TABLE public.entidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PJ', 'PF')), -- Pessoa Jurídica ou Física
  cnpj_cpf TEXT,
  razao_social TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir entidades padrão
INSERT INTO public.entidades (nome, tipo, cnpj_cpf, razao_social) VALUES 
('Lui Bambini Ltda', 'PJ', '33.133.217/0001-29', 'LUI BAMBINI COM DE ROUPAS E CALC LTDA'),
('Empresa 2', 'PJ', '00.000.000/0001-00', 'SEGUNDA EMPRESA LTDA'),
('Pessoa Física', 'PF', '000.000.000-00', 'PESSOA FÍSICA');

-- Adicionar coluna na tabela de parcelas para referenciar a entidade
ALTER TABLE public.ap_installments 
ADD COLUMN entidade_id UUID REFERENCES public.entidades(id);

-- Atualizar parcelas existentes para usar a primeira entidade como padrão
UPDATE public.ap_installments 
SET entidade_id = (SELECT id FROM public.entidades LIMIT 1)
WHERE entidade_id IS NULL;

-- Tornar o campo obrigatório
ALTER TABLE public.ap_installments 
ALTER COLUMN entidade_id SET NOT NULL;

-- Enable RLS na tabela entidades
ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

-- Criar políticas para entidades (permitir todas as operações por enquanto)
CREATE POLICY "Allow all operations on entidades" 
ON public.entidades 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para updated_at na tabela entidades
CREATE TRIGGER update_entidades_updated_at
  BEFORE UPDATE ON public.entidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
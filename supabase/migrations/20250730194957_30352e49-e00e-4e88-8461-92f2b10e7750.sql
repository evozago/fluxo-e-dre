-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj_cpf TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX idx_fornecedores_nome ON public.fornecedores(nome);
CREATE INDEX idx_fornecedores_cnpj_cpf ON public.fornecedores(cnpj_cpf);
CREATE INDEX idx_fornecedores_ativo ON public.fornecedores(ativo);

-- Habilitar RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações
CREATE POLICY "Allow all operations on fornecedores" 
ON public.fornecedores 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar alguns fornecedores exemplo
INSERT INTO public.fornecedores (nome, cnpj_cpf) VALUES 
('Fornecedor Exemplo 1', '12.345.678/0001-90'),
('Fornecedor Exemplo 2', '98.765.432/0001-10'),
('João Silva (PF)', '123.456.789-00');
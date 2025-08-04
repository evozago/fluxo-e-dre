-- Criar tabela para representantes e contatos
CREATE TABLE IF NOT EXISTS public.representantes_contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome_representante TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  marcas TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.representantes_contatos ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on representantes_contatos" 
ON public.representantes_contatos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_representantes_contatos_updated_at
BEFORE UPDATE ON public.representantes_contatos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_representantes_contatos_fornecedor_id ON public.representantes_contatos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_representantes_contatos_email ON public.representantes_contatos(email);
CREATE INDEX IF NOT EXISTS idx_representantes_contatos_ativo ON public.representantes_contatos(ativo);
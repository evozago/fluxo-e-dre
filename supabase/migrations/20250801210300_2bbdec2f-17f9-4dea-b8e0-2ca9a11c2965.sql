-- Criar tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  salario NUMERIC NOT NULL DEFAULT 0,
  dias_uteis_mes INTEGER NOT NULL DEFAULT 22,
  valor_transporte_dia NUMERIC NOT NULL DEFAULT 8.6,
  valor_transporte_total NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- Create policy for funcionarios
CREATE POLICY "Allow all operations on funcionarios" 
ON public.funcionarios 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add funcionario_id to ap_installments table
ALTER TABLE public.ap_installments 
ADD COLUMN funcionario_id UUID REFERENCES public.funcionarios(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_funcionarios_updated_at
BEFORE UPDATE ON public.funcionarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
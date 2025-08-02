-- Corrigir check constraint da tabela entidades
ALTER TABLE entidades DROP CONSTRAINT IF EXISTS entidades_tipo_check;
ALTER TABLE entidades ADD CONSTRAINT entidades_tipo_check 
CHECK (tipo IN ('cliente', 'fornecedor', 'funcionario'));

-- Adicionar constraints de unicidade para CPF/CNPJ (verificar se já existem primeiro)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_cpf_unique') THEN
        ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_cpf_unique UNIQUE (cpf);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_cnpj_cpf_unique') THEN
        ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_cnpj_cpf_unique UNIQUE (cnpj_cpf);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entidades_cnpj_cpf_unique') THEN
        ALTER TABLE entidades ADD CONSTRAINT entidades_cnpj_cpf_unique UNIQUE (cnpj_cpf);
    END IF;
END $$;

-- Criar tabela de contas bancárias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_banco TEXT NOT NULL,
    agencia TEXT,
    conta TEXT,
    tipo_conta TEXT CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')),
    saldo_atual NUMERIC NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS na tabela contas_bancarias
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- Criar política para contas_bancarias
CREATE POLICY "Allow all operations on contas_bancarias" 
ON public.contas_bancarias 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contas_bancarias_updated_at
BEFORE UPDATE ON public.contas_bancarias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna conta_bancaria_id em ap_installments para vincular pagamentos
ALTER TABLE ap_installments ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);

-- Criar tabela de histórico de alterações
CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    campo_alterado TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario TEXT,
    motivo TEXT,
    data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS na tabela historico_alteracoes
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Criar política para historico_alteracoes
CREATE POLICY "Allow all operations on historico_alteracoes" 
ON public.historico_alteracoes 
FOR ALL 
USING (true)
WITH CHECK (true);
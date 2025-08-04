-- Adicionar colunas para novas funcionalidades na tabela ap_installments
ALTER TABLE public.ap_installments 
ADD COLUMN IF NOT EXISTS numero_parcela INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS valor_total_titulo NUMERIC,
ADD COLUMN IF NOT EXISTS eh_recorrente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_recorrencia TEXT, -- 'mensal', 'anual', etc.
ADD COLUMN IF NOT EXISTS valor_fixo BOOLEAN DEFAULT true; -- se false, é variável

-- Atualizar parcelas existentes para ter valor_total_titulo igual ao valor se não estiver definido
UPDATE public.ap_installments 
SET valor_total_titulo = valor 
WHERE valor_total_titulo IS NULL;